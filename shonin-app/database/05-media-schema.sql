-- ==========================================
-- SHONIN アプリ メディア管理スキーマ v1
-- 画像・動画・音声アップロード機能
-- 注意: 01-core-schema.sql を先に実行してください
-- ==========================================

-- セッションメディアテーブル削除
DROP TABLE IF EXISTS public.session_media CASCADE;

-- ==========================================
-- メディア管理テーブル作成
-- ==========================================

-- セッションメディアテーブル（画像・動画・音声統合版）
CREATE TABLE public.session_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
    
    -- メディア情報
    media_type TEXT CHECK (media_type IN ('image', 'video', 'audio')) NOT NULL,
    file_path TEXT NOT NULL, -- Supabase Storageのパス
    file_name TEXT NOT NULL,
    file_size INTEGER, -- バイト数
    mime_type TEXT,
    
    -- メディアのメタデータ
    caption TEXT, -- メディアのキャプション
    is_main_image BOOLEAN DEFAULT false, -- メイン画像かどうか
    public_url TEXT, -- パブリックアクセスURL
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- メディア用インデックス
-- ==========================================
CREATE INDEX idx_session_media_session_id ON public.session_media(session_id);
CREATE INDEX idx_session_media_media_type ON public.session_media(media_type);
CREATE INDEX idx_session_media_is_main ON public.session_media(is_main_image);
CREATE INDEX idx_session_media_created_at ON public.session_media(created_at);

-- ==========================================
-- RLS設定
-- ==========================================
ALTER TABLE public.session_media ENABLE ROW LEVEL SECURITY;

-- Session Media policies
CREATE POLICY "Users can view session media" ON public.session_media
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.sessions WHERE id = session_id));
CREATE POLICY "Users can insert session media" ON public.session_media
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.sessions WHERE id = session_id));
CREATE POLICY "Users can update session media" ON public.session_media
    FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM public.sessions WHERE id = session_id));
CREATE POLICY "Users can delete session media" ON public.session_media
    FOR DELETE USING (auth.uid() IN (SELECT user_id FROM public.sessions WHERE id = session_id));

-- ==========================================
-- メディア統計用ビュー
-- ==========================================
CREATE OR REPLACE VIEW public.user_media_stats 
WITH (security_invoker = on) AS
SELECT 
    s.user_id,
    COUNT(*) as total_media_count,
    COUNT(CASE WHEN sm.media_type = 'image' THEN 1 END) as image_count,
    COUNT(CASE WHEN sm.media_type = 'video' THEN 1 END) as video_count,
    COUNT(CASE WHEN sm.media_type = 'audio' THEN 1 END) as audio_count,
    SUM(sm.file_size) as total_file_size,
    MAX(sm.created_at) as latest_upload_at
FROM public.session_media sm
JOIN public.sessions s ON sm.session_id = s.id
GROUP BY s.user_id;

-- ==========================================
-- カラムコメント
-- ==========================================
COMMENT ON TABLE public.session_media IS 'セッションに関連する画像・動画・音声ファイル';
COMMENT ON COLUMN public.session_media.media_type IS 'メディアタイプ（image: 画像, video: 動画, audio: 音声）';
COMMENT ON COLUMN public.session_media.file_path IS 'Supabase Storageでのファイルパス';
COMMENT ON COLUMN public.session_media.file_name IS '元のファイル名';
COMMENT ON COLUMN public.session_media.file_size IS 'ファイルサイズ（バイト）';
COMMENT ON COLUMN public.session_media.mime_type IS 'MIMEタイプ';
COMMENT ON COLUMN public.session_media.caption IS 'メディアのキャプション・説明';
COMMENT ON COLUMN public.session_media.is_main_image IS 'セッションのメイン画像かどうか';
COMMENT ON COLUMN public.session_media.public_url IS 'パブリックアクセス用URL'; 