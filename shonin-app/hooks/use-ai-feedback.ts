'use client';

import { useState, useCallback } from 'react';
import { getDateStringInTimezone } from '@/lib/timezone-utils';
import { useTimezone } from '@/contexts/timezone-context';

interface AIFeedbackResponse {
  feedback: string;
  period_type: 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  sessions_count?: number;
}

interface AIFeedbackError {
  message: string;
}

export function useAIFeedback() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { timezone } = useTimezone();

  const generateFeedback = useCallback(async (
    periodType: 'weekly' | 'monthly',
    periodStart: string,
    periodEnd: string
  ): Promise<AIFeedbackResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/analyze-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 認証情報を含める
        body: JSON.stringify({
          period_type: periodType,
          period_start: periodStart,
          period_end: periodEnd,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'フィードバック生成に失敗しました');
      }

      const data: AIFeedbackResponse = await response.json();
      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'フィードバック生成中にエラーが発生しました';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    
    const result = {
      start: getDateStringInTimezone(lastMonthStart, timezone),
      end: getDateStringInTimezone(lastMonthEnd, timezone),
    };
    
    console.log('月次フィードバック期間 (タイムゾーン考慮):', result);
    return result;
  }, [timezone]);

  // 週次フィードバックを生成
  const generateWeeklyFeedback = useCallback(async () => {
    const { start, end } = getLastWeekRange();
    return generateFeedback('weekly', start, end);
  }, [generateFeedback, getLastWeekRange]);

  // 月次フィードバックを生成
  const generateMonthlyFeedback = useCallback(async () => {
    const { start, end } = getLastMonthRange();
    return generateFeedback('monthly', start, end);
  }, [generateFeedback, getLastMonthRange]);

  return {
    isLoading,
    error,
    generateFeedback,
    generateWeeklyFeedback,
    generateMonthlyFeedback,
    getLastWeekRange,
    getLastMonthRange,
  };
} 