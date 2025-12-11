/* decrypted_session ビューの作成（セキュリティ強化版） */

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
    s.notes,
    s.location,
    s.mood_score,
    CASE 
        WHEN s.mood_encrypted IS NOT NULL THEN
            pgp_sym_decrypt(s.mood_encrypted, auth.uid()::text)
        ELSE NULL
    END AS mood_notes,
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
