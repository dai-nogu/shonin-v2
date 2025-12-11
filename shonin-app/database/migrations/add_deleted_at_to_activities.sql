-- activitiesテーブルに deleted_at カラムを追加
-- 論理削除機能の実装

-- deleted_at カラムを追加
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- deleted_at カラムのインデックスを作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_activities_deleted_at ON public.activities(deleted_at);

-- コメント追加
COMMENT ON COLUMN public.activities.deleted_at IS 'アクティビティの論理削除日時。NULLの場合はアクティブ、値が設定されている場合は削除済み';
