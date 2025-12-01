# レートリミット設定ガイド

## 概要

このアプリケーションでは、DDoS攻撃やAPI連打攻撃からAI機能を保護するために、Upstash Redisベースのレートリミットを実装しています。

## 環境変数の設定

Upstash Redisのダッシュボード（https://console.upstash.com/）からプロジェクトを作成し、以下の環境変数を設定してください。

```env
# Upstash Redis設定（レートリミット用）
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxx...
```

### Vercelでの設定

1. Vercelダッシュボードでプロジェクトを開く
2. Settings > Environment Variables へ移動
3. 上記の2つの環境変数を追加
4. Production, Preview, Development の全環境に適用

### ローカル開発環境での設定

`.env.local` ファイルに上記の環境変数を追加してください。

## レートリミット設定

現在の設定値（`lib/rate-limiter.ts`で管理）:

| API種別 | 制限回数 | 時間窓 |
|---------|---------|--------|
| AI API | 5回 | 1分間 |
| 一般API | 30回 | 1分間 |

## 対象API

レートリミットが適用されているエンドポイント:

- `/api/ai/analyze-sessions` - AIフィードバック生成
- `/api/ai/get-feedback` - 既存フィードバック取得

## フェイルオープン設計

Redis接続に問題が発生した場合や環境変数が未設定の場合、リクエストは許可されます。これにより、レートリミットの障害がサービス全体に影響することを防ぎます。

## ユーザー向けエラーメッセージ

レート制限に達した場合、以下のレスポンスが返されます:

```json
{
  "error": "しばらく経ってから再度お試しください。",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

HTTPステータス: `429 Too Many Requests`
Retry-Afterヘッダー: 再試行可能になるまでの秒数

## セキュリティ考慮事項

- エラーメッセージはユーザー向けと開発者向けで分離
- 開発者向けログは `safe-logger` を使用し、本番環境では詳細情報を出力しない（機密情報は自動マスク）
- ユーザーIDをベースにしたレート制限（認証済みユーザー）
- IPアドレスをベースにしたレート制限（未認証リクエスト）

### IP取得の優先順位

Vercel環境でのIP偽装を防ぐため、以下の優先順位でクライアントを識別:

1. **ユーザーID**（認証済みの場合 - 最も信頼性が高い）
2. **x-vercel-forwarded-for**（Vercelが付与する信頼済みIP - 偽装不可）
3. **x-forwarded-for / x-real-ip**（フォールバック - 偽装可能なため注意）

## コスト管理

`analytics: false` に設定しています。

- Upstashダッシュボードでのブロック数分析は無効
- リクエスト数としてカウントされないため、コスト削減
- 必要に応じて `lib/rate-limiter.ts` で `analytics: true` に変更可能

## Upstashダッシュボードでの監視

Upstashダッシュボードでは以下を確認できます:
- リクエスト数の推移
- レートリミットに達したリクエストの数
- 地域別のアクセス状況

