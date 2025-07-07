-- ==========================================
-- SHONIN アプリ 完全版スキーマ
-- 基本機能 + 統合振り返り機能 + 目標管理機能
-- Supabase SQL Editorで実行してください
-- ==========================================

-- 既存のテーブルを削除（もしあれば）
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.activities CASCADE;
DROP TABLE IF EXISTS public.goals CASCADE;
DROP TABLE IF EXISTS public.ai_feedback CASCADE;
DROP TABLE IF EXISTS public.session_media CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table (auth.usersへの参照を削除)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    name TEXT,
    timezone TEXT DEFAULT 'Asia/Tokyo',
    goal_reminders BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    icon TEXT, -- NULL許可（アイコンがない場合もある）
    color TEXT NOT NULL DEFAULT 'bg-gray-500', -- CSS class形式で保存
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table (基本機能 + 統合振り返り機能)
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE, -- NULL許可（進行中セッション用）
    duration INTEGER DEFAULT 0, -- in seconds
    
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

-- Create goals table (完全版：週間時間設定対応)
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
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

-- Create ai_feedback table
CREATE TABLE IF NOT EXISTS public.ai_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    feedback_type TEXT CHECK (feedback_type IN ('weekly', 'monthly')) NOT NULL,
    content TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- テスト用のダミーユーザーを挿入
INSERT INTO public.users (id, email, name) 
VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com', 'Test User')
ON CONFLICT (id) DO NOTHING;

-- テスト用のサンプルアクティビティを挿入
INSERT INTO public.activities (id, user_id, name, icon, color) VALUES
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', '読書', '📚', 'bg-blue-500'),
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'プログラミング', '💻', 'bg-purple-500'),
('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', '運動', '🏃', 'bg-red-500')
ON CONFLICT (id) DO NOTHING;

-- テスト用のサンプルセッションを挿入（完了済み + 振り返り情報付き）
INSERT INTO public.sessions (
    id, user_id, activity_id, start_time, end_time, duration, 
    notes, mood, achievements, challenges, location,
    mood_score, detailed_achievements, detailed_challenges, reflection_notes
) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 
'2024-01-15 09:00:00+00', '2024-01-15 10:30:00+00', 5400, 
'集中して読書できた', 4, 'ポモドーロ技法を使って集中力を維持', '少し眠くなった', '自宅',
4, 'ポモドーロ技法をうまく活用できて、90分間集中して読書することができた。特に難しい箇所も理解できた。', '後半30分で少し集中力が切れた。次回は休憩を入れるタイミングを調整したい。', '天気が良くて気分も良かった。'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 
'2024-01-14 14:00:00+00', '2024-01-14 16:15:00+00', 8100, 
'Reactの学習進んだ', 5, 'カスタムフック作成をマスター', 'TypeScriptの型定義で少し詰まった', 'カフェ',
5, 'カスタムフック作成について完全に理解できた。useLocalStorageフックを自作して実際に動作させることができた。', 'TypeScriptの複雑な型定義でエラーが続いた。ジェネリクスの使い方をもう少し勉強する必要がある。', 'カフェの環境が集中しやすかった。'),

('cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 
'2024-01-14 07:00:00+00', '2024-01-14 07:45:00+00', 2700, 
'朝のランニング', 4, '5km完走', '後半少しペースダウン', '公園',
4, '5km を45分で完走できた。朝の清々しい空気の中で気持ちよく走れた。', '最後の1kmでペースが落ちた。普段の練習不足を感じる。週3回は走りたい。', '朝早い時間で公園が静かで良かった。')
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_activity_id ON public.sessions(activity_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON public.sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_end_time ON public.sessions(end_time);

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

-- カラムコメントを追加
COMMENT ON COLUMN public.goals.weekday_hours IS '平日（月〜金）の1日あたりの目標時間';
COMMENT ON COLUMN public.goals.weekend_hours IS '土日の1日あたりの目標時間';
COMMENT ON COLUMN public.goals.current_value IS '現在の進捗値（秒単位）';
COMMENT ON COLUMN public.goals.unit IS '目標の単位（時間、分、回数など）';
COMMENT ON COLUMN public.goals.status IS '目標のステータス（active: 進行中, completed: 完了, paused: 一時停止）';

-- AIフィードバック生成用のビュー（分析しやすくするため）
CREATE OR REPLACE VIEW public.sessions_for_ai_analysis AS
SELECT 
    id,
    user_id,
    activity_id,
    start_time,
    end_time,
    duration,
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

-- Create function to automatically update updated_at timestamp
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
-- 実行完了 - 完全版スキーマ（目標管理機能統合版）
-- ==========================================
-- 
-- 特徴:
-- 1. 基本機能（アクティビティ、セッション）
-- 2. 統合振り返り機能（詳細な気分・成果・課題記録）
-- 3. AI分析結果保存（感情分析、キーワード抽出）
-- 4. メディアファイル対応（写真・動画・音声）
-- 5. 写真アップロード機能（session_photos テーブル）
-- 6. 目標管理機能（週間時間設定、進捗追跡）
-- 7. サンプルデータ付き（すぐにテスト可能）
-- 
-- 目標管理機能の新機能:
-- - weekday_hours: 平日の1日あたりの目標時間
-- - weekend_hours: 土日の1日あたりの目標時間
-- - current_value: 現在の進捗値（秒単位）
-- - unit: 目標の単位
-- - status: 目標のステータス（active/completed/paused）
-- 
-- AI分析用クエリ例:
-- SELECT * FROM sessions_for_ai_analysis 
-- WHERE user_id = '00000000-0000-0000-0000-000000000000'
-- ORDER BY created_at DESC LIMIT 10;
-- 
-- 目標管理クエリ例:
-- SELECT * FROM goals 
-- WHERE user_id = '00000000-0000-0000-0000-000000000000' 
-- AND status = 'active'
-- ORDER BY deadline ASC;
-- 
-- RLS is DISABLED for testing - DO NOT USE IN PRODUCTION
-- 本番環境では適切なRLSポリシーを設定してください
-- ========================================== 