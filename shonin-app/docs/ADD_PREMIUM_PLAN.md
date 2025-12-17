# プレミアムプラン追加手順書

このドキュメントでは、将来的にプレミアムプランを追加する際の手順を説明します。

## 📋 前提条件

- Stripeでプレミアムプラン用のProductとPriceを作成済み
- Price IDを取得済み（例: `price_xxxxxxxxxxxxxxxxxxxxx`）

---

## 🚀 実装手順

### 1. Stripe Price IDの登録

**ファイル**: `/types/subscription.ts`

```typescript
// Stripe Price IDとプランタイプのマッピング
export const PRICE_ID_TO_PLAN: Record<string, PlanType> = {
  'price_1SfHdQIaAOyL3ERQKF2Gl2Um': 'standard',
  'price_xxxxxxxxxxxxxxxxxxxxx': 'premium', // ← ここを追加
} as const;

// プランタイプからStripe Price IDへの逆マッピング
// Partialを使って未実装のプランをオプショナルに
export const PLAN_TO_PRICE_ID: Partial<Record<Exclude<PlanType, 'free'>, string>> = {
  standard: 'price_1SfHdQIaAOyL3ERQKF2Gl2Um',
  premium: 'price_xxxxxxxxxxxxxxxxxxxxx', // ← コメントを外す
} as const;
```

**重要**: 
- ここを修正するだけで、Webhook処理やプラン判定が自動的に対応します！
- `Partial`型を使用しているため、未実装のプランをコメントアウトしてもTypeScriptエラーが出ません

---

### 2. プラン設定の有効化

**ファイル**: `/lib/plan-config.ts`

コメントアウトされているプレミアムプランのコードを有効化：

```typescript
export function getPlanConfigs(userPlan: PlanType = 'free'): Plan[] {
  const userPlanLevel = PLAN_HIERARCHY[userPlan];

  const plans: Plan[] = [
    // ... free と standard ...
    
    // プレミアムプラン（コメントを外す）
    {
      id: "premium",
      name: "premium",
      price: "$19.99", // ← 実際の価格に変更
      priceLabel: "per_month",
      priceId: PLAN_TO_PRICE_ID.premium,
      features: [],
      isCurrent: userPlan === 'premium',
      buttonText: userPlan === 'premium'
        ? 'current_plan'
        : userPlanLevel > PLAN_HIERARCHY.premium
          ? 'downgrade'
          : 'upgrade',
      buttonVariant: 'default' as const,
      isPopular: false, // 必要に応じてtrueに変更
    },
  ];

  return plans;
}
```

---

### 3. プラン機能制限の調整（オプション）

**ファイル**: `/types/subscription.ts`

プレミアムプランの機能制限を調整したい場合：

```typescript
export const PLAN_LIMITS = {
  // ... free と standard ...
  
  premium: {
    maxGoals: Infinity,           // ← 必要に応じて変更
    maxActivities: Infinity,      // ← 必要に応じて変更
    hasAIFeedback: true,
    hasPastCalendar: true,
    hasAdvancedAnalytics: true,   // ← プレミアム限定機能
  },
} as const;
```

---

### 4. UI機能比較の追加（オプション）

**ファイル**: `/lib/plan-config.ts`

プレミアム限定機能を追加する場合：

```typescript
export const planConfig = {
  plans: getPlanConfigs('free'),
  
  featureComparison: [
    // ... 既存の機能比較 ...
    
    // プレミアムプラン専用機能（コメントを外す）
    {
      label: "features.advanced_analytics_label",
      free: false,
      standard: false,
      premium: true,
    },
  ]
};
```

**翻訳ファイルにも追加**:
- `/messages/ja.json`
- `/messages/en.json`

```json
{
  "plan": {
    "features": {
      "advanced_analytics_label": "高度な分析機能",
      // ...
    }
  }
}
```

---

### 5. データベースの制約確認

**ファイル**: `/database/06-stripe-schema.sql`

すでにpremiumが追加されているため、**変更不要**です：

```sql
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' 
CHECK (subscription_status IN ('free', 'standard', 'premium'));
```

---

## ✅ 完了チェックリスト

プレミアムプラン追加時に確認すべき項目：

- [ ] Stripeでプレミアムプランを作成
- [ ] `/types/subscription.ts`にPrice IDを追加
- [ ] `/lib/plan-config.ts`でプレミアムプランのコメントを外す
- [ ] 価格を正しく設定（$19.99など）
- [ ] 翻訳ファイル（ja.json, en.json）にpremiumの翻訳を追加（済み）
- [ ] プラン機能制限を調整（必要に応じて）
- [ ] UI機能比較にプレミアム限定機能を追加（必要に応じて）
- [ ] テスト環境でStripe Webhookをテスト
- [ ] 本番環境でStripe Webhookを設定

---

## 🎯 最小限の変更でOK

基本的には以下の2ファイルのみ修正すれば動作します：

1. **`/types/subscription.ts`** - Price IDを追加
2. **`/lib/plan-config.ts`** - コメントを外して価格を設定

他のファイル（Webhook、型定義など）は自動的に対応します！

---

## 🔄 プラン追加後の動作確認

1. **Stripeテスト環境で購入テスト**
   ```bash
   # Stripe CLIでWebhookをローカルにフォワード
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

2. **データベース確認**
   ```sql
   SELECT id, email, subscription_status FROM users WHERE id = 'ユーザーID';
   SELECT * FROM subscription WHERE user_id = 'ユーザーID';
   ```

3. **プランページ表示確認**
   - `/plan` ページでプレミアムプランが表示されるか
   - 現在のプランが正しく表示されるか
   - アップグレード/ダウングレードボタンが正しく動作するか

---

## 🚨 注意事項

### 既存ユーザーへの影響

- プレミアムプラン追加は既存ユーザーに影響しません
- データベース制約はすでに対応済み
- 既存のスタンダードプランユーザーはそのまま継続

### Webhook設定

本番環境でプレミアムプランをリリースする際は、Stripe Webhookの設定を確認してください：

1. Stripeダッシュボード → Developers → Webhooks
2. Endpointを確認: `https://your-domain.com/api/stripe/webhook`
3. 以下のイベントが有効になっているか確認:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

---

## 📚 参考ファイル

実装の詳細については以下のファイルを参照：

- `/types/subscription.ts` - プラン型定義と機能制限
- `/lib/plan-config.ts` - プラン設定とUI表示
- `/app/api/stripe/webhook/route.ts` - Webhook処理（自動対応済み）
- `/app/actions/subscription-info.ts` - プラン情報取得（自動対応済み）
- `/components/pages/plan-page.tsx` - プランページUI

---

## 💡 Tips

### 段階的リリース

プレミアムプランを限定ユーザーのみに提供したい場合：

```typescript
// lib/plan-config.ts
export function getPlanConfigs(userPlan: PlanType = 'free'): Plan[] {
  const plans: Plan[] = [/* ... */];
  
  // プレミアムプランを一時的に非表示（管理画面などでは表示）
  const showPremium = process.env.NEXT_PUBLIC_SHOW_PREMIUM_PLAN === 'true';
  
  if (!showPremium) {
    return plans.filter(plan => plan.id !== 'premium');
  }
  
  return plans;
}
```

環境変数で制御することで、段階的にリリースできます。

---

**質問やサポートが必要な場合は、このドキュメントを参照してください！**

