-- ==========================================
-- notesカラム暗号化対応マイグレーション
-- ==========================================

-- pgcrypto拡張を有効化（暗号化用）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 暗号化されたnotesカラムを追加
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'notes_encrypted') THEN
        ALTER TABLE public.sessions ADD COLUMN notes_encrypted BYTEA;
        COMMENT ON COLUMN public.sessions.notes_encrypted IS 'pgcryptoで暗号化されたnotesデータ';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'mood_notes') THEN
        ALTER TABLE public.sessions ADD COLUMN mood_notes TEXT;
    END IF;
END $$;

-- ==========================================
-- decrypted_session ビューの作成（完全版）
-- ==========================================

DROP VIEW IF EXISTS public.decrypted_session CASCADE;

CREATE OR REPLACE VIEW public.decrypted_session 
WITH (security_invoker = on) AS
SELECT 
    s.id,
    s.user_id,
    s.activity_id,
    s.goal_id,
    s.start_time,
    s.end_time,
    s.duration,
    s.session_date,
    -- notesは暗号化されている場合は復号化、されていない場合は平文を返す
    CASE 
        WHEN s.notes_encrypted IS NOT NULL THEN
            pgp_sym_decrypt(s.notes_encrypted, auth.uid()::text)
        ELSE s.notes
    END AS notes,
    s.location,
    s.mood_score,
    s.mood_notes,
    -- reflection_notesも復号化
    CASE 
        WHEN s.reflection_notes_encrypted IS NOT NULL THEN
            pgp_sym_decrypt(s.reflection_notes_encrypted, auth.uid()::text)
        ELSE NULL
    END AS reflection_notes,
    NULL::INTEGER AS reflection_duration,
    s.ai_sentiment_score,
    s.ai_positive_keywords,
    s.ai_negative_keywords,
    s.ai_improvement_keywords,
    s.ai_effort_level,
    s.ai_focus_level,
    s.ai_satisfaction_level,
    s.ai_analyzed_at,
    s.created_at,
    s.updated_at
FROM public.sessions s
WHERE auth.uid() = s.user_id;

COMMENT ON VIEW public.decrypted_session IS '復号化されたセッションデータビュー（RLS適用）';

-- ==========================================
-- notes暗号化保存用の関数
-- ==========================================

CREATE OR REPLACE FUNCTION public.save_encrypted_notes(
    p_session_id UUID,
    p_notes TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- 権限チェック：自分のセッションのみ更新可能
    IF NOT EXISTS (
        SELECT 1 FROM public.sessions 
        WHERE id = p_session_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Session not found or access denied';
    END IF;
    
    -- notesを暗号化して保存
    UPDATE public.sessions SET
        notes_encrypted = pgp_sym_encrypt(p_notes, auth.uid()::text),
        notes = NULL, -- 平文は削除
        updated_at = NOW()
    WHERE id = p_session_id AND user_id = auth.uid();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp;

COMMENT ON FUNCTION public.save_encrypted_notes IS 'notesを暗号化して保存する関数';

-- ==========================================
-- notes自動暗号化トリガー
-- ==========================================

CREATE OR REPLACE FUNCTION public.encrypt_notes_before_save()
RETURNS TRIGGER AS $$
BEGIN
    -- notesが設定されている場合、暗号化して保存
    IF NEW.notes IS NOT NULL AND NEW.notes != '' THEN
        NEW.notes_encrypted := pgp_sym_encrypt(NEW.notes, auth.uid()::text);
        NEW.notes := NULL; -- 平文は削除
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp;

-- トリガーを作成（INSERTとUPDATE両方に対応）
DROP TRIGGER IF EXISTS trigger_encrypt_notes ON public.sessions;
CREATE TRIGGER trigger_encrypt_notes
    BEFORE INSERT OR UPDATE ON public.sessions
    FOR EACH ROW
    WHEN (NEW.notes IS NOT NULL AND NEW.notes != '')
    EXECUTE FUNCTION public.encrypt_notes_before_save();

COMMENT ON FUNCTION public.encrypt_notes_before_save IS 'notesを自動的に暗号化するトリガー関数';
