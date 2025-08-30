-- ==========================================
-- SHONIN アプリ カラム削除とビュー修正スクリプト
-- 1. 既存ビューを削除
-- 2. 未使用カラムを削除
-- 3. ビューを再作成
-- ==========================================

-- Step 1: 既存のビューを削除
DROP VIEW IF EXISTS public.sessions_with_reflections CASCADE;
DROP VIEW IF EXISTS public.sessions_for_ai_analysis CASCADE;

-- Step 2: 未使用カラムを削除
DO $$ 
BEGIN
    -- mood_notes カラムを削除
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'sessions' AND column_name = 'mood_notes') THEN
        ALTER TABLE public.sessions DROP COLUMN mood_notes;
        RAISE NOTICE 'mood_notes カラムを削除しました';
    ELSE
        RAISE NOTICE 'mood_notes カラムは存在しません';
    END IF;
    
    -- reflection_duration カラムを削除
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'sessions' AND column_name = 'reflection_duration') THEN
        ALTER TABLE public.sessions DROP COLUMN reflection_duration;
        RAISE NOTICE 'reflection_duration カラムを削除しました';
    ELSE
        RAISE NOTICE 'reflection_duration カラムは存在しません';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'カラム削除中にエラーが発生しました: %', SQLERRM;
END $$;

-- Step 3: ビューを再作成（振り返り用）
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
            detailed_achievements,
            detailed_challenges,
            reflection_notes,
            
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
            detailed_achievements,
            detailed_challenges,
            reflection_notes,
            
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

-- Step 4: AI分析用ビューは04-ai-features-schema.sql実行後に作成されます
-- このスクリプトでは基本的なカラム削除とビュー修正のみ実行 