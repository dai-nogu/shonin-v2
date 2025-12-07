import { Page, expect } from '@playwright/test';

/**
 * テスト用のヘルパー関数
 */

/**
 * ページがロードされるまで待機
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * エラーメッセージが表示されないことを確認
 */
export async function expectNoErrorMessages(page: Page) {
  const errorSelectors = [
    '[role="alert"]',
    '.error-message',
    '[data-testid="error"]',
  ];

  for (const selector of errorSelectors) {
    const errorElement = page.locator(selector);
    if (await errorElement.isVisible().catch(() => false)) {
      const errorText = await errorElement.textContent();
      throw new Error(`予期しないエラーメッセージが表示されました: ${errorText}`);
    }
  }
}

/**
 * 指定されたURLにリダイレクトされるまで待機
 */
export async function waitForNavigation(page: Page, urlPattern: string | RegExp, timeout = 30000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const currentUrl = page.url();
    
    if (typeof urlPattern === 'string') {
      if (currentUrl.includes(urlPattern)) {
        return;
      }
    } else {
      if (urlPattern.test(currentUrl)) {
        return;
      }
    }
    
    await page.waitForTimeout(500);
  }
  
  throw new Error(`タイムアウト: ${urlPattern} へのナビゲーションが完了しませんでした`);
}

/**
 * ローディング状態が終了するまで待機
 */
export async function waitForLoadingToFinish(page: Page) {
  // ローディングスピナーが消えるまで待機
  const loadingSelectors = [
    '.animate-spin',
    '[data-testid="loading"]',
    '.loading',
  ];

  for (const selector of loadingSelectors) {
    const loadingElement = page.locator(selector);
    if (await loadingElement.isVisible().catch(() => false)) {
      await loadingElement.waitFor({ state: 'hidden', timeout: 30000 });
    }
  }
}

/**
 * トーストメッセージが表示されることを確認
 */
export async function expectToastMessage(page: Page, message: string, timeout = 5000) {
  const toast = page.locator('[role="status"], .toast, [data-sonner-toast]').filter({ hasText: message });
  await expect(toast).toBeVisible({ timeout });
}

/**
 * モーダルが開いていることを確認
 */
export async function expectModalOpen(page: Page, modalTitle?: string) {
  const modal = page.locator('[role="dialog"]');
  await expect(modal).toBeVisible();
  
  if (modalTitle) {
    const title = modal.locator('h2, [role="heading"]').filter({ hasText: modalTitle });
    await expect(title).toBeVisible();
  }
}

/**
 * モーダルを閉じる
 */
export async function closeModal(page: Page) {
  // Escapeキーでモーダルを閉じる
  await page.keyboard.press('Escape');
  
  // モーダルが閉じるまで待機
  const modal = page.locator('[role="dialog"]');
  await modal.waitFor({ state: 'hidden', timeout: 5000 });
}

/**
 * セレクトボックスから値を選択
 */
export async function selectOption(page: Page, label: string, value: string) {
  // ラベルでセレクトボックスを見つける
  const select = page.locator(`label:has-text("${label}")`).locator('..').locator('select, [role="combobox"]');
  
  // select要素の場合
  if (await select.evaluate(el => el.tagName === 'SELECT')) {
    await select.selectOption(value);
  } 
  // Radix UIのSelectの場合
  else {
    await select.click();
    await page.locator(`[role="option"]:has-text("${value}")`).click();
  }
}

/**
 * 日付ピッカーから日付を選択
 */
export async function selectDate(page: Page, date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // カレンダーピッカーを開く
  const dateButton = page.locator('[aria-label*="日付"], [aria-label*="Date"]');
  await dateButton.click();
  
  // 年月を選択
  await page.locator(`[data-year="${year}"][data-month="${month}"]`).waitFor({ timeout: 5000 });
  
  // 日を選択
  await page.locator(`[data-day="${day}"]`).click();
}

/**
 * フォームに入力
 */
export async function fillForm(page: Page, formData: Record<string, string>) {
  for (const [label, value] of Object.entries(formData)) {
    const input = page.locator(`label:has-text("${label}")`).locator('..').locator('input, textarea');
    await input.fill(value);
  }
}

/**
 * ページのスクリーンショットを撮る（デバッグ用）
 */
export async function takeDebugScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `./e2e-screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

/**
 * コンソールエラーをキャプチャ
 */
export function captureConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  
  return errors;
}

