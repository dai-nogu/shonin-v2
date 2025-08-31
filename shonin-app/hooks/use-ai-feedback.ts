'use client';

import { useState, useCallback } from 'react';

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
      start: lastWeekMonday.toISOString().split('T')[0],
      end: lastWeekSunday.toISOString().split('T')[0],
    };
  }, []);

  // 先月の日付範囲を計算
  const getLastMonthRange = useCallback(() => {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    
    return {
      start: lastMonth.toISOString().split('T')[0],
      end: lastMonthEnd.toISOString().split('T')[0],
    };
  }, []);

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