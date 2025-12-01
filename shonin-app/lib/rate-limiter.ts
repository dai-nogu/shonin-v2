import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import { safeWarn } from './safe-logger';

// レートリミットの設定タイプ
interface RateLimitConfig {
  // 制限回数
  requests: number;
  // 時間窓（秒）
  windowSeconds: number;
}

// デフォルト設定: AI API用（1分間に5回まで）
const AI_API_LIMIT: RateLimitConfig = {
  requests: 5,
  windowSeconds: 60,
};

// 一般API用（1分間に30回まで）
const GENERAL_API_LIMIT: RateLimitConfig = {
  requests: 30,
  windowSeconds: 60,
};

// Redisクライアントの遅延初期化
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    safeWarn('Upstash Redis credentials not configured. Rate limiting is disabled.');
    return null;
  }
  
  redis = new Redis({
    url,
    token,
  });
  
  return redis;
}

// レートリミッターのキャッシュ
const rateLimiters = new Map<string, Ratelimit>();

function getRateLimiter(type: 'ai' | 'general'): Ratelimit | null {
  const redisClient = getRedis();
  if (!redisClient) return null;
  
  const cacheKey = type;
  if (rateLimiters.has(cacheKey)) {
    return rateLimiters.get(cacheKey)!;
  }
  
  const config = type === 'ai' ? AI_API_LIMIT : GENERAL_API_LIMIT;
  
  const limiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(config.requests, `${config.windowSeconds} s`),
    // コスト削減のためanalyticsは無効化
    // 有効にするとUpstashダッシュボードでブロック数などを分析可能だが、
    // リクエスト数としてカウントされる
    analytics: false,
    prefix: `ratelimit:${type}`,
  });
  
  rateLimiters.set(cacheKey, limiter);
  return limiter;
}

// レートリミットの結果型
interface RateLimitResult {
  success: boolean;
  // 制限に達した場合、再試行までの秒数
  retryAfterSeconds?: number;
  // エラーレスポンス（制限に達した場合）
  errorResponse?: NextResponse;
}

/**
 * リクエストのレートリミットをチェック
 * @param identifier ユーザーID または IPアドレス
 * @param type 'ai' | 'general' - API種別
 * @returns RateLimitResult
 */
export async function checkRateLimit(
  identifier: string,
  type: 'ai' | 'general' = 'ai'
): Promise<RateLimitResult> {
  const limiter = getRateLimiter(type);
  
  // レートリミッターが設定されていない場合は許可
  if (!limiter) {
    return { success: true };
  }
  
  try {
    const { success, reset } = await limiter.limit(identifier);
    
    if (!success) {
      // 再試行までの秒数を計算
      const now = Date.now();
      const retryAfterSeconds = Math.ceil((reset - now) / 1000);
      
      // サーバー側ログ（開発者向け）
      safeWarn('Rate limit exceeded', {
        identifier: identifier.substring(0, 8) + '...', // 識別子は一部のみログ
        type,
        retryAfterSeconds,
      });
      
      // ユーザー向けレスポンス（詳細情報は含めない）
      return {
        success: false,
        retryAfterSeconds,
        errorResponse: NextResponse.json(
          { 
            error: 'しばらく経ってから再度お試しください。',
            code: 'RATE_LIMIT_EXCEEDED'
          },
          { 
            status: 429,
            headers: {
              'Retry-After': String(retryAfterSeconds),
            },
          }
        ),
      };
    }
    
    return { success: true };
  } catch (error) {
    // Redis接続エラーなどの場合はリクエストを許可（フェイルオープン）
    safeWarn('Rate limit check failed', error);
    return { success: true };
  }
}

/**
 * リクエストからクライアント識別子を取得
 * 
 * Vercelでは信頼できるIPを提供するため、Vercel固有のヘッダーを優先使用
 * x-forwarded-forヘッダーは偽装可能なため、プラットフォーム固有のヘッダーを優先
 */
export function getClientIdentifier(request: Request | NextRequest, userId?: string): string {
  // 認証済みユーザーの場合はユーザーIDを使用（最も信頼性が高い）
  if (userId) {
    return `user:${userId}`;
  }
  
  // Vercel環境: x-vercel-forwarded-for を優先（Vercelが付与する信頼済みIP、偽装不可）
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return `ip:${vercelForwardedFor.split(',')[0].trim()}`;
  }
  
  // フォールバック: 一般的なヘッダーからIPを取得
  // 注意: x-forwarded-forは偽装可能なため、信頼性は低い
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  const ip = forwarded 
    ? forwarded.split(',')[0].trim() 
    : realIp ?? '127.0.0.1';
  
  return `ip:${ip}`;
}

/**
 * AI API用のレートリミットチェック（ヘルパー関数）
 */
export async function checkAIRateLimit(
  request: Request | NextRequest,
  userId?: string
): Promise<RateLimitResult> {
  const identifier = getClientIdentifier(request, userId);
  return checkRateLimit(identifier, 'ai');
}

/**
 * 一般API用のレートリミットチェック（ヘルパー関数）
 */
export async function checkGeneralRateLimit(
  request: Request | NextRequest,
  userId?: string
): Promise<RateLimitResult> {
  const identifier = getClientIdentifier(request, userId);
  return checkRateLimit(identifier, 'general');
}

