-- ==========================================
-- SHONIN アプリ 振り返り機能スキーマ v1
-- 詳細な振り返り機能（完全暗号化対応）
-- 注意: 01-core-schema.sql を先に実行してください
-- ==========================================

-- pgcrypto拡張を有効化（暗号化用）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- セッションテーブルに詳細振り返り機能を拡張
DO $$ 
BEGIN
    -- 基本振り返りデータの暗号化カラムを追加
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'mood_encrypted') THEN
        ALTER TABLE public.sessions ADD COLUMN mood_encrypted BYTEA;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'achievements_encrypted') THEN
        ALTER TABLE public.sessions ADD COLUMN achievements_encrypted BYTEA;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'challenges_encrypted') THEN
        ALTER TABLE public.sessions ADD COLUMN challenges_encrypted BYTEA;
    END IF;
    
    -- 詳細振り返りカラムを安全に追加
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'mood_score') THEN
        ALTER TABLE public.sessions ADD COLUMN mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5);
    END IF;
    
    -- 暗号化対応の振り返りカラムのみ使用
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'detailed_achievements_encrypted') THEN
        ALTER TABLE public.sessions ADD COLUMN detailed_achievements_encrypted BYTEA;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'detailed_challenges_encrypted') THEN
        ALTER TABLE public.sessions ADD COLUMN detailed_challenges_encrypted BYTEA;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'reflection_notes_encrypted') THEN
        ALTER TABLE public.sessions ADD COLUMN reflection_notes_encrypted BYTEA;
    END IF;

    -- 既存の平文カラムを削除（セキュリティ強化）
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'sessions' AND column_name = 'mood') THEN
        ALTER TABLE public.sessions DROP COLUMN mood;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'sessions' AND column_name = 'achievements') THEN
        ALTER TABLE public.sessions DROP COLUMN achievements;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'sessions' AND column_name = 'challenges') THEN
        ALTER TABLE public.sessions DROP COLUMN challenges;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'sessions' AND column_name = 'detailed_achievements') THEN
        ALTER TABLE public.sessions DROP COLUMN detailed_achievements;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'sessions' AND column_name = 'detailed_challenges') THEN
        ALTER TABLE public.sessions DROP COLUMN detailed_challenges;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'sessions' AND column_name = 'reflection_notes') THEN
        ALTER TABLE public.sessions DROP COLUMN reflection_notes;
    END IF;
EXCEPTION
    WHEN others THEN
        -- テーブルが存在しない場合は何もしない
        NULL;
END $$;

-- ==========================================
-- 暗号化された振り返りデータを復号化するビュー
-- ==========================================
CREATE OR REPLACE VIEW public.sessions_reflections_decrypted 
WITH (security_invoker = on) AS
SELECT 
    id,
    user_id,
    activity_id,
    goal_id,
    start_time,
    end_time,
    duration,
    session_date,
    location,
    notes,
    
    -- 基本振り返りデータ（暗号化から復号化）
    CASE 
        WHEN mood_encrypted IS NOT NULL THEN
            (pgp_sym_decrypt(mood_encrypted, auth.uid()::text))::INTEGER
        ELSE mood_score -- フォールバック
    END AS mood,
    
    CASE 
        WHEN achievements_encrypted IS NOT NULL THEN
            pgp_sym_decrypt(achievements_encrypted, auth.uid()::text)
        ELSE NULL
    END AS achievements,
    
    CASE 
        WHEN challenges_encrypted IS NOT NULL THEN
            pgp_sym_decrypt(challenges_encrypted, auth.uid()::text)
        ELSE NULL
    END AS challenges,
    
    -- 詳細振り返りデータ（暗号化カラムのみ使用）
    CASE 
        WHEN detailed_achievements_encrypted IS NOT NULL THEN
            pgp_sym_decrypt(detailed_achievements_encrypted, auth.uid()::text)
        ELSE NULL
    END AS detailed_achievements,
    
    CASE 
        WHEN detailed_challenges_encrypted IS NOT NULL THEN
            pgp_sym_decrypt(detailed_challenges_encrypted, auth.uid()::text)
        ELSE NULL
    END AS detailed_challenges,
    
    CASE 
        WHEN reflection_notes_encrypted IS NOT NULL THEN
            pgp_sym_decrypt(reflection_notes_encrypted, auth.uid()::text)
        ELSE NULL
    END AS reflection_notes,
    
    created_at,
    updated_at
