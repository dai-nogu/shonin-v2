'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { getDateStringInTimezone } from '@/lib/timezone-utils';
import { useTimezone } from '@/contexts/timezone-context';
import { useParams } from 'next/navigation';

interface FeedbackContent {
  overview: string;
  principle_application?: string | null;
  insight?: string;
  closing?: string;
  principle_definition?: string | null;
}

interface AIFeedbackResponse {
  feedback: FeedbackContent | string; // JSON構造またはフォールバック文字列
  period_type: 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  sessions_count?: number;
  created_at?: string;
  is_existing?: boolean;
}

interface AIFeedbackError {
  message: string;
}

export function useAIFeedback() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations();
  const { timezone } = useTimezone();
  const params = useParams();
  const locale = (params?.locale as string) || 'ja';

  // Note: フィードバック生成はCron Jobで自動実行されるため、手動生成機能は削除しました

  // 先週の日付範囲を計算（月曜〜日曜）
  const getLastWeekRange = useCallback(() => {
    const today = new Date();
    
    // 今週の月曜日を計算
    const thisWeekMonday = new Date(today);
    const daysSinceMonday = (today.getDay() + 6) % 7; // 月曜日を0とする
    thisWeekMonday.setDate(today.getDate() - daysSinceMonday);
    
    // 先週の月曜日
    const lastWeekMonday = new Date(thisWeekMonday);
    lastWeekMonday.setDate(thisWeekMonday.getDate() - 7);
    
    // 先週の日曜日
    const lastWeekSunday = new Date(lastWeekMonday);
    lastWeekSunday.setDate(lastWeekMonday.getDate() + 6);
    
    return {
      start: getDateStringInTimezone(lastWeekMonday, timezone),
      end: getDateStringInTimezone(lastWeekSunday, timezone),
    };
  }, [timezone]);

  // 先月の日付範囲を計算（前月1日〜前月末日）
  const getLastMonthRange = useCallback(() => {
    const today = new Date();
    
    // 前月の1日
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    
    // 前月の末日（今月の0日目 = 前月の最終日）
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    
    return {
      start: getDateStringInTimezone(lastMonthStart, timezone),
      end: getDateStringInTimezone(lastMonthEnd, timezone),
    };
  }, [timezone]);

  // APIルート経由で既存フィードバックを取得
  const getExistingFeedback = useCallback(async (
    feedbackType: 'weekly' | 'monthly',
    periodStart: string,
    periodEnd: string
  ): Promise<AIFeedbackResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/get-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 認証情報を含める
        body: JSON.stringify({
          feedback_type: feedbackType,
          period_start: periodStart,
          period_end: periodEnd,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'フィードバック取得に失敗しました');
      }

      const data = await response.json();
      
      // フィードバックが存在しない場合
      if (!data.feedback) {
        return null;
      }

      return {
        feedback: data.feedback,
        period_type: data.period_type as 'weekly' | 'monthly',
        period_start: data.period_start,
        period_end: data.period_end,
        created_at: data.created_at,
        is_existing: true
      };

    } catch (err) {
      // Server Actionsのエラーメッセージは無視して、常に多言語対応メッセージを表示
      setError(t('ai_feedback.fetch_error'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // 週次フィードバックを取得（Cron Jobで自動生成されたものを取得）
  const getWeeklyFeedback = useCallback(async () => {
    const { start, end } = getLastWeekRange();
    return await getExistingFeedback('weekly', start, end);
  }, [getLastWeekRange, getExistingFeedback]);

  // 月次フィードバックを取得（Cron Jobで自動生成されたものを取得）
  const getMonthlyFeedback = useCallback(async () => {
    const { start, end } = getLastMonthRange();
    return await getExistingFeedback('monthly', start, end);
  }, [getLastMonthRange, getExistingFeedback]);

  return {
    isLoading,
    error,
    getWeeklyFeedback,
    getMonthlyFeedback,
  };
} 