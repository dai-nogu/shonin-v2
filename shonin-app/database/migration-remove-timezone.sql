-- タイムゾーンカラムを削除（ブラウザのローカルタイムゾーンを使用するため不要）
-- 実行: Supabase SQL Editor で実行

-- 1. timezoneカラムを削除
ALTER TABLE public.users DROP COLUMN IF EXISTS timezone;

-- 2. 確認
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' AND table_schema = 'public';

