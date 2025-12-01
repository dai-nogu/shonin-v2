# CSRF保護の実装ガイド

## 概要
このドキュメントは、Cookie ベースの API エンドポイントに対する CSRF（Cross-Site Request Forgery）攻撃を防ぐための実装を説明します。

## 実装内容

### 1. SECURITY DEFINER 関数の安全性強化

#### 修正内容
`SECURITY DEFINER` 関数に `SET search_path` を追加して、関数インジェクション攻撃を防ぎます。

```sql
-- ✅ 修正後
CREATE OR REPLACE FUNCTION public.insert_encrypted_feedback(...)
RETURNS UUID AS $$
...
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp;  -- 追加
```

#### 脆弱性の説明
`SECURITY DEFINER` 関数は、関数の所有者の権限で実行されます。`search_path` が固定されていないと、攻撃者が悪意のある関数を作成して、関数の動作を乗っ取ることができます。

**攻撃例:**
```sql
-- 攻撃者が作成
CREATE SCHEMA attacker;
CREATE FUNCTION attacker.pgp_sym_encrypt(text, text) RETURNS bytea AS $$
  -- 暗号化せずに平文を記録
$$ LANGUAGE plpgsql;

-- ユーザーの search_path を変更
SET search_path = attacker, public;

-- SECURITY DEFINER 関数を実行
-- → attacker.pgp_sym_encrypt が呼ばれてしまう
```

#### 修正効果
- ✅ `search_path` を `public, pg_temp` に固定
- ✅ 攻撃者が作成した関数は呼ばれない
- ✅ 常に `public` スキーマの関数のみ使用

#### 修正したファイル
- `database/04-ai-features-schema.sql` - `insert_encrypted_feedback` 関数
- `database/03-reflections-schema.sql` - `update_session_reflections_encrypted` 関数

### 2. CSRF保護（Origin/Refererチェック）

#### 実装内容
Cookie ベースの認証を使用する API エンドポイントに Origin/Referer チェックを追加しました。

```typescript
// lib/csrf-protection.ts
export function validateOrigin(request: NextRequest): boolean {
  // GET リクエストは CSRF の対象外
  if (request.method === 'GET') {
    return true
  }

  // Origin ヘッダーをチェック
  const origin = request.headers.get('origin')
  if (origin && isAllowedOrigin(origin)) {
    return true
  }

  // Referer をフォールバックとしてチェック
  const referer = request.headers.get('referer')
  if (referer) {
    const refererOrigin = new URL(referer).origin
    return isAllowedOrigin(refererOrigin)
  }

  return false
}
```

#### 脆弱性の説明
Cookie ベースの認証では、ブラウザが自動的に Cookie を送信するため、悪意のあるサイトから API を呼び出すことができます（CSRF攻撃）。

**攻撃例:**
```html
<!-- 悪意のあるサイト evil.com -->
<form action="https://shonin-app.com/api/ai/analyze-sessions" method="POST">
  <input type="hidden" name="period_type" value="weekly">
</form>
<script>
  // ユーザーが気づかないうちに送信
  document.forms[0].submit();
</script>
```

#### 修正効果
- ✅ 許可されたオリジンからのリクエストのみ受け付け
- ✅ 悪意のあるサイトからのリクエストは拒否
- ✅ CSRF攻撃を防止

#### 保護対象のエンドポイント
- `app/api/ai/analyze-sessions/route.ts` - AI分析API
- `app/api/ai/get-feedback/route.ts` - AIフィードバック取得API

## 環境変数の設定

`.env.local` に以下を追加してください：

```bash
# CSRF保護用のオリジン設定（本番ドメイン）
BASE_URL=https://your-domain.com

# 開発環境では自動的に localhost が許可されます
```

## 許可されるオリジン

以下のオリジンが自動的に許可されます：

1. `BASE_URL` 環境変数（本番ドメイン）
2. `http://localhost:3000` （開発環境）
3. `http://127.0.0.1:3000` （開発環境）
4. `https://shonin-app-*.vercel.app` （Vercelプレビュー環境）

