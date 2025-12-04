# E2Eテストガイド

このディレクトリには、Playwrightを使用したE2E（エンドツーエンド）テストが含まれています。

## 📋 テスト対象

### 1. 認証機能 (`auth.spec.ts`)
- ✅ ログインページの表示
- ✅ Google OAuth認証フローの開始
- ✅ 未認証ユーザーのリダイレクト
- ✅ 認証コールバック処理
- ✅ ログアウト機能

### 2. Stripe決済フロー (`stripe.spec.ts`)
- ✅ プラン選択ページの表示
- ✅ Stripe Checkoutセッションの作成
- ✅ 決済ページへのリダイレクト
- ✅ Webhook処理（間接的）
- ✅ サブスクリプション管理

### 3. メール送信機能 (`email.spec.ts`)
- ✅ ウェルカムメールの送信
- ✅ サブスクリプション変更メール
- ✅ メールAPIのセキュリティチェック
- ✅ エラーハンドリング
- ✅ Resend API統合

### 4. AIフィードバック生成 (`ai-feedback.spec.ts`)
- ✅ フィードバック一覧の表示
- ✅ フィードバック詳細の表示
- ✅ AIフィードバック生成API
- ✅ Cron Jobによる自動生成
- ✅ Anthropic API統合

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Playwrightブラウザのインストール

```bash
npx playwright install chromium
```

### 3. 環境変数の設定

`.env.test.example`をコピーして`.env.local`または`.env.test`を作成し、必要な環境変数を設定してください。

```bash
cp .env.test.example .env.local
```

必要な環境変数：
- `BASE_URL`: テスト対象のURL（デフォルト: http://localhost:3000）
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key
- その他、Stripe、Resend、Anthropic APIのキー

## 🧪 テストの実行

### すべてのテストを実行

```bash
npm run test:e2e
```

### UIモードで実行（推奨）

```bash
npm run test:e2e:ui
```

UIモードでは、以下が可能です：
- テストの選択的実行
- ステップバイステップのデバッグ
- タイムトラベル機能
- スクリーンショットとトレースの確認

### ヘッドモードで実行（ブラウザが表示される）

```bash
npm run test:e2e:headed
```

### デバッグモードで実行

```bash
npm run test:e2e:debug
```

### 個別のテストファイルを実行

```bash
# 認証テストのみ
npm run test:e2e:auth

# Stripeテストのみ
npm run test:e2e:stripe

# メールテストのみ
npm run test:e2e:email

# AIフィードバックテストのみ
npm run test:e2e:ai
```

### 特定のテストケースを実行

```bash
npx playwright test --grep "ログインページが正しく表示される"
```

### テストレポートの表示

```bash
npm run test:e2e:report
```

## 📂 ディレクトリ構造

```
e2e/
├── auth.spec.ts              # 認証テスト
├── stripe.spec.ts            # Stripe決済テスト
├── email.spec.ts             # メール送信テスト
├── ai-feedback.spec.ts       # AIフィードバックテスト
├── fixtures/                 # テストデータとモック
│   └── test-data.ts         # テスト用データ定義
├── utils/                    # ヘルパー関数
│   └── test-helpers.ts      # テスト用ユーティリティ
└── README.md                 # このファイル
```

## ⚙️ 設定ファイル

### `playwright.config.ts`

Playwrightの設定ファイルです。以下を設定しています：

- タイムアウト設定
- レポート形式
- ブラウザ設定
- 開発サーバーの自動起動
- スクリーンショット・動画・トレースの設定

## 🔧 トラブルシューティング

### テストが失敗する場合

1. **環境変数の確認**
   ```bash
   # 必要な環境変数が設定されているか確認
   echo $NEXT_PUBLIC_SUPABASE_URL
   ```

2. **開発サーバーが起動しているか確認**
   ```bash
   npm run dev
   ```

3. **依存関係の再インストール**
   ```bash
   rm -rf node_modules
   npm install
   npx playwright install chromium
   ```

