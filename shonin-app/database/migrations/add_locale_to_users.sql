-- ==========================================
-- Add locale column to users table
-- 新規登録時のlocaleを保存し、メール送信時に使用する
-- ==========================================

-- localeカラムを追加（デフォルト: 'en'）
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en' CHECK (locale IN ('ja', 'en'));

-- 既存のユーザーにデフォルト値を設定
UPDATE public.users 
SET locale = 'en' 
WHERE locale IS NULL;

-- コメントを追加
COMMENT ON COLUMN public.users.locale IS 'User language preference for email notifications (ja or en)';
