-- ==========================================
-- マイグレーション: description を dont_list にリネーム
-- ==========================================

-- descriptionカラムをdont_listにリネーム
ALTER TABLE public.goals 
RENAME COLUMN description TO dont_list;

-- コメントを追加（説明用）
COMMENT ON COLUMN public.goals.dont_list IS 'この目標中にやめること（JSON配列として保存）';
