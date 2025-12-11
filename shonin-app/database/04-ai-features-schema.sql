-- ==========================================
-- 自己成長記録アプリ AI機能スキーマ v1
-- AI分析・フィードバック機能
-- 注意: 01-core-schema.sql を先に実行してください
-- ==========================================

-- pgcrypto拡張を有効化（暗号化用）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- AIフィードバックテーブル削除
DROP TABLE IF EXISTS public.ai_feedback CASCADE;

-- セッションテーブルにAI分析機能を拡張
DO $$ 
BEGIN
    -- AI分析カラムを安全に追加
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'ai_sentiment_score') THEN
        ALTER TABLE public.sessions ADD COLUMN ai_sentiment_score DECIMAL(3,2) CHECK (ai_sentiment_score >= -1.0 AND ai_sentiment_score <= 1.0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'ai_positive_keywords') THEN
        ALTER TABLE public.sessions ADD COLUMN ai_positive_keywords TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'ai_negative_keywords') THEN
        ALTER TABLE public.sessions ADD COLUMN ai_negative_keywords TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'ai_improvement_keywords') THEN
        ALTER TABLE public.sessions ADD COLUMN ai_improvement_keywords TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'ai_effort_level') THEN
        ALTER TABLE public.sessions ADD COLUMN ai_effort_level INTEGER CHECK (ai_effort_level >= 1 AND ai_effort_level <= 5);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'ai_focus_level') THEN
        ALTER TABLE public.sessions ADD COLUMN ai_focus_level INTEGER CHECK (ai_focus_level >= 1 AND ai_focus_level <= 5);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'ai_satisfaction_level') THEN
        ALTER TABLE public.sessions ADD COLUMN ai_satisfaction_level INTEGER CHECK (ai_satisfaction_level >= 1 AND ai_satisfaction_level <= 5);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'ai_analyzed_at') THEN
        ALTER TABLE public.sessions ADD COLUMN ai_analyzed_at TIMESTAMP WITH TIME ZONE;
    END IF;
EXCEPTION
    WHEN others THEN
        -- テーブルが存在しない場合は何もしない
        NULL;
END $$;

-- ==========================================
-- AIフィードバックテーブル作成（pgcrypto暗号化対応）
-- ==========================================
CREATE TABLE public.ai_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    feedback_type TEXT CHECK (feedback_type IN ('weekly', 'monthly')) NOT NULL,
    content_encrypted BYTEA NOT NULL, -- pgcryptoで暗号化されたフィードバック内容
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 暗号化されたフィードバックを復号化するビュー
CREATE OR REPLACE VIEW public.ai_feedback_decrypted 
WITH (security_invoker = on) AS
SELECT 
    id,
    user_id,
    feedback_type,
    -- pgcryptoで復号化（ユーザーIDを暗号化キーとして使用）
    pgp_sym_decrypt(content_encrypted, auth.uid()::text) AS content,
    period_start,
    period_end,
    created_at
FROM public.ai_feedback
WHERE auth.uid() = user_id; -- RLS適用

-- フィードバック挿入用の関数（pgcrypto自動暗号化）
CREATE OR REPLACE FUNCTION public.insert_encrypted_feedback(
    p_feedback_type TEXT,
    p_content TEXT,
    p_period_start DATE,
    p_period_end DATE
) RETURNS UUID AS $$
DECLARE
    feedback_id UUID;
    encrypted_content BYTEA;
BEGIN
    -- pgcryptoでコンテンツを暗号化（ユーザーIDを暗号化キーとして使用）
    encrypted_content := pgp_sym_encrypt(p_content, auth.uid()::text);
    
    -- 暗号化されたフィードバックを挿入
    INSERT INTO public.ai_feedback (
        user_id,
        feedback_type,
        content_encrypted,
        period_start,
        period_end
    ) VALUES (
        auth.uid(),
        p_feedback_type,
        encrypted_content,
        p_period_start,
        p_period_end
    ) RETURNING id INTO feedback_id;
    
    RETURN feedback_id;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp;

