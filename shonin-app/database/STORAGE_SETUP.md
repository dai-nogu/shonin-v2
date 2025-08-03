# Supabaseストレージ設定手順

「Bucket not found」エラーを解決するために、以下の手順でSupabaseストレージを設定してください。

## 🚨 エラーの原因

```
StorageApiError: Bucket not found
```

このエラーは、写真アップロード機能で使用する`session-media`バケットがSupabaseプロジェクトに作成されていないためです。

## 📋 設定手順

### 1. Supabaseダッシュボードでバケットを作成

1. **Supabaseプロジェクトのダッシュボードにアクセス**
   - https://supabase.com/dashboard
   
2. **左サイドバーの「Storage」をクリック**

3. **「Create bucket」ボタンをクリック**

4. **バケット設定を入力：**
   - **Name**: `session-media`
   - **Public bucket**: **✅ チェックを入れる**（重要）
   - **File size limit**: `50MB`（推奨）
   - **Allowed MIME types**: `image/*,video/*,audio/*`

5. **「Create bucket」をクリックして作成**

### 2. データベーステーブルを作成

必要なテーブルが存在しない場合は、以下のスキーマを順番に実行してください：

```bash
# 1. コア機能（必須）
database/01-core-schema.sql

# 2. メディア機能（写真アップロードに必要）
database/05-media-schema.sql
```

### 3. ストレージのセキュリティポリシーを設定

Supabaseの「SQL Editor」で以下のファイルを実行：

```bash
database/session-media-storage-policies.sql
```

## 🔒 セキュリティについて

設定されるポリシーにより、以下のセキュリティが確保されます：

- ✅ ユーザーは自分のファイルのみアップロード可能
- ✅ ユーザーは自分のファイルのみ閲覧可能
- ✅ ユーザーは自分のファイルのみ削除可能
- ✅ 認証されていないユーザーはアクセス不可

## 📁 ファイル構造

アップロードされたファイルは以下の構造で保存されます：

```
session-media/
  └── {user_id}/
      └── session-media/
          ├── {session_id}_{timestamp}.jpg
          ├── {session_id}_{timestamp}.png
          └── ...
```

## ✅ 設定完了の確認

すべての設定が完了したら：

1. アプリを再起動
2. 写真アップロード機能をテスト
3. エラーが解消されていることを確認

## 🆘 トラブルシューティング

### バケットが見つからない場合
- バケット名が`session-media`であることを確認
- バケットが**Public bucket**として作成されていることを確認

### アップロードができない場合
- Supabaseプロジェクトの認証が正常に動作していることを確認
- ストレージポリシーが正しく設定されていることを確認
- ブラウザの開発者ツールでエラーの詳細を確認

### テーブルが見つからない場合
- `01-core-schema.sql`が実行済みであることを確認
- `05-media-schema.sql`が実行済みであることを確認 