# SHONIN アプリ データベーススキーマ

このディレクトリには、SHONINアプリのデータベーススキーマが機能別に分割されて格納されています。

## 📁 ファイル構成

```
database/
├── 01-core-schema.sql          # コア機能（必須）
├── 02-goals-schema.sql         # 目標管理機能
├── 03-reflections-schema.sql   # 振り返り機能
├── 04-ai-features-schema.sql   # AI分析・フィードバック機能
├── 05-media-schema.sql         # メディア管理機能
└── README.md                   # このファイル
```

## 🚀 実行順序

**必ず以下の順序で実行してください：**

### 1. 必須（コア機能）
```sql
-- 01-core-schema.sql
```
- ユーザー管理（`users`）
- アクティビティ管理（`activities`）
- 基本セッション記録（`sessions`）
- 基本的なRLSとトリガー

### 2. オプション機能（必要に応じて実行）

```sql
-- 02-goals-schema.sql（目標管理が必要な場合）
-- 03-reflections-schema.sql（振り返り機能が必要な場合）
-- 04-ai-features-schema.sql（AI機能が必要な場合）
-- 05-media-schema.sql（メディアアップロードが必要な場合）
```

## 📋 各機能の概要

### 01-core-schema.sql（コア機能）
- **users**: ユーザープロフィール
- **activities**: アクティビティ管理
- **sessions**: 基本的な時間記録

### 02-goals-schema.sql（目標管理）
- **goals**: 目標設定・追跡
- **sessions**: goal_id カラム追加

### 03-reflections-schema.sql（振り返り）
- **sessions**: 振り返り関連カラム追加
  - 気分評価（mood_score）
  - 成果記録（detailed_achievements）
  - 課題記録（detailed_challenges）

### 04-ai-features-schema.sql（AI機能）
- **sessions**: AI分析結果カラム追加
- **ai_feedback**: 週次・月次フィードバック

### 05-media-schema.sql（メディア管理）
- **session_media**: 画像・動画・音声ファイル管理

## 🔧 開発段階での推奨実行

### 初期開発（MVP）
```bash
# コア機能のみ
psql -f 01-core-schema.sql
```

### 機能拡張時
```bash
# 必要な機能を段階的に追加
psql -f 02-goals-schema.sql      # 目標管理
psql -f 03-reflections-schema.sql # 振り返り機能
psql -f 04-ai-features-schema.sql # AI機能
psql -f 05-media-schema.sql      # メディア機能
```

## ⚠️ 注意事項

1. **依存関係**: 必ず `01-core-schema.sql` を最初に実行
2. **CASCADE削除**: ユーザー削除時にすべての関連データが自動削除
3. **RLS有効**: すべてのテーブルでRow Level Securityが有効
4. **インデックス**: パフォーマンス最適化済み
5. **互換性**: ALTER TABLE使用で既存データ保護

## 🗄️ 旧スキーマからの移行

```sql
-- 旧schema-complete-v3-cascade.sqlから移行する場合
-- 1. 既存テーブルのバックアップ
-- 2. 新しいスキーマファイルを順次実行
-- 3. データの移行（必要に応じて）
```

## 📝 メンテナンス

各機能の追加・変更時は対応するスキーマファイルのみを更新し、適切なマイグレーションスクリプトを作成してください。 