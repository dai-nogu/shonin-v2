/**
 * Principles Selector - 状況に応じた心理学・行動科学の法則選択システム
 * 
 * 87個の法則・理論から、フィードバックのコンテキストに最適な法則を選択
 */

import principlesData from '@/data/principles.json';

// 型定義
export interface Principle {
  id: string;
  name: {
    ja: string;
    en: string;
  };
  field: string;
  summary: {
    ja: string;
    en: string;
  };
  application: string;
  tags: string[];
  tone: string;
}

export interface PrinciplesCollection {
  meta: {
    title: string;
    categories: string[];
    count: number;
    description_ja: string;
    description_en: string;
  };
  principles: Principle[];
}

// principles.jsonデータ
const principles = principlesData as PrinciplesCollection;

/**
 * 学問分野のマッピング（FBトーンと対応）
 */
const FIELD_TO_TONE_MAP: Record<string, string> = {
  'psychology': 'psychology',
  'behavioral_economics': 'behavioralEconomics',
  'neuroscience': 'neuroscience',
  'social_psychology': 'humanBehavior',
  'behavioral_science': 'behavioralEconomics',
  'philosophy': 'philosophy',
  'ethology': 'ethology',
  'cognitive_science': 'psychology',
  'education': 'humanBehavior'
};

/**
 * 法則選択結果
 */
export interface PrincipleSelectionResult {
  principle: Principle | null;
  reason: string;
}

/**
 * ユーザーデータに基づく法則選択のコンテキスト
 */
export interface PrincipleSelectionContext {
  locale: 'ja' | 'en';
  sessionCount?: number;
  totalHours?: number;
  consistency?: number;
  moodTrend?: 'improving' | 'stable' | 'declining' | 'unknown';
  averageMood?: number;
  goalAchievementRate?: number;
  hasReflections?: boolean;
}

/**
 * ユーザーコンテキストに基づいて最適な法則を選択（週次フィードバック用）
 */
