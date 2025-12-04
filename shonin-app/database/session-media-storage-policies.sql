-- ==========================================
-- 自己成長記録アプリ セッションメディア ストレージポリシー（統一版）
-- session_mediaテーブルとストレージの権限設定（修正版）
-- ==========================================

-- ==========================================
-- 既存ポリシーのクリーンアップ
-- ==========================================

-- 1. 既存のRLSポリシーを完全に削除（session_mediaテーブル）
DROP POLICY IF EXISTS "Users can view session media" ON public.session_media;
DROP POLICY IF EXISTS "Users can insert session media" ON public.session_media;
DROP POLICY IF EXISTS "Users can update session media" ON public.session_media;
DROP POLICY IF EXISTS "Users can delete session media" ON public.session_media;
DROP POLICY IF EXISTS "Users can manage own session media" ON public.session_media;
DROP POLICY IF EXISTS "Users can view own session media" ON public.session_media;
DROP POLICY IF EXISTS "Users can insert own session media" ON public.session_media;
DROP POLICY IF EXISTS "Users can update own session media" ON public.session_media;
DROP POLICY IF EXISTS "Users can delete own session media" ON public.session_media;
DROP POLICY IF EXISTS "Users can view own session media table" ON public.session_media;
DROP POLICY IF EXISTS "Users can insert own session media table" ON public.session_media;
DROP POLICY IF EXISTS "Users can update own session media table" ON public.session_media;
DROP POLICY IF EXISTS "Users can delete own session media table" ON public.session_media;

-- 2. ストレージポリシーを削除
DROP POLICY IF EXISTS "Users can upload own session media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own session media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own session media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own session media" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own session media storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own session media storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own session media storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own session media storage" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload session media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view session media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete session media" ON storage.objects;

-- ==========================================
-- session_mediaテーブルのRLSポリシー
-- ==========================================
-- 3. session_mediaテーブルのRLSポリシーを作成（セッション所有者チェック）
CREATE POLICY "Users can view own session media table" ON public.session_media
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id 
            FROM public.sessions 
            WHERE id = session_id
        )
    );

CREATE POLICY "Users can insert own session media table" ON public.session_media
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id 
            FROM public.sessions 
            WHERE id = session_id
        )
    );

CREATE POLICY "Users can update own session media table" ON public.session_media
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id 
            FROM public.sessions 
            WHERE id = session_id
        )
    );

CREATE POLICY "Users can delete own session media table" ON public.session_media
    FOR DELETE USING (
        auth.uid() IN (
            SELECT user_id 
            FROM public.sessions 
            WHERE id = session_id
        )
    );

-- ==========================================
-- ストレージオブジェクトのRLSポリシー
-- ==========================================
-- 4. ストレージポリシーを作成（ユーザー毎にスコープ制限）
-- パスが {user_id}/session-media/ で始まるファイルのみアクセス可能
-- 【重要】他ユーザーのファイルは一切アクセス不可（横取り防止）

CREATE POLICY "Users can upload own session media storage" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'session-media' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view own session media storage" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'session-media' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update own session media storage" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'session-media' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete own session media storage" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'session-media' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 5. RLSが有効になっていることを確認
ALTER TABLE public.session_media ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 設定手順
-- ==========================================
-- 1. Supabaseダッシュボード > Storage > Create bucket
-- 2. Bucket name: session-media
-- 3. Public bucket: ❌ チェックを外す（Private bucketにする）
-- 4. 01-core-schema.sql を先に実行
-- 5. 05-media-schema.sql を実行してsession_mediaテーブル作成
-- 6. このSQLファイルを実行してRLSポリシーを設定
-- 
-- 【重要】バケットは必ず非公開（Private）にしてください
-- 公開バケットにすると、URLを知っている人は誰でもアクセスできてしまいます

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

-- ==========================================
-- セキュリティ設計
-- ==========================================
-- 【パス構造】
-- {user_id}/session-media/{session_id}_{timestamp}.{ext}
-- 
-- 【RLS制限】
-- - storage.objectsのポリシーでパスの第1階層がauth.uid()と一致するもののみアクセス可能
-- - 他ユーザーのファイルは一切アクセス不可（横取り防止）
-- 
-- 【URL方式】
-- - Public URLは使用しない（セキュリティリスク）
-- - 署名付きURL（createSignedUrl）を動的生成（1時間有効）
-- - URLを知っていても有効期限切れでアクセス不可
-- 
-- 【バケット設定】
-- - Private bucket（非公開）必須
-- - Public bucketにするとRLSが無効化されるため絶対に避ける 