## 既存の保護機能

### SameSite=Lax Cookie
Supabase の Cookie は `SameSite=Lax` 属性が設定されているため、一般的な CSRF 攻撃は既に防がれています。

**SameSite=Lax の保護範囲:**
- ✅ `<form>` タグからの POST リクエスト → Cookie が送信されない
- ✅ `<img>` タグからの GET リクエスト → Cookie が送信されない
- ✅ `fetch()` からのクロスオリジンリクエスト → Cookie が送信されない
- ⚠️ トップレベルナビゲーション（リンククリック）→ Cookie が送信される

### 今回追加した Origin チェック
SameSite=Lax では防げないエッジケースに対応：

- ✅ トップレベルナビゲーションからの攻撃
- ✅ 古いブラウザでの攻撃
- ✅ SameSite 属性が無効化された場合

## テスト方法

### 1. 正常なリクエスト
```bash
curl -X POST https://your-domain.com/api/ai/analyze-sessions \
  -H "Origin: https://your-domain.com" \
  -H "Content-Type: application/json" \
  -d '{"period_type":"weekly",...}'
```

**期待される結果:** 200 OK

### 2. 不正なオリジン
```bash
curl -X POST https://your-domain.com/api/ai/analyze-sessions \
  -H "Origin: https://evil.com" \
  -H "Content-Type: application/json" \
  -d '{"period_type":"weekly",...}'
```

**期待される結果:** 403 Forbidden

### 3. Origin ヘッダーなし
```bash
curl -X POST https://your-domain.com/api/ai/analyze-sessions \
  -H "Content-Type: application/json" \
  -d '{"period_type":"weekly",...}'
```

**期待される結果:** 403 Forbidden

## トラブルシューティング

### 403 Forbidden エラーが出る

**原因1: 環境変数が設定されていない**
```bash
# .env.local を確認
BASE_URL=https://your-domain.com
```

**原因2: Vercel プレビュー環境で動作しない**
```typescript
// lib/csrf-protection.ts の isAllowedOrigin 関数を確認
// Vercel プレビュー URL のパターンを調整
if (origin.match(/^https:\/\/your-app-[a-z0-9-]+\.vercel\.app$/)) {
  return true
}
```

### ログの確認
CSRF 攻撃の試行は自動的にログに記録されます：

```typescript
console.warn('CSRF attempt detected: Invalid origin', {
  origin: request.headers.get('origin'),
  referer: request.headers.get('referer'),
});
```

Vercel のログで確認してください。

## 将来的な拡張

### トークンベースの CSRF 対策
より強固な保護が必要な場合は、CSRF トークンを実装できます：

```typescript
// 1. トークン生成（サーバー側）
const csrfToken = generateCsrfToken()

// 2. トークンをクライアントに渡す
<meta name="csrf-token" content={csrfToken} />

// 3. リクエスト時にトークンを送信（クライアント側）
fetch('/api/ai/analyze-sessions', {
  headers: {
    'X-CSRF-Token': csrfToken
  }
})

// 4. トークンを検証（サーバー側）
if (!validateCsrfToken(request.headers.get('x-csrf-token'))) {
  return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
}
```

現在は Origin/Referer チェックで十分ですが、将来的に必要になった場合は `lib/csrf-protection.ts` に実装できます。

## セキュリティレベル

| 保護機能 | レベル | 実装状況 |
|---------|--------|---------|
| SameSite=Lax Cookie | 基本 | ✅ Supabase が提供 |
| Origin/Referer チェック | 中 | ✅ 実装済み |
| CSRF トークン | 高 | ⚪ 将来的に実装可能 |
| SECURITY DEFINER 強化 | 高 | ✅ 実装済み |

## 参考資料

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [PostgreSQL SECURITY DEFINER](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)
- [SameSite Cookie Explained](https://web.dev/samesite-cookies-explained/)

## 変更履歴

- 2025-01-XX: 初版作成（CSRF保護実装）

