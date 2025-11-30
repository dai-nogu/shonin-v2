/**
 * Session Analyzer - 層①：ローデータ解析
 * 
 * Supabaseから取得したセッションデータを構造化されたデータに変換
 * プロンプト生成層に渡すための中間データ形式を生成
 * 
 * 【セキュリティ対策】
 * - 個別セッションの入力フィールドに文字数制限を適用
 * - プロンプトインジェクション攻撃のリスクを低減
 */

import { JA_INPUT_LIMITS } from './input-limits';
import { sanitizeXssNullable } from './xss-sanitize';

// =========================================
// 入力制限設定
// =========================================

/**
 * 個別セッションフィールドの文字数制限
 * 日本語基準（1000文字）を適用
 * フロントエンドで制限されているので、ここではそれに準拠
 */
const PER_SESSION_FIELD_LIMIT = JA_INPUT_LIMITS.sessionAchievements;

/**
 * 文字数制限を適用
 */
function truncateField(input: string | undefined, maxLength: number = PER_SESSION_FIELD_LIMIT): string {
  if (!input) return '';
  if (input.length <= maxLength) return input;
  
  // 句読点で区切れるか試みる
  const lastPeriodJa = input.lastIndexOf('。', maxLength);
  const lastPeriodEn = input.lastIndexOf('.', maxLength);
  const lastComma = input.lastIndexOf('、', maxLength);
  const lastSpace = input.lastIndexOf(' ', maxLength);
  
  const breakPoints = [lastPeriodJa, lastPeriodEn, lastComma, lastSpace].filter(p => p > maxLength * 0.7);
  const bestBreak = breakPoints.length > 0 ? Math.max(...breakPoints) : maxLength;
  
  return input.substring(0, bestBreak) + '...';
}

/**
 * 分析対象のセッションデータ（Supabaseから取得）
 */
export interface RawSessionData {
  id: string;
  duration: number;
  session_date: string;
  mood?: number;
  achievements?: string;
  challenges?: string;
  notes?: string;
  location?: string;
  goal_id?: string;
  activity_id?: string;
  start_time?: string;
  activities?: {
    name: string;
  };
  goals?: {
    id: string;
    title: string;
    description?: string;
    deadline?: string;
    target_duration?: number;
    weekday_hours?: number;
    weekend_hours?: number;
    current_value?: number;
    status?: string;
  };
}

/**
 * 構造化された分析結果（プロンプト生成層への入力）
 */
export interface AnalyzedSessionData {
  // 基本統計
  totalDuration: number;        // 秒単位
  totalHours: number;           // 時間単位（小数点1桁）
  sessionsCount: number;
  averageDuration: number;      // 秒単位
  
  // 気分分析
  averageMood: number;          // 平均気分スコア（1-5）
  moodTrend: 'improving' | 'stable' | 'declining' | 'unknown';
  
  // アクティビティ分析
  activities: Record<string, {
    duration: number;           // 秒単位
    count: number;
    percentage: number;
  }>;
  topActivities: Array<{
    name: string;
    duration: number;
    percentage: number;
  }>;
  
  // 振り返り分析
  achievements: string;         // 結合された成果テキスト
  challenges: string;           // 結合された課題テキスト
  notes: string;                // 結合されたメモテキスト
  reflectionQuality: 'detailed' | 'moderate' | 'minimal' | 'none';
  
  // 目標分析
  goalProgress: Record<string, {
    goalId: string;
    title: string;
    description: string;
    deadline?: string;
    targetDuration: number;     // 秒単位
    currentValue: number;       // 秒単位
    status: string;
    activities: Record<string, number>;  // アクティビティ名 → 時間（秒）
    totalSessionTime: number;   // この期間の総時間（秒）
    sessionCount: number;
    progressPercentage: number; // 進捗率
  }>;
  
  // 行動パターン分析
  behaviorPatterns: {
    timeOfDay: Record<string, number>;    // 時間帯別の活動時間
    dayOfWeek: Record<string, number>;    // 曜日別の活動時間
    locations: Record<string, number>;    // 場所別の活動時間
    consistency: number;                  // 継続性スコア（0-1）
  };
  
  // メタデータ
  periodStart: string;
  periodEnd: string;
  periodType: 'weekly' | 'monthly';
}

/**
 * セッションデータを分析して構造化データに変換
 */
