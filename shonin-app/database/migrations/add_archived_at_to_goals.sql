-- ==========================================
-- 目標テーブルにアーカイブ機能を追加
-- ==========================================

-- archived_at カラムを追加（NULL = アクティブ、値あり = アーカイブ済み）
ALTER TABLE public.goals 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- アーカイブされていない目標のみを効率的に取得するためのインデックス
CREATE INDEX IF NOT EXISTS idx_goals_archived_at 
ON public.goals(archived_at) 
WHERE archived_at IS NULL;

-- コメント追加
COMMENT ON COLUMN public.goals.archived_at IS '目標のアーカイブ日時。NULLの場合はアクティブ、値が設定されている場合はアーカイブ済み';

-- ==========================================
-- 確認用クエリ
-- ==========================================
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'goals' AND column_name = 'archived_at';

