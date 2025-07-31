-- セッションテーブルにsession_dateカラムを追加するマイグレーション
-- 実行前にデータベースのバックアップを取ることを推奨

-- 1. session_date カラムを追加
ALTER TABLE public.sessions 
ADD COLUMN session_date DATE;

-- 2. 既存のセッションにsession_dateを設定（start_timeベース、タイムゾーン考慮）
-- 日本時間（Asia/Tokyo）を基準にsession_dateを計算
UPDATE public.sessions 
SET session_date = (start_time AT TIME ZONE 'Asia/Tokyo')::date
WHERE session_date IS NULL;

-- 3. 今後のセッションにはsession_dateを必須にする（オプション）
-- ALTER TABLE public.sessions 
-- ALTER COLUMN session_date SET NOT NULL;

-- 4. インデックスを追加してパフォーマンスを向上
CREATE INDEX IF NOT EXISTS idx_sessions_session_date ON public.sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON public.sessions(user_id, session_date);

-- 確認用クエリ（実行後に確認）
-- SELECT 
--   id,
--   start_time,
--   session_date,
--   start_time AT TIME ZONE 'Asia/Tokyo' as japan_time
-- FROM public.sessions 
-- ORDER BY start_time DESC 
-- LIMIT 10; 