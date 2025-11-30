# ストレージセキュリティ修正ガイド

## 概要
このドキュメントは、セッションメディア（画像・動画・音声）のストレージセキュリティ脆弱性を修正する手順を説明します。

## 修正内容

### 🔴 修正前の問題点

#### 1. ストレージRLSが広すぎる（重大度: 高）
```sql
-- ❌ 問題のあるポリシー
CREATE POLICY "Authenticated users can view session media" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'session-media' AND
        auth.role() = 'authenticated'  -- 認証済みなら誰でもアクセス可能
    );
```

**リスク:**
- 認証済みユーザーなら誰でも他人のファイルを閲覧・削除可能
- ファイルパスを推測されると横取りされる
- プライバシー侵害の重大なリスク

#### 2. 公開URLの永続保存（重大度: 高）
```typescript
// ❌ 問題のあるコード
const { data: { publicUrl } } = supabase.storage
  .from('session-media')
  .getPublicUrl(filePath)

// DBに永続保存
public_url: publicUrl  // URLを知っていれば誰でもアクセス可能
```

**リスク:**
- URLを知っている人は誰でもアクセス可能
- URLが漏洩すると取り消し不可能
- バケットが公開設定だとRLSが無効化される

### ✅ 修正後の設計

#### 1. ユーザー毎のスコープ制限
```sql
-- ✅ 修正後のポリシー
CREATE POLICY "Users can view own session media storage" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'session-media' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text  -- 自分のフォルダのみ
    );
```

**改善点:**
- パスの第1階層が `auth.uid()` と一致するもののみアクセス可能
- 他ユーザーのファイルは一切アクセス不可
- 横取り・無差別削除を完全防止

#### 2. 署名付きURL方式
```typescript
// ✅ 修正後のコード
// アップロード時: public_urlは保存しない
public_url: null

// 取得時: 署名付きURLを動的生成
const { data: signedUrlData } = await supabase.storage
  .from('session-media')
  .createSignedUrl(filePath, 3600)  // 1時間有効

return signedUrlData?.signedUrl || ''
```

**改善点:**
- URLは1時間で自動失効
- URLを知っていても有効期限切れでアクセス不可
- バケットを非公開にしてRLSを有効化

## 適用手順

### Step 1: Supabaseダッシュボードでバケット設定を変更

1. Supabase Dashboard > Storage > `session-media` バケット
2. Settings を開く
3. **Public bucket のチェックを外す（Private に変更）**
4. Save

⚠️ **重要:** Public bucketのままだとRLSが無効化されます

### Step 2: データベースポリシーを更新

```bash
# Supabase SQL Editorで実行
psql -f database/session-media-storage-policies.sql
```

このSQLファイルは以下を実行します:
- 既存の脆弱なポリシーを削除
- ユーザー毎にスコープ制限された新ポリシーを作成
- session_mediaテーブルとstorage.objectsの両方に適用

### Step 3: 既存データのマイグレーション（必要な場合）

既に `public_url` が保存されているデータがある場合:

```sql
-- public_urlをnullにクリア（署名付きURL方式に移行）
UPDATE public.session_media
SET public_url = NULL
WHERE public_url IS NOT NULL;
```

### Step 4: アプリケーションコードの確認

修正済みのファイル:
- `lib/upload-photo.ts` - 署名付きURL生成に対応
- `database/session-media-storage-policies.sql` - RLSポリシー修正
- `database/05-media-schema.sql` - スキーマコメント更新

変更は自動的に適用されます（再デプロイ不要）。

## セキュリティ設計

### パス構造
```
{user_id}/session-media/{session_id}_{timestamp}.{ext}

例:
550e8400-e29b-41d4-a716-446655440000/session-media/abc123_1234567890.jpg
```

### RLS制限
- **session_mediaテーブル:** セッション所有者のみアクセス可能
- **storage.objects:** パスの第1階層が `auth.uid()` と一致するもののみ

### URL方式
- ❌ Public URL（永続・誰でもアクセス可能）
- ✅ 署名付きURL（1時間有効・認証必須）

### バケット設定
- ❌ Public bucket（RLS無効化）
- ✅ Private bucket（RLS有効）

## 確認方法

### 1. ポリシーの確認
```sql
-- session_mediaテーブルのポリシー
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'session_media';

-- ストレージポリシー
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%session media%';
```

### 2. 動作確認
1. ユーザーAでログイン
2. 画像をアップロード
3. ユーザーBでログイン
4. ユーザーAの画像にアクセス試行 → **403 Forbiddenになることを確認**

### 3. URL有効期限の確認
1. 画像を取得してURLをコピー
2. 1時間後にアクセス → **期限切れエラーになることを確認**

## トラブルシューティング

### 画像が表示されない
- バケットがPrivateになっているか確認
- RLSポリシーが正しく適用されているか確認
- 署名付きURLが生成されているか確認（console.log）

### 403 Forbidden エラー
- ファイルパスが `{user_id}/session-media/` で始まっているか確認
- `auth.uid()` とファイルパスの第1階層が一致しているか確認

### ポリシーが適用されない
```sql
-- RLSが有効になっているか確認
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'session_media';

-- 有効化されていない場合
ALTER TABLE public.session_media ENABLE ROW LEVEL SECURITY;
```

## 参考資料

- [Supabase Storage RLS](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase Signed URLs](https://supabase.com/docs/guides/storage/serving/downloads#authenticated-downloads)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

## 変更履歴

- 2025-01-XX: 初版作成（ストレージセキュリティ脆弱性修正）

