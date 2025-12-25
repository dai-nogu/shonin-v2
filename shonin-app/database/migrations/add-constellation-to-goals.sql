-- ==========================================
-- 目標テーブルに星座データカラムを追加
-- ==========================================

-- 星座データのカラムを追加
ALTER TABLE public.goals
ADD COLUMN IF NOT EXISTS constellation_nodes JSONB, -- 星座のノード（星の位置）データ
ADD COLUMN IF NOT EXISTS constellation_edges JSONB, -- 星座のエッジ（線の接続）データ
ADD COLUMN IF NOT EXISTS constellation_symbol TEXT, -- 星座のシンボル名
ADD COLUMN IF NOT EXISTS constellation_message TEXT, -- 星座に込められたメッセージ
ADD COLUMN IF NOT EXISTS constellation_position_x FLOAT, -- ホーム画面での星座のX座標
ADD COLUMN IF NOT EXISTS constellation_position_y FLOAT; -- ホーム画面での星座のY座標

-- インデックスを追加（JSONBカラムのGINインデックスで検索を高速化）
CREATE INDEX IF NOT EXISTS idx_goals_constellation_nodes ON public.goals USING GIN (constellation_nodes);
CREATE INDEX IF NOT EXISTS idx_goals_constellation_edges ON public.goals USING GIN (constellation_edges);

-- コメントを追加
COMMENT ON COLUMN public.goals.constellation_nodes IS 'AIが生成した星座のノード（星の位置）データ [{"id": 0, "x": 0.5, "y": 0.2}, ...]';
COMMENT ON COLUMN public.goals.constellation_edges IS 'AIが生成した星座のエッジ（線の接続）データ [{"from": 0, "to": 1}, ...]';
COMMENT ON COLUMN public.goals.constellation_symbol IS 'AIが生成した星座のシンボル名（例：知恵の書、開かれた扉）';
COMMENT ON COLUMN public.goals.constellation_message IS '星座に込められたメッセージ（AIからのメッセージ）';
COMMENT ON COLUMN public.goals.constellation_position_x IS 'ホーム画面での星座のX座標（-1〜1の範囲）';
COMMENT ON COLUMN public.goals.constellation_position_y IS 'ホーム画面での星座のY座標（-1〜1の範囲）';

