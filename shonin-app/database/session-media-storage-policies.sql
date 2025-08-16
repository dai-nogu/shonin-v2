-- ==========================================
-- SHONIN アプリ セッションメディア ストレージポリシー（統一版）
-- session_mediaテーブルとストレージの権限設定（修正版）
-- ==========================================

-- 1. 既存のRLSポリシーを完全に削除
DROP POLICY IF EXISTS "Users can view session media" ON public.session_media;
DROP POLICY IF EXISTS "Users can insert session media" ON public.session_media;
DROP POLICY IF EXISTS "Users can update session media" ON public.session_media;
DROP POLICY IF EXISTS "Users can delete session media" ON public.session_media;
DROP POLICY IF EXISTS "Users can manage own session media" ON public.session_media;

-- 2. ストレージポリシーを削除
DROP POLICY IF EXISTS "Users can upload own session media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own session media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own session media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload session media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view session media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete session media" ON storage.objects;

-- 3. session_mediaテーブルのRLSポリシーを作成（詳細版）
CREATE POLICY "Users can view own session media" ON public.session_media
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id 
            FROM public.sessions 
            WHERE id = session_id
        )
    );

CREATE POLICY "Users can insert own session media" ON public.session_media
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id 
            FROM public.sessions 
            WHERE id = session_id
        )
    );

CREATE POLICY "Users can update own session media" ON public.session_media
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id 
            FROM public.sessions 
            WHERE id = session_id
        )
    );

CREATE POLICY "Users can delete own session media" ON public.session_media
    FOR DELETE USING (
        auth.uid() IN (
            SELECT user_id 
            FROM public.sessions 
            WHERE id = session_id
        )
    );

-- 4. ストレージポリシーを作成（認証済みユーザー用）
CREATE POLICY "Authenticated users can upload session media" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'session-media' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can view session media" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'session-media' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can delete session media" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'session-media' AND
        auth.role() = 'authenticated'
    );

-- 5. RLSが有効になっていることを確認
ALTER TABLE public.session_media ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 設定手順
-- ==========================================
-- 1. Supabaseダッシュボード > Storage > Create bucket
-- 2. Bucket name: session-media
-- 3. Public bucket: ✅ チェックを入れる
-- 4. 01-core-schema.sql を先に実行
-- 5. 05-media-schema.sql を実行してsession_mediaテーブル作成
-- 6. このSQLファイルを実行してRLSポリシーを設定

-- ==========================================
-- 確認用クエリ
-- ==========================================
SELECT 'session_media RLS policies updated' as status;

-- session_mediaテーブルのポリシー確認
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'session_media';

-- ストレージポリシー確認
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%session media%'; 