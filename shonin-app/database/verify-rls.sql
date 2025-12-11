-- ==========================================
-- RLS設定の確認クエリ
-- ==========================================

-- 1. sessions テーブルのRLS設定を確認
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'sessions';

-- 2. ビューの定義を確認
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'public' 
AND viewname IN ('decrypted_session', 'sessions_reflections_decrypted');

-- 3. テーブルのRLS有効化状態を確認
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('sessions', 'activities', 'goals', 'users', 'reflections');

-- ==========================================
-- 実際のアクセステスト（一般ユーザーとして実行）
-- ==========================================
-- 注意: 以下は一般ユーザーの認証トークンで実行してください
-- SELECT * FROM decrypted_session LIMIT 5;
-- → 自分のデータのみが表示されることを確認

-- ==========================================
-- 推奨事項
-- ==========================================
-- ✅ sessions テーブルのRLSが有効になっていること
-- ✅ decrypted_session ビューに security_invoker = on が設定されていること
-- ✅ decrypted_session ビューに WHERE auth.uid() = user_id の条件があること
-- ✅ 一般ユーザーとしてアクセスした際、自分のデータのみが見えること
