-- session_mediaテーブル用のRLSポリシーを作成
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

-- RLSが有効になっていることを確認
ALTER TABLE public.session_media ENABLE ROW LEVEL SECURITY;