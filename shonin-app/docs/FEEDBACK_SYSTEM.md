# フィードバックシステム設計書

## 概要

AIによる週次・月次フィードバックを自動生成し、ユーザーに通知する仕組みです。

## アーキテクチャ

### 1. データベース設計

#### ai_feedbackテーブル
- `id`: UUID (主キー)
- `user_id`: UUID (ユーザーID)
- `feedback_type`: TEXT ('weekly' | 'monthly')
- `content_encrypted`: BYTEA (暗号化されたフィードバック内容)
- `period_start`: DATE (対象期間開始日)
- `period_end`: DATE (対象期間終了日)
- `is_read`: BOOLEAN (既読フラグ)
- `read_at`: TIMESTAMP (既読日時)
- `created_at`: TIMESTAMP (作成日時)

#### データベース関数
- `get_unread_feedback_count()`: 未読フィードバック数を取得
- `mark_feedback_as_read(p_feedback_id)`: 特定のフィードバックを既読にする
- `mark_all_feedback_as_read()`: すべてのフィードバックを既読にする
- `insert_encrypted_feedback()`: 暗号化されたフィードバックを挿入

### 2. Vercel Cron Job

#### 週次フィードバック
- **スケジュール**: 毎週月曜日 9:00 JST
- **対象期間**: 先週の月曜日〜日曜日
- **エンドポイント**: `/api/cron/generate-feedback`

#### 月次フィードバック
- **スケジュール**: 毎月1日 9:00 JST
- **対象期間**: 先月の1日〜末日
- **エンドポイント**: `/api/cron/generate-feedback?type=monthly`

### 3. フロントエンド実装

#### コンテキスト
- `FeedbackContext`: 未読数をグローバルに管理

#### フック
- `useFeedback()`: 未読数の取得・更新

#### コンポーネント
- サイドバー・ボトムナビゲーション: 未読バッジ表示
- フィードバックページ: 開いたら自動的に既読にする

## セットアップ手順

### 1. データベースマイグレーション

Supabase SQL Editorで以下のマイグレーションを実行：

\`\`\`bash
# 既読/未読管理機能を追加
database/migration-feedback-read-status.sql
\`\`\`

### 2. 環境変数設定

\`\`\`.env.local
# Supabase（既存）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # 新規追加

# Anthropic Claude API（既存）
ANTHROPIC_API_KEY=your_anthropic_api_key

# Vercel Cron Job認証（新規追加）
CRON_SECRET=your_random_secret_string  # ランダムな文字列を生成
\`\`\`

#### CRON_SECRETの生成方法

\`\`\`bash
# Node.jsで生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# またはオンラインツールを使用
# https://www.random.org/strings/
\`\`\`

### 3. Vercelへのデプロイ

1. **環境変数を設定**
   - Vercel Dashboard > Project > Settings > Environment Variables
   - `SUPABASE_SERVICE_ROLE_KEY`と`CRON_SECRET`を追加

2. **Cron Jobが自動的に有効化される**
   - `vercel.json`の設定が自動的に読み込まれます
   - Vercel Dashboard > Project > Settings > Cron Jobsで確認可能

3. **手動テスト**
   ```bash
   curl -X GET "https://your-domain.vercel.app/api/cron/generate-feedback" \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

## 動作フロー

### フィードバック生成フロー

1. **Cron Jobトリガー**（毎週月曜9:00 / 毎月1日9:00）
2. **すべてのユーザーを取得**
3. **各ユーザーごとに処理**:
   - 対象期間のセッションを取得（復号化ビュー使用）
   - セッションがない場合はスキップ
   - 既存フィードバックがある場合はスキップ
   - 過去のフィードバックを取得（より良い分析のため）
   - **Anthropic Claude API**でフィードバック生成
     - 週次: Claude Sonnet 4（高速・コスト効率）
     - 月次: Claude Opus 4（高品質）
   - セッション分析・プロンプト生成（既存ロジック使用）
   - JSON形式でフィードバック生成
   - pgcryptoで暗号化してデータベースに保存（`is_read = false`）

### 既読管理フロー

1. **ページロード時**
   - `FeedbackContext`が未読数を取得
   - サイドバー・ボトムナビに通知バッジ表示

2. **フィードバックページを開く**
   - `markAllFeedbacksAsRead()`を実行
   - 未読数を0にする（楽観的UI更新）
   - サーバーで既読フラグを更新
   - 通知バッジが消える

## トラブルシューティング

### Cron Jobが実行されない

1. **Vercel Dashboard確認**
   - Settings > Cron Jobs
   - Logs を確認

2. **環境変数確認**
   - `CRON_SECRET`が正しく設定されているか
   - `SUPABASE_SERVICE_ROLE_KEY`が設定されているか

3. **手動実行テスト**
   ```bash
   curl -X GET "https://your-domain.vercel.app/api/cron/generate-feedback" \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

### 未読数が更新されない

1. **ブラウザコンソール確認**
   - ネットワークエラーがないか
   - API呼び出しが成功しているか

2. **Supabase確認**
   - RLSポリシーが正しく設定されているか
   - 関数が正しく作成されているか

3. **リフレッシュ**
   - `refreshUnreadCount()`を手動で呼び出し

### フィードバックが生成されない

1. **Anthropic API Key確認**
   - 正しく設定されているか
   - クレジットが残っているか
   - Claude 4モデルへのアクセス権限があるか

2. **Supabase Service Role Key確認**
   - 正しく設定されているか
   - 権限があるか

3. **ログ確認**
   - Vercel Dashboard > Deployments > Functions
   - エラーログを確認
   - `safe-logger`のログを確認

## セキュリティ

### 暗号化
- フィードバック内容は`pgcrypto`で暗号化
- ユーザーIDを暗号化キーとして使用

### RLS（Row Level Security）
- ユーザーは自分のフィードバックのみアクセス可能
- 既読フラグの更新も自分のもののみ

### Cron Job認証
- `CRON_SECRET`による認証
- 外部からの不正実行を防止

## 今後の拡張案

### プッシュ通知
- Web Push APIを使用
- 新しいフィードバックがあるときに通知

### メール通知
- Resendを使用
- 週次・月次フィードバックをメールで送信

### フィードバックの詳細表示
- 各フィードバックの詳細ページ
- グラフやチャートでの可視化

### カスタマイズ
- フィードバックの頻度設定
- フィードバックのトーン設定（優しい/厳しい）

