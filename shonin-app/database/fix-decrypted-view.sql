-- ==========================================
-- sessions_reflections_decrypted ビューの修正
-- ==========================================

-- 既存のビューを削除
DROP VIEW IF EXISTS public.sessions_reflections_decrypted;

-- 修正版のビューを作成
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
        WHEN reflection_notes_encrypted IS NOT NULL THEN
            pgp_sym_decrypt(reflection_notes_encrypted, auth.uid()::text)
        ELSE NULL
    END AS reflection_notes,
    
    created_at,
    updated_at
FROM public.sessions
WHERE auth.uid() = user_id; -- RLS適用

-- ビューにコメントを追加
COMMENT ON VIEW public.sessions_reflections_decrypted IS '復号化された振り返りデータビュー（RLS適用・修正版）'; 