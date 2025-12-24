/**
 * Horizon画面のキャッシュを更新するためのユーティリティ関数
 * 目標設定画面などで目標やアクティビティが追加・更新・削除された時に呼び出す
 */
export function refreshHorizonCache() {
  // カスタムイベントを発火してHorizonPageにキャッシュ更新を通知
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('refresh-horizon-cache');
    window.dispatchEvent(event);
    console.log('Cache refresh event dispatched');
  }
}

