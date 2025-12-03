-- ==========================================
-- 自己成長記録アプリ Stripeサブスクリプション管理スキーマ
-- Stripe決済とサブスクリプション管理
-- ==========================================

-- ==========================================
-- 既存ビューの削除（もし存在すれば）
-- ==========================================
DROP VIEW IF EXISTS public.user_subscription;

-- ==========================================
-- usersテーブルにStripe関連カラムを追加
-- ==========================================

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'standard', 'premium'));

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON public.users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);

-- ==========================================
-- subscriptionテーブルを作成
-- ==========================================

CREATE TABLE IF NOT EXISTS public.subscription (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT UNIQUE,
    stripe_price_id TEXT,
    stripe_current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_subscription_user_id ON public.subscription(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_stripe_customer_id ON public.subscription(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscription_stripe_subscription_id ON public.subscription(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_stripe_current_period_end ON public.subscription(stripe_current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscription_cancel_at_period_end ON public.subscription(cancel_at_period_end) WHERE cancel_at_period_end = TRUE;

-- ==========================================
-- 更新日時自動更新トリガー
-- ==========================================

DROP TRIGGER IF EXISTS handle_updated_at_subscription ON public.subscription;
CREATE TRIGGER handle_updated_at_subscription 
BEFORE UPDATE ON public.subscription
FOR EACH ROW 
EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================
-- RLS（Row Level Security）設定
-- ==========================================

ALTER TABLE public.subscription ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscription;
CREATE POLICY "Users can view own subscription" ON public.subscription
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscription;
CREATE POLICY "Users can insert own subscription" ON public.subscription
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscription;
CREATE POLICY "Users can update own subscription" ON public.subscription
    FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- ユーザー登録時に自動でFreeプランのサブスクリプションを作成
-- ==========================================

CREATE OR REPLACE FUNCTION public.create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- subscriptionレコードを作成
    INSERT INTO public.subscription (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_default_subscription_trigger ON public.users;
CREATE TRIGGER create_default_subscription_trigger
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.create_default_subscription();
