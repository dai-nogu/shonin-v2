-- Migration: Add goal_id to activities table
-- Purpose: アクティビティを目標ごとに分離する
-- Date: 2025-12-12

-- Step 1: goal_idカラムを追加
ALTER TABLE activities
ADD COLUMN goal_id UUID;

-- Step 2: 外部キー制約を追加（目標が削除されたらアクティビティも削除）
ALTER TABLE activities
ADD CONSTRAINT fk_activities_goal
FOREIGN KEY (goal_id) REFERENCES goals(id)
ON DELETE CASCADE;

-- Step 3: インデックスを追加（パフォーマンス向上）
CREATE INDEX idx_activities_goal_id ON activities(goal_id);
CREATE INDEX idx_activities_user_goal ON activities(user_id, goal_id) WHERE deleted_at IS NULL;

-- Step 4: RLSポリシーの更新（既存のRLSポリシーを確認）
-- 既存のポリシーは維持し、goal_idを考慮したクエリは各Server Actionで処理

-- 注意事項：
-- 1. 既存のアクティビティのgoal_idはNULLになります
-- 2. 既存のアクティビティを特定の目標に紐付けたい場合は、手動で更新してください
-- 3. 今後追加されるアクティビティは必ずgoal_idを持つべきです

-- 既存データの確認クエリ（実行後に確認用）
-- SELECT id, user_id, name, goal_id, deleted_at FROM activities ORDER BY created_at DESC LIMIT 10;
