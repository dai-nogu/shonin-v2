-- ユーザーが自分の写真をアップロードできるポリシー
CREATE POLICY "Users can upload session photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'session-photos'
  );

-- ユーザーが写真を閲覧できるポリシー
CREATE POLICY "Users can view session photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'session-photos'
  );