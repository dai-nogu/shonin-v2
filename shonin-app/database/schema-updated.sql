-- 最新版: TypeScriptインターフェース変更に対応したスキーマ

-- 既存のテーブルを削除（もしあれば）
DROP TABLE IF EXISTS public.session_tags CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.activities CASCADE;
DROP TABLE IF EXISTS public.goals CASCADE;
DROP TABLE IF EXISTS public.ai_feedback CASCADE;
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

-- Create sessions table (フィールドをオプショナルに変更)
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE, -- NULL許可（進行中セッション用）
    duration INTEGER DEFAULT 0, -- in seconds
    notes TEXT, -- NULL許可
    mood INTEGER CHECK (mood >= 1 AND mood <= 5), -- NULL許可（オプショナル）
    achievements TEXT, -- NULL許可（オプショナル）
    challenges TEXT, -- NULL許可（オプショナル）
    location TEXT DEFAULT '', -- 空文字列をデフォルトに
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create session_tags table (タグをセッションごとに管理)
CREATE TABLE IF NOT EXISTS public.session_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
    tag_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- 同じセッションに同じタグが重複しないようにユニーク制約
    UNIQUE(session_id, tag_name)
);

-- Create goals table
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_duration INTEGER, -- in seconds
    deadline DATE,
    is_completed BOOLEAN DEFAULT false,
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

-- テスト用のサンプルセッションを挿入（完了済み）
INSERT INTO public.sessions (id, user_id, activity_id, start_time, end_time, duration, notes, mood, achievements, challenges, location) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', '2024-01-15 09:00:00+00', '2024-01-15 10:30:00+00', 5400, '集中して読書できた', 4, 'ポモドーロ技法を使って集中力を維持', '少し眠くなった', '自宅'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', '2024-01-14 14:00:00+00', '2024-01-14 16:15:00+00', 8100, 'Reactの学習進んだ', 5, 'カスタムフック作成をマスター', 'TypeScriptの型定義で少し詰まった', 'カフェ'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', '2024-01-14 07:00:00+00', '2024-01-14 07:45:00+00', 2700, '朝のランニング', 4, '5km完走', '後半少しペースダウン', '公園')
ON CONFLICT (id) DO NOTHING;

-- テスト用のサンプルタグを挿入
INSERT INTO public.session_tags (session_id, tag_name) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '自己啓発'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '集中'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'React'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '学習'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '筋トレ'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '健康')
ON CONFLICT (session_id, tag_name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_activity_id ON public.sessions(activity_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON public.sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_end_time ON public.sessions(end_time);
CREATE INDEX IF NOT EXISTS idx_session_tags_session_id ON public.session_tags(session_id);
CREATE INDEX IF NOT EXISTS idx_session_tags_tag_name ON public.session_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON public.ai_feedback(user_id);

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

-- RLS is DISABLED for testing - DO NOT USE IN PRODUCTION
-- 本番環境では適切なRLSポリシーを設定してください 