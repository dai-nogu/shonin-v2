-- ==========================================
-- マイグレーション: アクティビティの論理削除（ソフトデリート）対応
-- 
-- 変更内容:
-- - activities テーブルに deleted_at カラムを追加
-- 
-- 目的:
-- - アクティビティを削除しても、過去のセッションでは元の名前・色を保持
-- - AIフィードバックでも正しいアクティビティ名で集計
-- - 削除されたアクティビティは新規セッション作成時に選択肢に表示されない
-- ==========================================

-- Step 1: deleted_at カラムを追加（NULL = 削除されていない、値あり = 削除日時）
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Step 2: 削除されていないアクティビティのみを効率的に取得するためのインデックス
CREATE INDEX IF NOT EXISTS idx_activities_deleted_at 
ON public.activities(deleted_at) 
WHERE deleted_at IS NULL;

-- 確認用クエリ（実行後に確認したい場合）
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'activities' AND column_name = 'deleted_at';