-- ==========================================
-- AI機能用インデックス
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_sessions_ai_sentiment ON public.sessions(ai_sentiment_score);
CREATE INDEX IF NOT EXISTS idx_sessions_ai_analyzed ON public.sessions(ai_analyzed_at);
CREATE INDEX IF NOT EXISTS idx_sessions_ai_effort ON public.sessions(ai_effort_level);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON public.ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON public.ai_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_period ON public.ai_feedback(period_start, period_end);

-- ==========================================
-- AI分析用ビュー（復号化ビューを使用）
-- ==========================================
-- 注: このビューは sessions_reflections_decrypted ビューを使用するため、
--     03-reflections-schema.sql を先に実行する必要があります
CREATE OR REPLACE VIEW public.sessions_for_ai_analysis 
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
    s.location,
    s.notes,
    
    -- 振り返りデータ（復号化ビューから取得）
    srd.mood,
    s.mood_score,  -- mood_score は暗号化されていないので sessions テーブルから直接取得
    srd.reflection_notes,
    
    -- AI分析結果
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
LEFT JOIN public.sessions_reflections_decrypted srd ON s.id = srd.id
WHERE 
    -- 振り返りデータまたはAI分析データがあるセッション
    (s.mood_score IS NOT NULL 
     OR s.mood_encrypted IS NOT NULL
     OR s.reflection_notes_encrypted IS NOT NULL
     OR s.ai_analyzed_at IS NOT NULL)
    AND s.user_id = auth.uid(); -- RLS適用

-- ==========================================
-- RLS設定（暗号化対応）
-- ==========================================
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

-- AI Feedback policies（暗号化テーブル用）
CREATE POLICY "Users can view own encrypted ai_feedback" ON public.ai_feedback
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own encrypted ai_feedback" ON public.ai_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 復号化ビューのRLS（追加のセキュリティ層）
ALTER VIEW public.ai_feedback_decrypted SET (security_invoker = on);

-- ==========================================
-- カラムコメント
-- ==========================================
COMMENT ON COLUMN public.sessions.ai_sentiment_score IS 'AI感情スコア（-1.0〜1.0）';
COMMENT ON COLUMN public.sessions.ai_positive_keywords IS 'AIが抽出したポジティブキーワード';
COMMENT ON COLUMN public.sessions.ai_negative_keywords IS 'AIが抽出したネガティブキーワード';
COMMENT ON COLUMN public.sessions.ai_improvement_keywords IS 'AIが提案する改善キーワード';
COMMENT ON COLUMN public.sessions.ai_effort_level IS 'AI評価の努力レベル（1-5段階）';
COMMENT ON COLUMN public.sessions.ai_focus_level IS 'AI評価の集中レベル（1-5段階）';
COMMENT ON COLUMN public.sessions.ai_satisfaction_level IS 'AI評価の満足度（1-5段階）';
COMMENT ON COLUMN public.sessions.ai_analyzed_at IS 'AI分析実行日時';

COMMENT ON TABLE public.ai_feedback IS 'AI生成の週次・月次フィードバック（pgcrypto暗号化対応）';
COMMENT ON COLUMN public.ai_feedback.feedback_type IS 'フィードバックタイプ（weekly: 週次, monthly: 月次）';
COMMENT ON COLUMN public.ai_feedback.content_encrypted IS 'pgcryptoで暗号化されたAI生成フィードバック内容';
COMMENT ON VIEW public.ai_feedback_decrypted IS 'pgcryptoで復号化されたAIフィードバックビュー（RLS適用）';
COMMENT ON VIEW public.sessions_for_ai_analysis IS 'AI分析用のセッションビュー（復号化データ含む、RLS適用）';
COMMENT ON COLUMN public.ai_feedback.period_start IS 'フィードバック対象期間開始日';
COMMENT ON COLUMN public.ai_feedback.period_end IS 'フィードバック対象期間終了日'; 