export function analyzeSessionData(
  sessions: RawSessionData[],
  periodType: 'weekly' | 'monthly',
  periodStart: string,
  periodEnd: string
): AnalyzedSessionData {
  // 基本統計の計算
  const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalHours = Math.round(totalDuration / 3600 * 10) / 10;
  const sessionsCount = sessions.length;
  const averageDuration = sessionsCount > 0 ? totalDuration / sessionsCount : 0;
  
  // 気分分析
  const moodSessions = sessions.filter(s => s.mood != null);
  const averageMood = moodSessions.length > 0
    ? moodSessions.reduce((sum, s) => sum + (s.mood || 0), 0) / moodSessions.length
    : 0;
  
  const moodTrend = calculateMoodTrend(sessions);
  
  // アクティビティ分析（XSS対策: アクティビティ名をサニタイズ）
  const activitiesMap: Record<string, { duration: number; count: number }> = {};
  sessions.forEach(session => {
    const activityName = sanitizeXssNullable(session.activities?.name) || '不明な活動';
    if (!activitiesMap[activityName]) {
      activitiesMap[activityName] = { duration: 0, count: 0 };
    }
    activitiesMap[activityName].duration += session.duration || 0;
    activitiesMap[activityName].count += 1;
  });
  
  const activities: Record<string, { duration: number; count: number; percentage: number }> = {};
  Object.entries(activitiesMap).forEach(([name, data]) => {
    activities[name] = {
      ...data,
      percentage: totalDuration > 0 ? (data.duration / totalDuration) * 100 : 0
    };
  });
  
  const topActivities = Object.entries(activities)
    .sort((a, b) => b[1].duration - a[1].duration)
    .slice(0, 5)
    .map(([name, data]) => ({
      name,
      duration: data.duration,
      percentage: data.percentage
    }));
  
  // 振り返り分析（XSS対策 + 個別セッションの文字数制限を適用）
  // ユーザー入力をAIに渡す前にサニタイズし、<achievements>などのタグを誤認しないようにする
  const achievements = sessions
    .filter(s => s.achievements)
    .map(s => truncateField(sanitizeXssNullable(s.achievements) || ''))
    .join('\n');
  
  const challenges = sessions
    .filter(s => s.challenges)
    .map(s => truncateField(sanitizeXssNullable(s.challenges) || ''))
    .join('\n');
  
  const notes = sessions
    .filter(s => s.notes)
    .map(s => truncateField(sanitizeXssNullable(s.notes) || ''))
    .join('\n');
  
  const reflectionQuality = calculateReflectionQuality(sessions);
  
  // 目標分析
  const goalProgress = analyzeGoalProgress(sessions);
  
  // 行動パターン分析
  const behaviorPatterns = analyzeBehaviorPatterns(sessions);
  
  return {
    totalDuration,
    totalHours,
    sessionsCount,
    averageDuration,
    averageMood,
    moodTrend,
    activities,
    topActivities,
    achievements,
    challenges,
    notes,
    reflectionQuality,
    goalProgress,
    behaviorPatterns,
    periodStart,
    periodEnd,
    periodType
  };
}

/**
 * 気分のトレンドを計算
 */
function calculateMoodTrend(sessions: RawSessionData[]): 'improving' | 'stable' | 'declining' | 'unknown' {
  const moodSessions = sessions
    .filter(s => s.mood != null)
    .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());
  
  if (moodSessions.length < 2) return 'unknown';
  
  const firstHalf = moodSessions.slice(0, Math.floor(moodSessions.length / 2));
  const secondHalf = moodSessions.slice(Math.floor(moodSessions.length / 2));
  
  const firstHalfAvg = firstHalf.reduce((sum, s) => sum + (s.mood || 0), 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, s) => sum + (s.mood || 0), 0) / secondHalf.length;
  
  const diff = secondHalfAvg - firstHalfAvg;
  
  if (diff > 0.3) return 'improving';
  if (diff < -0.3) return 'declining';
  return 'stable';
}

/**
 * 振り返りの質を評価
 */
function calculateReflectionQuality(sessions: RawSessionData[]): 'detailed' | 'moderate' | 'minimal' | 'none' {
  const reflections = sessions.filter(s => s.achievements || s.challenges);
  
  if (reflections.length === 0) return 'none';
  
  const avgLength = reflections.reduce((sum, s) => {
    const achievementLength = (s.achievements || '').length;
    const challengeLength = (s.challenges || '').length;
    return sum + achievementLength + challengeLength;
  }, 0) / reflections.length;
  
  const reflectionRate = reflections.length / sessions.length;
  
  if (avgLength > 100 && reflectionRate > 0.7) return 'detailed';
  if (avgLength > 50 && reflectionRate > 0.4) return 'moderate';
  return 'minimal';
}

