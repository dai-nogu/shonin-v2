-- ==========================================
-- SHONIN アプリ 振り返り機能スキーマ v1
-- 詳細な振り返り機能
-- 注意: 01-core-schema.sql を先に実行してください
-- ==========================================

-- セッションテーブルに詳細振り返り機能を拡張
-- 基本カラム（mood, achievements, challenges）は01-core-schema.sqlで追加済み
DO $$ 
BEGIN
    -- 詳細振り返りカラムを安全に追加
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'mood_score') THEN
        ALTER TABLE public.sessions ADD COLUMN mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'mood_notes') THEN
        ALTER TABLE public.sessions ADD COLUMN mood_notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'detailed_achievements') THEN
        ALTER TABLE public.sessions ADD COLUMN detailed_achievements TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'achievement_satisfaction') THEN
        ALTER TABLE public.sessions ADD COLUMN achievement_satisfaction INTEGER CHECK (achievement_satisfaction >= 1 AND achievement_satisfaction <= 5);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'detailed_challenges') THEN
        ALTER TABLE public.sessions ADD COLUMN detailed_challenges TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'challenge_severity') THEN
        ALTER TABLE public.sessions ADD COLUMN challenge_severity INTEGER CHECK (challenge_severity >= 1 AND challenge_severity <= 5);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'reflection_notes') THEN
        ALTER TABLE public.sessions ADD COLUMN reflection_notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'reflection_duration') THEN
        ALTER TABLE public.sessions ADD COLUMN reflection_duration INTEGER;
    END IF;
EXCEPTION
    WHEN others THEN
        -- テーブルが存在しない場合は何もしない
        NULL;
END $$;

-- ==========================================
-- 振り返り用インデックス
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_sessions_mood_score ON public.sessions(mood_score);
CREATE INDEX IF NOT EXISTS idx_sessions_achievement_satisfaction ON public.sessions(achievement_satisfaction);
CREATE INDEX IF NOT EXISTS idx_sessions_challenge_severity ON public.sessions(challenge_severity);

-- ==========================================
-- 振り返りデータ用ビュー
-- ==========================================
-- goal_idカラムが存在するかチェックしてからビューを作成
DO $$ 
BEGIN
    -- goal_idカラムが存在する場合のビュー
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'sessions' AND column_name = 'goal_id') THEN
        
        EXECUTE 'CREATE OR REPLACE VIEW public.sessions_with_reflections 
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
            
            -- 振り返りデータ
            mood_score,
            mood_notes,
            detailed_achievements,
            achievement_satisfaction,
            detailed_challenges,
            challenge_severity,
            reflection_notes,
            reflection_duration,
            
            created_at,
            updated_at
        FROM public.sessions
        WHERE 
            -- 振り返りデータがあるセッションのみ
            (mood_score IS NOT NULL 
             OR detailed_achievements IS NOT NULL 
             OR detailed_challenges IS NOT NULL)
        ORDER BY created_at DESC';
    ELSE
        -- goal_idカラムが存在しない場合のビュー
        EXECUTE 'CREATE OR REPLACE VIEW public.sessions_with_reflections 
        WITH (security_invoker = on) AS
        SELECT 
            id,
            user_id,
            activity_id,
            NULL::UUID as goal_id,
            start_time,
            end_time,
            duration,
            session_date,
            location,
            notes,
            
            -- 振り返りデータ
            mood_score,
            mood_notes,
            detailed_achievements,
            achievement_satisfaction,
            detailed_challenges,
            challenge_severity,
            reflection_notes,
            reflection_duration,
            
            created_at,
            updated_at
        FROM public.sessions
        WHERE 
            -- 振り返りデータがあるセッションのみ
            (mood_score IS NOT NULL 
             OR detailed_achievements IS NOT NULL 
             OR detailed_challenges IS NOT NULL)
        ORDER BY created_at DESC';
    END IF;
END $$;

-- ==========================================
-- カラムコメント
-- ==========================================
COMMENT ON COLUMN public.sessions.mood_score IS '気分評価（1-5段階）';
COMMENT ON COLUMN public.sessions.mood_notes IS '気分についての詳細メモ';
COMMENT ON COLUMN public.sessions.detailed_achievements IS '詳細な成果記録';
COMMENT ON COLUMN public.sessions.achievement_satisfaction IS '成果の満足度（1-5段階）';
COMMENT ON COLUMN public.sessions.detailed_challenges IS '詳細な課題記録';
COMMENT ON COLUMN public.sessions.challenge_severity IS '課題の深刻度（1-5段階）';
COMMENT ON COLUMN public.sessions.reflection_notes IS 'その他の振り返りメモ';
COMMENT ON COLUMN public.sessions.reflection_duration IS '振り返りにかけた時間（秒）'; 