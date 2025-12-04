-- ==========================================
-- AIフィードバック既読/未読管理マイグレーション
-- ==========================================

-- is_readカラムを追加（デフォルトはfalse = 未読）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_feedback' AND column_name = 'is_read'
    ) THEN
        ALTER TABLE public.ai_feedback 
        ADD COLUMN is_read BOOLEAN DEFAULT FALSE NOT NULL;
    END IF;
    
    -- read_atカラムを追加（既読になった日時）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_feedback' AND column_name = 'read_at'
    ) THEN
        ALTER TABLE public.ai_feedback 
        ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- インデックスを追加（未読フィードバックの取得を高速化）
CREATE INDEX IF NOT EXISTS idx_ai_feedback_is_read ON public.ai_feedback(user_id, is_read);

-- 既存のビューを削除（カラム構造が変わるため）
DROP VIEW IF EXISTS public.ai_feedback_decrypted;

-- 復号化ビューを再作成（is_readとread_atを含める）
CREATE VIEW public.ai_feedback_decrypted 
WITH (security_invoker = on) AS
SELECT 
    id,
    user_id,
    feedback_type,
    -- pgcryptoで復号化（ユーザーIDを暗号化キーとして使用）
    pgp_sym_decrypt(content_encrypted, auth.uid()::text) AS content,
    period_start,
    period_end,
    is_read,
    read_at,
    created_at
FROM public.ai_feedback
WHERE auth.uid() = user_id; -- RLS適用

-- 未読フィードバック数を取得する関数
CREATE OR REPLACE FUNCTION public.get_unread_feedback_count()
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO unread_count
    FROM public.ai_feedback
    WHERE user_id = auth.uid() 
    AND is_read = FALSE;
    
    RETURN unread_count;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp;

-- フィードバックを既読にする関数
CREATE OR REPLACE FUNCTION public.mark_feedback_as_read(
    p_feedback_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- 自分のフィードバックのみ更新可能
    UPDATE public.ai_feedback
    SET is_read = TRUE,
        read_at = NOW()
    WHERE id = p_feedback_id 
    AND user_id = auth.uid()
    AND is_read = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp;

-- 全フィードバックを既読にする関数（フィードバックページを開いたとき用）
CREATE OR REPLACE FUNCTION public.mark_all_feedback_as_read()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.ai_feedback
    SET is_read = TRUE,
        read_at = NOW()
    WHERE user_id = auth.uid()
    AND is_read = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp;

-- RLSポリシーの更新（is_readカラムへのアクセス許可）
-- 既存のポリシーがある場合は削除してから作成
DROP POLICY IF EXISTS "Users can update own feedback read status" ON public.ai_feedback;

CREATE POLICY "Users can update own feedback read status" ON public.ai_feedback
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- コメント追加
COMMENT ON COLUMN public.ai_feedback.is_read IS '既読フラグ（false: 未読, true: 既読）';
COMMENT ON COLUMN public.ai_feedback.read_at IS '既読になった日時';
COMMENT ON FUNCTION public.get_unread_feedback_count() IS 'ユーザーの未読フィードバック数を取得';
COMMENT ON FUNCTION public.mark_feedback_as_read(UUID) IS '指定したフィードバックを既読にする';
COMMENT ON FUNCTION public.mark_all_feedback_as_read() IS 'すべてのフィードバックを既読にする';