/**
 * 目標別の進捗を分析
 */
function analyzeGoalProgress(sessions: RawSessionData[]): Record<string, any> {
  const goalMap: Record<string, any> = {};
  
  sessions.forEach(session => {
    if (!session.goals || !session.goal_id) return;
    
    const goalId = session.goal_id;
    if (!goalMap[goalId]) {
      // ユーザー入力をAIに渡す前にサニタイズ
      goalMap[goalId] = {
        goalId,
        title: sanitizeXssNullable(session.goals.title) || '',
        description: sanitizeXssNullable(session.goals.description) || '',
        deadline: session.goals.deadline,
        targetDuration: session.goals.target_duration || 0,
        currentValue: session.goals.current_value || 0,
        status: session.goals.status || 'active',
        activities: {},
        totalSessionTime: 0,
        sessionCount: 0,
        progressPercentage: 0
      };
    }
    
    const activityName = sanitizeXssNullable(session.activities?.name) || '不明な活動';
    goalMap[goalId].activities[activityName] = 
      (goalMap[goalId].activities[activityName] || 0) + (session.duration || 0);
    goalMap[goalId].totalSessionTime += session.duration || 0;
    goalMap[goalId].sessionCount += 1;
  });
  
  // 進捗率を計算
  Object.values(goalMap).forEach((goal: any) => {
    if (goal.targetDuration > 0) {
      const totalProgress = goal.currentValue + goal.totalSessionTime;
      goal.progressPercentage = Math.round((totalProgress / goal.targetDuration) * 100);
    }
  });
  
  return goalMap;
}

/**
 * 行動パターンを分析
 */
function analyzeBehaviorPatterns(sessions: RawSessionData[]) {
  const timeOfDay: Record<string, number> = {
    '早朝（5-8時）': 0,
    '午前（8-12時）': 0,
    '午後（12-17時）': 0,
    '夕方（17-20時）': 0,
    '夜（20-24時）': 0,
    '深夜（0-5時）': 0
  };
  
  const dayOfWeek: Record<string, number> = {
    '月': 0, '火': 0, '水': 0, '木': 0, '金': 0, '土': 0, '日': 0
  };
  
  const locations: Record<string, number> = {};
  
  sessions.forEach(session => {
    // 時間帯分析
    if (session.start_time) {
      const hour = new Date(session.start_time).getHours();
      if (hour >= 5 && hour < 8) timeOfDay['早朝（5-8時）'] += session.duration || 0;
      else if (hour >= 8 && hour < 12) timeOfDay['午前（8-12時）'] += session.duration || 0;
      else if (hour >= 12 && hour < 17) timeOfDay['午後（12-17時）'] += session.duration || 0;
      else if (hour >= 17 && hour < 20) timeOfDay['夕方（17-20時）'] += session.duration || 0;
      else if (hour >= 20 && hour < 24) timeOfDay['夜（20-24時）'] += session.duration || 0;
      else timeOfDay['深夜（0-5時）'] += session.duration || 0;
    }
    
    // 曜日分析
    const date = new Date(session.session_date);
    const dayIndex = date.getDay();
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    dayOfWeek[days[dayIndex]] += session.duration || 0;
    
    // 場所分析（XSS対策: 場所名をサニタイズ）
    if (session.location) {
      const sanitizedLocation = sanitizeXssNullable(session.location) || '';
      if (sanitizedLocation) {
        locations[sanitizedLocation] = (locations[sanitizedLocation] || 0) + (session.duration || 0);
      }
    }
  });
  
  // 継続性スコアを計算（セッション間隔の一貫性）
  const consistency = calculateConsistency(sessions);
  
  return {
    timeOfDay,
    dayOfWeek,
    locations,
    consistency
  };
}

/**
 * 継続性スコアを計算
 */
function calculateConsistency(sessions: RawSessionData[]): number {
  if (sessions.length < 2) return 0;
  
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
  );
  
  const intervals: number[] = [];
  for (let i = 1; i < sortedSessions.length; i++) {
    const diff = new Date(sortedSessions[i].session_date).getTime() - 
                 new Date(sortedSessions[i - 1].session_date).getTime();
    intervals.push(diff / (1000 * 60 * 60 * 24)); // 日数に変換
  }
  
  if (intervals.length === 0) return 0;
  
  const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
  const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);
  
  // 標準偏差が小さいほど一貫性が高い（0-1にスケール）
  const consistencyScore = Math.max(0, 1 - (stdDev / 7)); // 7日以上のばらつきは0点
  
  return Math.round(consistencyScore * 100) / 100;
}

