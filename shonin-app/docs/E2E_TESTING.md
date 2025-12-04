# E2Eテスト実装ガイド

このドキュメントは、Playwrightを使用したE2Eテストの実装について説明します。

## 実装されたテスト

以下の4つの重要な機能に対するE2Eテストが実装されています：

### 1. 認証機能（`e2e/auth.spec.ts`）

**テスト内容:**
- ログインページの表示確認
- Google OAuth認証フローの開始
- 未認証ユーザーのリダイレクト処理
- 認証コールバックの処理
- ログアウト機能

**実行方法:**
```bash
npm run test:e2e:auth
```

**注意事項:**
- Google OAuth認証の完全な自動化は、セキュリティ上の理由から困難です
- テストでは認証フローが開始されることを確認し、認証ページへのリダイレクトを検証します
- 完全な認証フローのテストには、テスト専用のGoogleアカウントとPlaywright Authの使用を推奨します

### 2. Stripe決済フロー（`e2e/stripe.spec.ts`）

**テスト内容:**
- プラン選択ページの表示
- 各プランの表示確認
- Stripe Checkoutセッションの作成
- 決済ページへのリダイレクト
- Webhookエンドポイントの存在確認
- セキュリティチェック（不正なWebhookリクエストの拒否）
- サブスクリプション管理ページの表示

**実行方法:**
```bash
npm run test:e2e:stripe
```

**Stripeテストカード:**
```
成功: 4242 4242 4242 4242
拒否: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

**注意事項:**
- Stripeはテストモードで実行してください
- 実際のカード決済は行われません
- Webhookのテストには、ローカルでStripe CLIを使用するか、テスト環境でWebhookシークレットを設定してください

### 3. メール送信機能（`e2e/email.spec.ts`）

**テスト内容:**
- メール送信APIエンドポイントの存在確認
- CSRF保護の検証
- 認証チェック（未認証アクセスの拒否）
- メールテンプレートのレンダリング確認
- バリデーションエラーのハンドリング
- 不正なパラメータでのエラー処理
- Resend API統合の確認

**実行方法:**
```bash
npm run test:e2e:email
```

**注意事項:**
- テスト環境ではメール送信をモック化することを推奨します
- または、テスト用のメールアドレスを使用してください
- Resend APIキーが設定されていることを確認してください

### 4. AIフィードバック生成（`e2e/ai-feedback.spec.ts`）

**テスト内容:**
- フィードバックページの表示
- フィードバック一覧の表示確認
- 週間・月間フィードバックの区別
- 未読フィードバックの表示
- フィードバック詳細の表示
- AIフィードバック生成APIの確認
- 認証とバリデーションチェック
- Cron Jobエンドポイントの確認
- Anthropic API統合の確認

**実行方法:**
```bash
npm run test:e2e:ai
```

**注意事項:**
- Anthropic APIキーが必要です
- 実際のAI生成はコストがかかるため、テスト環境ではモックを推奨します
- Cron Jobのテストには適切な認証トークンが必要です

## セットアップ手順

### 1. Playwrightのインストール

```bash
npm install
npx playwright install chromium
```

### 2. 環境変数の設定

以下の環境変数を`.env.local`または`.env.test`に設定してください：

```env
# 基本設定
BASE_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe（テストモード）
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STANDARD_PRICE_ID=price_test_...
STRIPE_PREMIUM_PRICE_ID=price_test_...

# Resend
RESEND_API_KEY=re_...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Cron認証
CRON_SECRET=your_cron_secret
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

## テストの実行

### すべてのテストを実行

```bash
npm run test:e2e
```

### UIモードで実行（推奨）

```bash
npm run test:e2e:ui
```

UIモードでは以下が可能です：
- インタラクティブなテスト実行
- ステップバイステップのデバッグ
- タイムトラベル機能
- スクリーンショットとトレースの確認

### 個別のテストを実行

```bash
# 認証テスト
npm run test:e2e:auth

# Stripeテスト
npm run test:e2e:stripe

# メールテスト
npm run test:e2e:email

# AIフィードバックテスト
npm run test:e2e:ai
```

### デバッグモードで実行

```bash
npm run test:e2e:debug
```

