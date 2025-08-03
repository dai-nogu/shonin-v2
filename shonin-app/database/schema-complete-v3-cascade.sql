-- ==========================================
-- SHONIN アプリ 完全版スキーマ v3
-- 基本機能 + 統合振り返り機能 + 目標管理機能 + セッション日付管理 + 完全CASCADE削除対応
-- Supabase SQL Editorで実行してください
-- ==========================================

-- 既存のテーブルを削除（もしあれば）
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.activities CASCADE;
DROP TABLE IF EXISTS public.goals CASCADE;
DROP TABLE IF EXISTS public.ai_feedback CASCADE;
DROP TABLE IF EXISTS public.session_media CASCADE;
DROP TABLE IF EXISTS public.session_photos CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ==========================================
-- auth.usersと完全連携するusersテーブル
-- ==========================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    timezone TEXT DEFAULT 'Asia/Tokyo',
    goal_reminders BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 全テーブルをauth.usersに直接参照してCASCADE削除
-- ==========================================

-- Create activities table
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    icon TEXT, -- NULL許可（アイコンがない場合もある）
    color TEXT NOT NULL DEFAULT 'bg-gray-500', -- CSS class形式で保存
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create goals table (完全版：週間時間設定対応)
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_duration INTEGER, -- in seconds
    deadline DATE,
    is_completed BOOLEAN DEFAULT false,
    
    -- 週間時間設定（新規追加）
    weekday_hours INTEGER DEFAULT 0, -- 平日（月〜金）の1日あたりの目標時間
    weekend_hours INTEGER DEFAULT 0, -- 土日の1日あたりの目標時間
    current_value INTEGER DEFAULT 0, -- 現在の進捗値（秒単位）
    unit TEXT DEFAULT '時間', -- 目標の単位（時間、分、回数など）
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')), -- 目標のステータス
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table (基本機能 + 統合振り返り機能 + 目標連動機能 + セッション日付管理)
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE NOT NULL,
    goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL, -- 関連する目標のID（NULL許可）
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE, -- NULL許可（進行中セッション用）
    duration INTEGER DEFAULT 0, -- in seconds
    session_date DATE, -- セッション日付（タイムゾーン考慮、分割セッション対応）
    
    -- 基本的な振り返り情報（既存）
    notes TEXT, -- NULL許可
    mood INTEGER CHECK (mood >= 1 AND mood <= 5), -- NULL許可（オプショナル）
    achievements TEXT, -- NULL許可（オプショナル）
    challenges TEXT, -- NULL許可（オプショナル）
    location TEXT DEFAULT '', -- 空文字列をデフォルトに
    
    -- 詳細振り返り情報（新規追加）
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5), -- より詳細な気分評価
    mood_notes TEXT, -- 気分についての詳細メモ
    detailed_achievements TEXT, -- より詳細な成果記録
    achievement_satisfaction INTEGER CHECK (achievement_satisfaction >= 1 AND achievement_satisfaction <= 5), -- 成果の満足度
    detailed_challenges TEXT, -- より詳細な課題記録
    challenge_severity INTEGER CHECK (challenge_severity >= 1 AND challenge_severity <= 5), -- 課題の深刻度
    reflection_notes TEXT, -- その他の詳細メモ
    reflection_duration INTEGER, -- 振り返りにかけた時間（秒）
    
    -- AI分析結果（新規追加）
    ai_sentiment_score DECIMAL(3,2) CHECK (ai_sentiment_score >= -1.0 AND ai_sentiment_score <= 1.0), -- 感情スコア
    ai_positive_keywords TEXT[], -- ポジティブキーワード配列
    ai_negative_keywords TEXT[], -- ネガティブキーワード配列
    ai_improvement_keywords TEXT[], -- 改善キーワード配列
    ai_effort_level INTEGER CHECK (ai_effort_level >= 1 AND ai_effort_level <= 5), -- 努力レベル
    ai_focus_level INTEGER CHECK (ai_focus_level >= 1 AND ai_focus_level <= 5), -- 集中レベル
    ai_satisfaction_level INTEGER CHECK (ai_satisfaction_level >= 1 AND ai_satisfaction_level <= 5), -- 満足度
    ai_analyzed_at TIMESTAMP WITH TIME ZONE, -- AI分析実行日時
    ai_feedback_generated BOOLEAN DEFAULT false, -- フィードバック生成済みフラグ
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- セッション写真・メディアテーブル
CREATE TABLE IF NOT EXISTS public.session_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
    
    -- メディア情報
    media_type TEXT CHECK (media_type IN ('image', 'video', 'audio')) NOT NULL,
    file_path TEXT NOT NULL, -- Supabase Storageのパス
    file_name TEXT NOT NULL,
    file_size INTEGER, -- バイト数
    mime_type TEXT,
    
    -- メディアのメタデータ
    caption TEXT, -- 写真のキャプション
    is_main_image BOOLEAN DEFAULT false, -- メイン画像かどうか
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- セッション写真専用テーブル（写真アップロード機能用）
CREATE TABLE IF NOT EXISTS public.session_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Supabase Storageのパス
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL, -- MIMEタイプ
    public_url TEXT NOT NULL, -- パブリックアクセスURL
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_feedback table
CREATE TABLE IF NOT EXISTS public.ai_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    feedback_type TEXT CHECK (feedback_type IN ('weekly', 'monthly')) NOT NULL,
    content TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- インデックス作成（パフォーマンス向上）
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_activity_id ON public.sessions(activity_id);
CREATE INDEX IF NOT EXISTS idx_sessions_goal_id ON public.sessions(goal_id); -- 目標連動用インデックス
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON public.sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_end_time ON public.sessions(end_time);
CREATE INDEX IF NOT EXISTS idx_sessions_session_date ON public.sessions(session_date); -- セッション日付用インデックス
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON public.sessions(user_id, session_date); -- ユーザー別日付検索用

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON public.goals(deadline);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON public.ai_feedback(user_id);

