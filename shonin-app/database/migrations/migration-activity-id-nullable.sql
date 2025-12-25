-- マイグレーション: activity_idをNULL許可に変更
-- 作成日: 2025-12-25
-- 目的: 星座（目標）を選択せずにセッションを開始できるようにする

-- activity_idのNOT NULL制約を削除
ALTER TABLE public.sessions 
ALTER COLUMN activity_id DROP NOT NULL;

-- インデックスは既存のものがそのまま使える（NULLを含むインデックスも可能）
-- 既存データには影響なし

