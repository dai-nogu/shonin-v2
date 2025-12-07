/**
 * テストデータとモックデータ
 */

/**
 * テスト用のユーザー情報
 * 注意: 実際のテストではSupabaseのテスト環境を使用するか、
 * 専用のテストユーザーを作成してください
 */
export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
  name: 'テストユーザー',
};

/**
 * テスト用のアクティビティデータ
 */
export const TEST_ACTIVITIES = [
  {
    name: 'プログラミング学習',
    color: 'bg-blue-500',
    icon: '💻',
  },
  {
    name: 'ランニング',
    color: 'bg-green-500',
    icon: '🏃',
  },
  {
    name: '読書',
    color: 'bg-purple-500',
    icon: '📚',
  },
];

/**
 * テスト用のセッションデータ
 */
export const TEST_SESSION = {
  activityName: 'プログラミング学習',
  duration: 3600, // 1時間（秒）
  mood: 4,
  reflection: 'Reactのhooksについて学習しました。useEffectの使い方が理解できて良かったです。',
  date: new Date(),
};

/**
 * テスト用の目標データ
 */
export const TEST_GOAL = {
  title: '毎日1時間プログラミング学習する',
  description: 'Next.jsとTypeScriptを使ったWebアプリケーション開発のスキルを身につける',
  targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90日後
  category: 'スキルアップ',
};

/**
 * テスト用のStripeプランID
 */
export const STRIPE_TEST_PLAN_IDS = {
  free: 'free',
  standard: process.env.STRIPE_STANDARD_PRICE_ID || 'price_test_standard',
  premium: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_test_premium',
};

/**
 * Stripe テストカード番号
 * @see https://stripe.com/docs/testing
 */
export const STRIPE_TEST_CARDS = {
  success: {
    number: '4242424242424242',
    expiry: '12/34',
    cvc: '123',
    zip: '12345',
  },
  decline: {
    number: '4000000000000002',
    expiry: '12/34',
    cvc: '123',
    zip: '12345',
  },
  requiresAuth: {
    number: '4000002500003155',
    expiry: '12/34',
    cvc: '123',
    zip: '12345',
  },
};

/**
 * モックのAIフィードバックレスポンス
 */
export const MOCK_AI_FEEDBACK = {
  overview: 'この1週間、プログラミング学習に毎日取り組まれていますね。',
  insight: '特に平日の夜に集中して取り組む習慣が定着してきているようです。',
  closing: '継続は力なり。この調子で頑張りましょう！',
  principle_application: null,
  principle_definition: null,
};

/**
 * モックのメールテンプレート
 */
export const MOCK_EMAIL_TEMPLATES = {
  welcome: {
    subject: 'ようこそ！',
    emailType: 'welcome' as const,
  },
  subscriptionUpgrade: {
    subject: 'Standardプランへようこそ！',
    emailType: 'upgrade' as const,
  },
};

/**
 * テスト用の環境変数チェック
 */
export function checkTestEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'BASE_URL',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `必要な環境変数が設定されていません: ${missing.join(', ')}\n` +
      '.env.localファイルを確認してください。'
    );
  }
}

/**
 * ランダムなテストユーザーのメールアドレスを生成
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test-${timestamp}-${random}@example.com`;
}

/**
 * テスト用のSupabaseクライアントを作成
 */
export function getTestSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}

export function getTestSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
}

