# ログセキュリティガイド

## 概要
このドキュメントは、ログに個人情報やトークンが漏れないようにするための安全なロギング実装を説明します。

## 問題点

### ❌ 危険なログの例

```typescript
// ❌ ユーザーIDが完全に露出
console.log('User ID:', userId);

// ❌ メールアドレスが露出
console.error('認証エラー:', { email: user.email, error });

// ❌ トークンが露出
console.log('Authorization:', request.headers.get('authorization'));

// ❌ Cookieが露出
console.log('Cookie:', request.headers.get('cookie'));
```

**リスク:**
- ログからユーザーIDを特定される
- メールアドレスが漏洩
- トークンが盗まれる
- セッションハイジャック

## 解決策: 安全なロガー

### 使い方

```typescript
import { safeLog, safeWarn, safeError, stripeLog } from '@/lib/safe-logger';

// ✅ 一般的なログ（機密情報は自動マスク）
safeLog('ユーザー情報取得', { 
  userId: 'uuid-1234-5678',  // → 'uuid-123...5678'
  email: 'user@example.com'  // → '***REDACTED***'
});

// ✅ 警告ログ
safeWarn('CSRF attempt detected', {
  origin: request.headers.get('origin'),
  referer: request.headers.get('referer'),
});

// ✅ エラーログ
safeError('認証エラー', error);

// ✅ Stripe関連のログ
stripeLog('Checkout completed', {
  user_id: userId,        // → 部分マスク
  priceId: 'price_123',   // → そのまま表示
  plan: 'standard'        // → そのまま表示
});
```

### 自動マスクされる情報

#### 完全マスク（`***REDACTED***`）
- `password`
- `token`
- `secret`
- `api_key` / `apiKey`
- `access_token` / `refresh_token`
- `authorization`
- `cookie`
- `session`
- `email`
- `phone`
- `ssn`
- `credit_card` / `card_number`

#### 部分マスク（最初と最後のみ表示）
- `user_id` / `userId` → `uuid-123...5678`
- `customer_id` / `customerId` → `cus_1234...5678`
- `subscription_id` / `subscriptionId` → `sub_1234...5678`

#### そのまま表示
- `price_id` / `priceId`
- `plan`
- `status`
- `amount`
- エラーメッセージ
- スタックトレース

## 実装例

### Before（危険）

```typescript
// ❌ 危険
export async function updateGoal(id: string, data: any) {
  try {
    const user = await getCurrentUser();
    console.log('目標更新:', { 
      goalId: id, 
      userId: user.id,  // 完全に露出
      email: user.email // 完全に露出
    });
    // ...
  } catch (error) {
    console.error('エラー:', error);
  }
}
```

### After（安全）

```typescript
// ✅ 安全
import { safeLog, safeError } from '@/lib/safe-logger';

export async function updateGoal(id: string, data: any) {
  try {
    const user = await getCurrentUser();
    safeLog('目標更新', { 
      goalId: id, 
      userId: user.id,  // → 'uuid-123...5678'
      email: user.email // → '***REDACTED***'
    });
    // ...
  } catch (error) {
    safeError('目標更新エラー', error);
  }
}
```

## Stripe Webhook のログ

### Before（危険）

```typescript
// ❌ 危険
console.log('User ID:', userId);
console.log('Customer ID:', customerId);
console.log('Subscription ID:', subscriptionId);
```

**問題点:**
- ユーザーIDが完全に露出
- Stripe IDが完全に露出
- ログから個人を特定できる

### After（安全）

```typescript
// ✅ 安全
import { stripeLog } from '@/lib/safe-logger';

stripeLog('Subscription Update', {
  user_id: userId,              // → 'uuid-123...5678'
  customer_id: customerId,      // → 'cus_1234...5678'
  subscription_id: subscriptionId, // → 'sub_1234...5678'
  priceId: 'price_123',         // → そのまま表示
  plan: 'standard',             // → そのまま表示
  status: 'active'              // → そのまま表示
});
```

**出力例:**
```
Subscription Update {
  user_id: 'uuid-123...5678',
  customer_id: 'cus_1234...5678',
  subscription_id: 'sub_1234...5678',
  priceId: 'price_1234567890',
  plan: 'standard',
  status: 'active'
}
```

## デバッグログ

開発環境でのみ出力されるデバッグログ：

```typescript
import { debugLog } from '@/lib/safe-logger';

// 開発環境のみ出力
debugLog('詳細なデバッグ情報', { 
  userId: user.id,
  data: someData 
});
```

## ユーザーアクションログ

ユーザーの行動を記録する場合：

```typescript
import { userActionLog } from '@/lib/safe-logger';

userActionLog('goal_created', { 
  userId: user.id,  // 部分マスク
  goalId: goal.id,
  title: goal.title 
});
```

## ログレベルの使い分け

| レベル | 用途 | 例 |
|--------|------|-----|
| `safeLog` | 通常の情報ログ | 処理の開始・完了 |
| `safeWarn` | 警告（処理は続行） | CSRF試行、レート制限 |
| `safeError` | エラー（処理失敗） | DB接続エラー、API失敗 |
| `debugLog` | デバッグ（開発のみ） | 詳細な変数の値 |
| `stripeLog` | Stripe関連 | Webhook処理 |
| `userActionLog` | ユーザー行動 | 目標作成、セッション記録 |

## 本番環境での注意点

### 1. 環境変数でログレベルを制御

```typescript
// .env.production
LOG_LEVEL=error  // 本番環境ではエラーのみ
```

### 2. ログの保存期間

- **開発環境:** 無制限
- **本番環境:** 30日間（GDPR対応）

### 3. ログの暗号化

本番環境のログは暗号化して保存することを推奨：

```typescript
// Vercelの場合、ログは自動的に暗号化されます
```

## チェックリスト

新しいログを追加する前に確認：

- [ ] `console.log` の代わりに `safeLog` を使用
- [ ] `console.error` の代わりに `safeError` を使用
- [ ] ユーザーIDは部分マスクされる
- [ ] メールアドレスは完全マスクされる
- [ ] トークンは完全マスクされる
- [ ] Stripe IDは部分マスクされる
- [ ] エラーメッセージに個人情報が含まれない

## 既存コードの移行

### 移行手順

1. `lib/safe-logger.ts` をインポート
2. `console.log` → `safeLog` に置換
3. `console.error` → `safeError` に置換
4. `console.warn` → `safeWarn` に置換
5. Stripe関連は `stripeLog` を使用

### 移行例

```bash
# 一括置換（慎重に）
find app -name "*.ts" -exec sed -i '' 's/console\.log/safeLog/g' {} \;
find app -name "*.ts" -exec sed -i '' 's/console\.error/safeError/g' {} \;
find app -name "*.ts" -exec sed -i '' 's/console\.warn/safeWarn/g' {} \;
```

**注意:** 一括置換後、必ず動作確認してください。

## トラブルシューティング

### ログが出力されない

**原因:** ログレベルが高すぎる

**解決策:**
```bash
# .env.local
LOG_LEVEL=debug
```

### マスクされすぎて調査できない

**原因:** 本番環境で詳細なログが必要

**解決策:**
```typescript
// 一時的に詳細ログを有効化（本番環境では慎重に）
if (process.env.ENABLE_DETAILED_LOGS === 'true') {
  console.log('詳細ログ:', data);
}
```

## 参考資料

- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [GDPR Article 32 - Security of processing](https://gdpr-info.eu/art-32-gdpr/)
- [Vercel Logs](https://vercel.com/docs/observability/runtime-logs)

## 変更履歴

- 2025-01-XX: 初版作成（安全なロギング実装）