4. **デバッグモードで実行**
   ```bash
   npm run test:e2e:debug
   ```

### Google OAuth認証のテスト

Google OAuth認証の完全な自動化は、セキュリティ上の理由から困難です。現在のテストでは：

- ログインフローが開始されることを確認
- 認証ページへのリダイレクトを確認
- コールバック処理を確認

完全な認証フローをテストする場合は、以下の方法があります：

1. **テスト専用のGoogleアカウントを作成**
2. **Playwright Authを使用して認証状態を保存**
3. **手動でログインしてセッションを保存**

### Stripe決済のテスト

Stripeの決済フローは、テストモードのカード番号を使用してテストできます：

- 成功: `4242 4242 4242 4242`
- 拒否: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

詳細は[Stripeのテストドキュメント](https://stripe.com/docs/testing)を参照してください。

## 📊 テスト結果の確認

テスト実行後、以下の場所に結果が保存されます：

- **HTMLレポート**: `playwright-report/index.html`
- **スクリーンショット**: `test-results/`（失敗時のみ）
- **動画**: `test-results/`（失敗時のみ）
- **トレース**: `test-results/`（失敗時のみ）

## 🎯 ベストプラクティス

1. **テストは独立させる**
   - 各テストは他のテストに依存しないようにする
   - テストごとにクリーンな状態から開始する

2. **適切なセレクタを使用**
   - `data-testid`属性を使用（推奨）
   - セマンティックなロール（`role="button"`など）を活用
   - 脆弱なセレクタ（クラス名など）は避ける

3. **待機を適切に行う**
   - `waitForLoadState`を使用
   - `waitFor`でタイムアウトを設定
   - 固定の`waitForTimeout`は最小限に

4. **エラーハンドリング**
   - 予期しないエラーをキャプチャ
   - 意味のあるエラーメッセージを提供
   - スクリーンショットでデバッグ

5. **CI/CD統合**
   - GitHub Actionsなどで自動実行
   - 重要なテストを優先
   - 失敗時の通知設定

## 🔒 セキュリティ

- **機密情報をコミットしない**
  - `.env`ファイルは`.gitignore`に含める
  - APIキーは環境変数で管理

- **テスト専用のアカウントを使用**
  - 本番データを使用しない
  - 定期的にテストデータをクリーンアップ

- **APIレート制限に注意**
  - 過度なテスト実行を避ける
  - モックを活用する

## 📚 参考資料

- [Playwright公式ドキュメント](https://playwright.dev/)
- [Next.js E2Eテストガイド](https://nextjs.org/docs/testing#playwright)
- [Supabase テストガイド](https://supabase.com/docs/guides/getting-started/testing)
- [Stripe テストガイド](https://stripe.com/docs/testing)

## ❓ よくある質問

**Q: テストの実行に時間がかかりすぎる**

A: 以下を試してください：
- 不要なテストをスキップ（`test.skip()`）
- 並列実行を調整（`playwright.config.ts`の`workers`）
- ヘッドレスモードで実行

**Q: CI/CDでテストが失敗する**

A: 
- タイムアウト値を増やす
- 安定するまで待機時間を調整
- スクリーンショットとトレースで原因を特定

**Q: 認証状態を保存したい**

A: Playwright Authを使用：
```typescript
// auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  // ログイン処理
  await page.goto('/login');
  // ... 認証フロー ...
  // 認証状態を保存
  await page.context().storageState({ path: 'auth.json' });
});
```

## 🤝 コントリビューション

テストの追加や改善の提案は大歓迎です！以下のガイドラインに従ってください：

1. 新しいテストファイルは`e2e/`ディレクトリに配置
2. ヘルパー関数は`e2e/utils/`に追加
3. テストデータは`e2e/fixtures/`に定義
4. ドキュメントを更新

## 📝 更新履歴

- 2024-12-04: 初版作成
  - 認証、Stripe、メール、AIフィードバックのテストを実装
  - ヘルパー関数とフィクスチャを作成
  - ドキュメント作成