-- 振り返り・AI分析用インデックス
CREATE INDEX IF NOT EXISTS idx_sessions_mood_score ON public.sessions(mood_score);
CREATE INDEX IF NOT EXISTS idx_sessions_ai_sentiment ON public.sessions(ai_sentiment_score);
CREATE INDEX IF NOT EXISTS idx_sessions_ai_analyzed ON public.sessions(ai_analyzed_at);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON public.sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_session_media_session_id ON public.session_media(session_id);
CREATE INDEX IF NOT EXISTS idx_session_media_media_type ON public.session_media(media_type);
CREATE INDEX IF NOT EXISTS idx_session_photos_session_id ON public.session_photos(session_id);
CREATE INDEX IF NOT EXISTS idx_session_photos_uploaded_at ON public.session_photos(uploaded_at);

-- ==========================================
-- カラムコメント
-- ==========================================
COMMENT ON COLUMN public.goals.weekday_hours IS '平日（月〜金）の1日あたりの目標時間';
COMMENT ON COLUMN public.goals.weekend_hours IS '土日の1日あたりの目標時間';
COMMENT ON COLUMN public.goals.current_value IS '現在の進捗値（秒単位）';
COMMENT ON COLUMN public.goals.unit IS '目標の単位（時間、分、回数など）';
COMMENT ON COLUMN public.goals.status IS '目標のステータス（active: 進行中, completed: 完了, paused: 一時停止）';
COMMENT ON COLUMN public.sessions.goal_id IS '関連する目標のID（NULL許可）';
COMMENT ON COLUMN public.sessions.session_date IS 'セッション日付（タイムゾーン考慮済み、分割セッション対応）';

-- ==========================================
-- AIフィードバック生成用ビュー
-- ==========================================
CREATE OR REPLACE VIEW public.sessions_for_ai_analysis AS
SELECT 
    id,
    user_id,
    activity_id,
    goal_id, -- 目標ID追加
    start_time,
    end_time,
    duration,
    session_date, -- セッション日付追加
    location,
    
    -- 基本的な振り返り情報
    notes,
    mood,
    achievements,
    challenges,
    
    -- 詳細な振り返り情報
    mood_score,
    mood_notes,
    detailed_achievements,
    achievement_satisfaction,
    detailed_challenges,
    challenge_severity,
    reflection_notes,
    reflection_duration,
    
    -- AI分析結果
    ai_sentiment_score,
    ai_positive_keywords,
    ai_negative_keywords,
    ai_improvement_keywords,
    ai_effort_level,
    ai_focus_level,
    ai_satisfaction_level,
    ai_analyzed_at,
    ai_feedback_generated,
    
    created_at,
    updated_at
FROM public.sessions
WHERE 
    -- 振り返りデータがあるセッションのみ
    (detailed_achievements IS NOT NULL OR detailed_challenges IS NOT NULL OR mood_score IS NOT NULL)
ORDER BY created_at DESC;

-- ==========================================
-- 更新日時自動更新の関数とトリガー
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamp
CREATE TRIGGER handle_updated_at_users BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_activities BEFORE UPDATE ON public.activities
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_sessions BEFORE UPDATE ON public.sessions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_goals BEFORE UPDATE ON public.goals
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================
-- RLS（Row Level Security）設定
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_photos ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users  
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Activities policies
CREATE POLICY "Users can view own activities" ON public.activities
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON public.activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activities" ON public.activities
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own activities" ON public.activities
    FOR DELETE USING (auth.uid() = user_id);

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON public.sessions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.sessions
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can view own goals" ON public.goals
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals
    FOR DELETE USING (auth.uid() = user_id);

-- AI Feedback policies
CREATE POLICY "Users can view own ai_feedback" ON public.ai_feedback
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai_feedback" ON public.ai_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Session Media policies
CREATE POLICY "Users can view session media" ON public.session_media
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.sessions WHERE id = session_id));
CREATE POLICY "Users can insert session media" ON public.session_media
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.sessions WHERE id = session_id));
CREATE POLICY "Users can delete session media" ON public.session_media
    FOR DELETE USING (auth.uid() IN (SELECT user_id FROM public.sessions WHERE id = session_id));

-- Session Photos policies
CREATE POLICY "Users can view session photos" ON public.session_photos
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.sessions WHERE id = session_id));
CREATE POLICY "Users can insert session photos" ON public.session_photos
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.sessions WHERE id = session_id));
CREATE POLICY "Users can delete session photos" ON public.session_photos
    FOR DELETE USING (auth.uid() IN (SELECT user_id FROM public.sessions WHERE id = session_id));

-- ==========================================
-- 完了 - スキーマ v3（完全CASCADE削除対応）
-- ==========================================
-- 
-- 【完全CASCADE削除フロー】
-- auth.users削除 → 以下が自動削除される:
-- 1. public.users (id → auth.users)
-- 2. activities (user_id → auth.users)  
-- 3. sessions (user_id → auth.users)
-- 4. goals (user_id → auth.users)
-- 5. ai_feedback (user_id → auth.users)
-- 6. session_media (session_id → sessions)
-- 7. session_photos (session_id → sessions)
-- 
-- 【セキュリティ】
-- - RLS有効化済み
-- - ユーザーは自分のデータのみアクセス可能
-- - 本番環境対応のセキュリティポリシー設定済み
-- 
-- 【実行方法】
-- このファイル全体をSupabase SQL Editorで実行
-- 一度の実行で完全なCASCADE削除対応データベースが構築されます
-- ========================================== 