FROM public.sessions
WHERE auth.uid() = user_id; -- RLS適用（ORDER BYを削除）

-- ==========================================
-- 暗号化振り返り挿入/更新用の関数（完全暗号化版）
-- ==========================================
CREATE OR REPLACE FUNCTION public.update_session_reflections_encrypted(
    p_session_id UUID,
    p_mood INTEGER DEFAULT NULL,
    p_achievements TEXT DEFAULT NULL,
    p_challenges TEXT DEFAULT NULL,
    p_mood_score INTEGER DEFAULT NULL,
    p_detailed_achievements TEXT DEFAULT NULL,
    p_detailed_challenges TEXT DEFAULT NULL,
    p_reflection_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    encrypted_mood BYTEA;
    encrypted_achievements BYTEA;
    encrypted_challenges BYTEA;
    encrypted_detailed_achievements BYTEA;
    encrypted_detailed_challenges BYTEA;
    encrypted_notes BYTEA;
BEGIN
    -- 権限チェック：自分のセッションのみ更新可能
    IF NOT EXISTS (
        SELECT 1 FROM public.sessions 
        WHERE id = p_session_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Session not found or access denied';
    END IF;
    
    -- テキストデータを暗号化
    IF p_mood IS NOT NULL THEN
        encrypted_mood := pgp_sym_encrypt(p_mood::text, auth.uid()::text);
    END IF;
    
    IF p_achievements IS NOT NULL THEN
        encrypted_achievements := pgp_sym_encrypt(p_achievements, auth.uid()::text);
    END IF;
    
    IF p_challenges IS NOT NULL THEN
        encrypted_challenges := pgp_sym_encrypt(p_challenges, auth.uid()::text);
    END IF;
    
    IF p_detailed_achievements IS NOT NULL THEN
        encrypted_detailed_achievements := pgp_sym_encrypt(p_detailed_achievements, auth.uid()::text);
    END IF;
    
    IF p_detailed_challenges IS NOT NULL THEN
        encrypted_detailed_challenges := pgp_sym_encrypt(p_detailed_challenges, auth.uid()::text);
    END IF;
    
    IF p_reflection_notes IS NOT NULL THEN
        encrypted_notes := pgp_sym_encrypt(p_reflection_notes, auth.uid()::text);
    END IF;
    
    -- セッションを更新（暗号化カラムのみ使用）
    UPDATE public.sessions SET
        mood_encrypted = COALESCE(encrypted_mood, mood_encrypted),
        achievements_encrypted = COALESCE(encrypted_achievements, achievements_encrypted),
        challenges_encrypted = COALESCE(encrypted_challenges, challenges_encrypted),
        mood_score = COALESCE(p_mood_score, mood_score),
        detailed_achievements_encrypted = COALESCE(encrypted_detailed_achievements, detailed_achievements_encrypted),
        detailed_challenges_encrypted = COALESCE(encrypted_detailed_challenges, detailed_challenges_encrypted),
        reflection_notes_encrypted = COALESCE(encrypted_notes, reflection_notes_encrypted),
        updated_at = NOW()
    WHERE id = p_session_id AND user_id = auth.uid();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp;

-- ==========================================
-- 振り返り用インデックス
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_sessions_mood_score ON public.sessions(mood_score);

-- ==========================================
-- 古いビューを削除（平文カラム参照のため）
-- ==========================================
DROP VIEW IF EXISTS public.sessions_with_reflections;

-- ==========================================
-- カラムコメント
-- ==========================================
COMMENT ON COLUMN public.sessions.mood_score IS '気分評価（1-5段階）';
COMMENT ON COLUMN public.sessions.mood_encrypted IS 'pgcryptoで暗号化された気分評価';
COMMENT ON COLUMN public.sessions.achievements_encrypted IS 'pgcryptoで暗号化された成果記録';
COMMENT ON COLUMN public.sessions.challenges_encrypted IS 'pgcryptoで暗号化された課題記録';
COMMENT ON COLUMN public.sessions.detailed_achievements_encrypted IS 'pgcryptoで暗号化された詳細な成果記録';
COMMENT ON COLUMN public.sessions.detailed_challenges_encrypted IS 'pgcryptoで暗号化された詳細な課題記録';
COMMENT ON COLUMN public.sessions.reflection_notes_encrypted IS 'pgcryptoで暗号化された振り返りメモ';
COMMENT ON VIEW public.sessions_reflections_decrypted IS '復号化された振り返りデータビュー（RLS適用）'; 