export function selectPrincipleForContext(
  context: PrincipleSelectionContext
): PrincipleSelectionResult {
  // 全87個の法則から選択
  let candidates = principles.principles;
  const initialCount = candidates.length;
  const reasons: string[] = [];
  
  // ユーザーの行動データに基づいて関連タグを判定
  const relevantTags: string[] = [];
  // 1. 継続性に基づくタグ
  if (context.consistency !== undefined) {
    if (context.consistency > 0.7) {
      relevantTags.push('habit', 'continuity', 'consistency', 'automaticity');
      reasons.push(`継続性が高い（${Math.round(context.consistency * 100)}%）ため「習慣・継続」関連`);
    } else if (context.consistency < 0.3) {
      relevantTags.push('start', 'beginning', 'motivation', 'small_steps');
      reasons.push('継続性が低めのため「始まり・動機づけ」関連');
    }
  }
  
  // 2. 気分トレンドに基づくタグ
  if (context.moodTrend) {
    if (context.moodTrend === 'improving') {
      relevantTags.push('growth', 'learning', 'progress', 'adaptation');
      reasons.push('気分が改善傾向のため「成長・学習」関連');
    } else if (context.moodTrend === 'declining') {
      relevantTags.push('stress', 'balance', 'rest', 'acceptance');
      reasons.push('気分が低下傾向のため「バランス・休息」関連');
    } else if (context.moodTrend === 'stable') {
      relevantTags.push('stability', 'balance', 'control');
      reasons.push('気分が安定しているため「安定性・コントロール」関連');
    }
  }
  
  // 3. 平均気分に基づくタグ
  if (context.averageMood !== undefined) {
    if (context.averageMood >= 4) {
      relevantTags.push('motivation', 'flow', 'performance');
      reasons.push(`平均気分が高い（${context.averageMood.toFixed(1)}）ため「動機・フロー」関連`);
    } else if (context.averageMood < 3) {
      relevantTags.push('resilience', 'persistence', 'willpower');
      reasons.push(`平均気分が低め（${context.averageMood.toFixed(1)}）のため「忍耐・意志力」関連`);
    }
  }
  
  // 4. 活動量に基づくタグ
  if (context.totalHours !== undefined) {
    if (context.totalHours > 15) {
      relevantTags.push('effort', 'dedication', 'mastery');
      reasons.push(`総活動時間が多い（${context.totalHours}h）ため「努力・熟達」関連`);
    } else if (context.totalHours < 5) {
      relevantTags.push('small_steps', 'beginning', 'ease');
      reasons.push('活動量が少ないため「小さな一歩・容易さ」関連');
    }
  }
  
  // 5. 目標達成率に基づくタグ
  if (context.goalAchievementRate !== undefined) {
    if (context.goalAchievementRate > 0.7) {
      relevantTags.push('achievement', 'success', 'confidence');
      reasons.push(`目標達成率が高い（${Math.round(context.goalAchievementRate * 100)}%）ため「達成・自信」関連`);
    } else if (context.goalAchievementRate < 0.3) {
      relevantTags.push('patience', 'process', 'flexibility');
      reasons.push('目標達成率が低めのため「忍耐・プロセス」関連');
    }
  }
  
  // 6. 振り返りメモの有無に基づくタグ
  if (context.hasReflections) {
    relevantTags.push('awareness', 'reflection', 'cognition', 'metacognition');
    reasons.push('振り返りメモがあるため「気づき・メタ認知」関連');
  }
  
  // タグに基づいてフィルタリング（優先度付き）
  let filteredByTags: typeof candidates = [];
  
  if (relevantTags.length > 0) {
    // 完全一致または部分一致する法則を探す
    filteredByTags = candidates.filter(p => 
      p.tags && p.tags.some(tag => 
        relevantTags.some(rt => 
          tag.toLowerCase().includes(rt.toLowerCase()) || 
          rt.toLowerCase().includes(tag.toLowerCase())
        )
      )
    );
    
    if (filteredByTags.length > 0) {
      candidates = filteredByTags;
      reasons.push(`タグマッチングで${initialCount}個→${candidates.length}個に絞り込み`);
    } else {
      reasons.push(`タグマッチングしたが該当なしのため全${initialCount}個から選択`);
    }
  }
  
  // 最終的に1つ選択
  const randomIndex = Math.floor(Math.random() * candidates.length);
  const selectedPrinciple = candidates[randomIndex];
  
  // 学問分野名のマッピング
  const fieldNames: Record<string, string> = {
    'psychology': '心理学',
    'behavioral_economics': '行動経済学',
    'neuroscience': '脳神経科学',
    'social_psychology': '社会心理学',
    'behavioral_science': '行動科学',
    'philosophy': '哲学',
    'ethology': '動物行動学',
    'cognitive_science': '認知科学',
    'education': '教育学'
  };
  
  const baseReason = `全${initialCount}個の法則から選択`;
  const fieldInfo = ` → 選ばれた法則の学問分野: ${fieldNames[selectedPrinciple.field] || selectedPrinciple.field}`;
  const detailedReasons = reasons.length > 0 ? `。${reasons.join('。')}` : '';
  const principleInfo = `。選ばれた法則: ${selectedPrinciple.name.ja}、タグ=${selectedPrinciple.tags?.join(', ') || 'なし'}`;
  
  return { 
    principle: selectedPrinciple, 
    reason: baseReason + fieldInfo + detailedReasons + principleInfo
  };
}

/**
 * 法則を文章として整形（週次フィードバック用）
 * 例: 「ヘッブの法則によれば、繰り返される行動は神経回路を強化します。」
 */
export function formatPrincipleForFeedback(principle: Principle, locale: 'ja' | 'en'): string {
  const name = locale === 'ja' ? principle.name.ja : principle.name.en;
  const summary = locale === 'ja' ? principle.summary.ja : principle.summary.en;
  
  if (locale === 'ja') {
    return `『${name}』によれば、${summary}`;
  } else {
    return `According to ${name}, ${summary.toLowerCase()}`;
  }
}

/**
 * 月次フィードバック用: 複数の法則を統合して選択
 */
export function selectPrinciplesForMonthly(
  locale: 'ja' | 'en',
  analysisContext: {
    totalHours: number;
    sessionCount: number;
    consistency: number;
    moodTrend: 'improving' | 'stable' | 'declining' | 'unknown';
    averageMood: number;
    goalAchievementRate?: number;
    hasReflections: boolean;
  }
): Principle[] {
  // 月次は複数の視点から法則を選択（将来的な拡張用）
  // 現在は週次と同じロジックを使用
  return [];
}

