-- パフォーマンス向上のためのインデックス
-- 実行前にSupabaseのSQL Editorでこれらのインデックスが存在するか確認してください

-- セッションテーブルのパフォーマンス向上
-- user_idとstart_timeの複合インデックス（よく使われるクエリ用）
CREATE INDEX IF NOT EXISTS idx_sessions_user_start_time 
ON sessions (user_id, start_time DESC);

-- end_timeのインデックス（進行中セッション検索用）
CREATE INDEX IF NOT EXISTS idx_sessions_end_time 
ON sessions (end_time) WHERE end_time IS NULL;

-- アクティビティテーブルのパフォーマンス向上
-- user_idとcreated_atの複合インデックス
CREATE INDEX IF NOT EXISTS idx_activities_user_created 
ON activities (user_id, created_at DESC);

-- 目標テーブルのパフォーマンス向上
-- user_idとstatusの複合インデックス
CREATE INDEX IF NOT EXISTS idx_goals_user_status 
ON goals (user_id, status) WHERE status = 'active';

-- session_mediaテーブルのパフォーマンス向上（写真機能用）
-- session_idとmedia_typeの複合インデックス
CREATE INDEX IF NOT EXISTS idx_session_media_session_type 
ON session_media (session_id, media_type);

-- RLSポリシーのパフォーマンス向上のためのインデックス
-- user_idは既に自動でインデックスが作成されているはずですが、念のため確認
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities (user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals (user_id);

-- パフォーマンス統計の更新
ANALYZE sessions;
ANALYZE activities;
ANALYZE goals;
ANALYZE session_media; 