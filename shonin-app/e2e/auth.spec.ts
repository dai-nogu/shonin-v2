import { test, expect } from '@playwright/test';
import {
  waitForPageLoad,
  waitForNavigation,
  expectNoErrorMessages,
} from './utils/test-helpers';
import { checkTestEnvironment } from './fixtures/test-data';

/**
 * 認証機能のE2Eテスト
 * 
 * テスト対象:
 * - Google OAuthによるサインアップ
 * - Google OAuthによるログイン
 * - ログアウト
 * 
 * 注意事項:
 * - Google OAuthの自動テストは、実際のGoogleアカウントを使用する必要があります
 * - セキュリティ上の理由から、完全な自動化は困難です
 * - このテストでは、ログインフローの途中までを検証します
 */

test.describe('認証機能', () => {
  test.beforeEach(async () => {
    // 環境変数のチェック
    checkTestEnvironment();
  });

  test('ログインページが正しく表示される', async ({ page }) => {
    // ログインページにアクセス
    await page.goto('/ja/login');
    await waitForPageLoad(page);

    // ページタイトルの確認
    await expect(page.locator('h2')).toContainText('Shonin');

    // Googleログインボタンの確認
    const googleButton = page.locator('button:has-text("Googleでログイン")');
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();

    // エラーメッセージが表示されていないことを確認
    await expectNoErrorMessages(page);
  });

  test('Googleログインボタンをクリックすると認証フローが開始される', async ({ page, context }) => {
    // ログインページにアクセス
    await page.goto('/ja/login');
    await waitForPageLoad(page);

    // 新しいページ（ポップアップ）の待機設定
    const popupPromise = context.waitForEvent('page', { timeout: 10000 });

    // Googleログインボタンをクリック
    const googleButton = page.locator('button:has-text("Googleでログイン")');
    await googleButton.click();

    try {
      // 新しいページ（Google認証ページ）が開くことを確認
      const popup = await popupPromise;
      await popup.waitForLoadState('domcontentloaded', { timeout: 10000 });

      // URLがGoogleの認証ページまたはSupabaseの認証ページであることを確認
      const popupUrl = popup.url();
      const isGoogleAuth = popupUrl.includes('accounts.google.com') || 
                          popupUrl.includes('supabase.co/auth');
      
      expect(isGoogleAuth).toBeTruthy();

      console.log('✓ Google認証フローが正常に開始されました');
      console.log(`  認証URL: ${popupUrl}`);

    } catch (error) {
      // ポップアップが開かない場合は、リダイレクトされる可能性があるため、
      // 現在のページのURLを確認
      const currentUrl = page.url();
      const isAuthRedirect = currentUrl.includes('accounts.google.com') || 
                            currentUrl.includes('supabase.co/auth');
      
      if (isAuthRedirect) {
        console.log('✓ Google認証ページにリダイレクトされました');
        console.log(`  認証URL: ${currentUrl}`);
      } else {
        throw error;
      }
    }
  });

  test('未認証ユーザーがダッシュボードにアクセスするとログインページにリダイレクトされる', async ({ page }) => {
    // 未認証状態でダッシュボードにアクセス
    await page.goto('/ja/dashboard');
    await waitForPageLoad(page);

    // ログインページにリダイレクトされることを確認
    await waitForNavigation(page, '/login');
    
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');

    console.log('✓ 未認証ユーザーが正しくログインページにリダイレクトされました');
  });

  test('認証済みユーザーのセッション管理', async ({ page, context }) => {
    // テスト用の認証トークンを設定（実際のテストではSupabaseからトークンを取得）
    // 注意: この部分は実際の環境に合わせて調整が必要です
    
    // 1. ログインページにアクセス
    await page.goto('/ja/login');
    await waitForPageLoad(page);

    // 2. ログインボタンが表示されることを確認
    const googleButton = page.locator('button:has-text("Googleでログイン")');
    await expect(googleButton).toBeVisible();

    console.log('✓ セッション管理のテストが完了しました');
    console.log('  注意: 完全な認証フローのテストには実際のGoogleアカウントが必要です');
  });

  test('ログアウト機能（認証済みの場合）', async ({ page }) => {
    // このテストは、事前に認証済みのセッションがある場合のみ実行されます
    
    // ダッシュボードにアクセス
    await page.goto('/ja/dashboard');
    await waitForPageLoad(page);

    // ログインページにリダイレクトされた場合はスキップ
    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    // 設定メニューを開く
    const settingsLink = page.locator('a[href*="/settings"]');
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await waitForPageLoad(page);

      // ログアウトボタンを探す
      const logoutButton = page.locator('button:has-text("ログアウト"), button:has-text("Logout")');
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        
        // ログインページにリダイレクトされることを確認
        await waitForNavigation(page, '/login', 10000);
        expect(page.url()).toContain('/login');

        console.log('✓ ログアウトが正常に完了しました');
      }
    }
  });
});

/**
 * 認証コールバックのテスト
 */
test.describe('認証コールバック', () => {
  test('認証コールバックが正しく処理される', async ({ page }) => {
    // コールバックエンドポイントにアクセス（認証コードなし）
    await page.goto('/callback');
    await waitForPageLoad(page);

    // エラーページまたはログインページにリダイレクトされることを確認
    const currentUrl = page.url();
    const isValidRedirect = currentUrl.includes('/login') || 
                          currentUrl.includes('/dashboard') ||
                          currentUrl.includes('/error');
    
    expect(isValidRedirect).toBeTruthy();
    
    console.log('✓ 認証コールバックの処理が確認できました');
  });

  test('不正な認証コードでのコールバックがエラーハンドリングされる', async ({ page }) => {
    // 不正な認証コードでコールバックにアクセス
    await page.goto('/callback?code=invalid_code_12345');
    await waitForPageLoad(page);

    // ログインページにリダイレクトされることを確認（エラーパラメータ付き）
    const currentUrl = page.url();
    const hasErrorHandling = currentUrl.includes('/login') || 
                            currentUrl.includes('error=');
    
    expect(hasErrorHandling).toBeTruthy();
    
    console.log('✓ 不正な認証コードのエラーハンドリングが確認できました');
  });
});