### テストレポートの表示

```bash
npm run test:e2e:report
```

## ファイル構造

```
e2e/
├── auth.spec.ts              # 認証テスト
├── stripe.spec.ts            # Stripe決済テスト
├── email.spec.ts             # メール送信テスト
├── ai-feedback.spec.ts       # AIフィードバックテスト
├── fixtures/
│   └── test-data.ts         # テストデータとモック
├── utils/
│   └── test-helpers.ts      # ヘルパー関数
└── README.md                 # テストガイド
```

## ヘルパー関数

`e2e/utils/test-helpers.ts`には、以下のヘルパー関数が含まれています：

- `waitForPageLoad()` - ページロードの待機
- `waitForNavigation()` - ナビゲーションの待機
- `waitForLoadingToFinish()` - ローディング終了の待機
- `expectNoErrorMessages()` - エラーメッセージがないことの確認
- `expectToastMessage()` - トーストメッセージの確認
- `expectModalOpen()` - モーダル表示の確認
- `fillForm()` - フォーム入力
- `selectOption()` - セレクトボックスの選択
- その他多数

## テストデータとモック

`e2e/fixtures/test-data.ts`には、以下が定義されています：

- テスト用のユーザー情報
- アクティビティデータ
- セッションデータ
- 目標データ
- StripeプランID
- Stripeテストカード情報
- モックのAIフィードバック
- メールテンプレート

## CI/CD統合

### GitHub Actionsの設定例

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium
        
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          BASE_URL: ${{ secrets.BASE_URL }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          # その他の環境変数...
          
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## トラブルシューティング

### テストがタイムアウトする

```typescript
// playwright.config.tsでタイムアウトを調整
timeout: 120 * 1000, // 120秒
```

### 認証状態が保持されない

Playwright Authを使用して認証状態を保存：

```typescript
// auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  // 認証処理...
  await page.context().storageState({ path: 'auth.json' });
});
```

### CI/CDでテストが失敗する

- 環境変数が正しく設定されているか確認
- タイムアウト値を増やす
- ヘッドレスモードで実行されているか確認
- スクリーンショットとトレースで原因を特定

## ベストプラクティス

1. **テストの独立性**
   - 各テストは独立して実行可能にする
   - 他のテストに依存しない

2. **適切な待機**
   - `waitForLoadState`を活用
   - 固定の`waitForTimeout`は最小限に

3. **セレクタの選択**
   - `data-testid`属性を優先
   - セマンティックなロールを活用
   - 脆弱なセレクタは避ける

4. **エラーハンドリング**
   - 意味のあるエラーメッセージ
   - スクリーンショットでデバッグ
   - トレースの活用

5. **モックの活用**
   - 外部APIはモック化を検討
   - コストのかかる操作はモック

## セキュリティ

- 機密情報をコミットしない
- テスト専用のアカウントを使用
- APIキーは環境変数で管理
- テストデータは定期的にクリーンアップ

## パフォーマンス

- 並列実行を活用（`workers`設定）
- 不要なテストはスキップ
- ヘッドレスモードで実行
- キャッシュを活用

## 今後の拡張予定

- [ ] 画像アップロード機能のテスト
- [ ] カレンダーUIのインタラクションテスト
- [ ] セッション記録のE2Eテスト
- [ ] 目標設定と進捗管理のテスト
- [ ] 多言語対応のテスト
- [ ] モバイルブラウザでのテスト
- [ ] アクセシビリティテスト

## 参考資料

- [Playwright公式ドキュメント](https://playwright.dev/)
- [Next.js E2Eテストガイド](https://nextjs.org/docs/testing#playwright)
- [Supabase テストガイド](https://supabase.com/docs/guides/getting-started/testing)
- [Stripe テストガイド](https://stripe.com/docs/testing)
- [Resend ドキュメント](https://resend.com/docs)
- [Anthropic API ドキュメント](https://docs.anthropic.com/)

## サポート

質問や問題がある場合は、以下を確認してください：

1. このドキュメント
2. `e2e/README.md`
3. Playwrightの公式ドキュメント
4. プロジェクトのIssueページ

---

作成日: 2024-12-04  
最終更新: 2024-12-04

