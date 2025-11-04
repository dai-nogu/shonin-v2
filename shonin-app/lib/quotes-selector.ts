/**
 * Quotes Selector - 状況に応じた名言選択システム
 * 
 * 6つの学問領域に基づく120個の名言から、
 * フィードバックのコンテキストに最適な名言を選択
 */

import quotesData from '@/data/quotes.json';

// 型定義
export interface Quote {
  id: string;
  text: {
    ja: string;
    en: string;
  };
  author: string;
  source: {
    en: string;
    ja: string;
  };
  tags: string[];
  tone: string;
  maxLength: number;
  status: 'verified_exact' | 'verified_translation' | 'adapted' | 'attributed';
  note?: string;
}

export interface QuotesCollection {
  meta: {
    title: string;
    chapters: string[];
    count: number;
    schema: any;
    disclaimer_ja: string;
    disclaimer_en: string;
  };
  items: Quote[];
}

// quotes.jsonデータ
const quotes = quotesData as QuotesCollection;

/**
 * 学問領域のマッピング
 */
const CHAPTER_TO_TONE_MAP: Record<string, string> = {
  'philosophy': 'philosophy',
  'psych': 'psychology',
  'behavEcon': 'behavioral',
  'humanBehav': 'humanBehavior',
  'ethology': 'ethology',
  'neuro': 'neuroscience'
};

/**
 * 学問領域（チャプター）から名言をフィルタリング
 */
export function getQuotesByChapter(chapter: string): Quote[] {
  const prefix = chapter === 'philosophy' ? 'phil_' :
                 chapter === 'psych' ? 'psych_' :
                 chapter === 'behavEcon' ? 'behav_' :
                 chapter === 'humanBehav' ? 'human_' :
                 chapter === 'ethology' ? 'etho_' :
                 chapter === 'neuro' ? 'neuro_' : '';
  
  return quotes.items.filter(q => q.id.startsWith(prefix));
}

/**
 * タグで名言を検索
 */
export function getQuotesByTags(tags: string[]): Quote[] {
  return quotes.items.filter(q => 
    tags.some(tag => q.tags.includes(tag))
  );
}

/**
 * トーンで名言を検索
 */
export function getQuotesByTone(tone: string): Quote[] {
  return quotes.items.filter(q => q.tone === tone);
}

/**
 * ランダムに名言を1つ選択
 */
export function getRandomQuote(quotes: Quote[]): Quote | null {
  if (quotes.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
}

/**
 * トーンに基づいて名言を選択（週次フィードバック用）
 */
export function selectQuoteByTone(
  toneId: string,
  locale: 'ja' | 'en',
  sessionCount?: number,
  totalHours?: number
): Quote | null {
  // トーンIDから対応するプレフィックスを取得
  const prefixMapping: Record<string, string> = {
    'psychology': 'psych_',
    'behavioralEconomics': 'behav_',
    'ethology': 'etho_',
    'humanBehavior': 'human_',
    'neuroscience': 'neuro_',
    'philosophy': 'phil_'
  };
  
  const prefix = prefixMapping[toneId];
  if (!prefix) return null;
  
  // 対応するプレフィックスの名言をフィルタリング
  const toneCandidates = quotes.items.filter(q => q.id.startsWith(prefix));
  
  if (toneCandidates.length === 0) return null;
  
  // ランダムに1つ選択
  const randomIndex = Math.floor(Math.random() * toneCandidates.length);
  return toneCandidates[randomIndex];
}

/**
 * コンテキストに基づいて最適な名言を選択
 */
export interface QuoteSelectionContext {
  periodType: 'weekly' | 'monthly';
  locale: 'ja' | 'en';
  sessionCount?: number;
  totalHours?: number;
  mood?: 'positive' | 'neutral' | 'challenging';
  primaryTheme?: string; // 'continuity', 'growth', 'resilience', 'patience', etc.
}

/**
 * コンテキストに基づいて名言を選択
 */
export function selectQuoteForContext(context: QuoteSelectionContext): Quote | null {
  let candidates: Quote[] = [];
  
  // 1. 期間タイプに応じた学問領域の選択
  if (context.periodType === 'weekly') {
    // 週次: 心理学・行動経済学・人間行動学を優先
    const weeklyChapters = ['psych', 'behavEcon', 'humanBehav'];
    candidates = weeklyChapters.flatMap(chapter => getQuotesByChapter(chapter));
  } else {
    // 月次: 哲学・脳神経科学・心理学を優先
    const monthlyChapters = ['philosophy', 'neuro', 'psych'];
    candidates = monthlyChapters.flatMap(chapter => getQuotesByChapter(chapter));
  }
  
  // 2. テーマに基づいてさらにフィルタリング
  if (context.primaryTheme) {
    const themeRelated = getQuotesByTags([context.primaryTheme]);
    if (themeRelated.length > 0) {
      // テーマに関連する名言を優先（ただし候補の中から）
      candidates = candidates.filter(q => 
        themeRelated.some(tq => tq.id === q.id)
      );
      
      // 候補が少なすぎる場合は元に戻す
      if (candidates.length < 5) {
        candidates = context.periodType === 'weekly' 
          ? ['psych', 'behavEcon', 'humanBehav'].flatMap(c => getQuotesByChapter(c))
          : ['philosophy', 'neuro', 'psych'].flatMap(c => getQuotesByChapter(c));
      }
    }
  }
  
  // 3. 気分に基づいてトーンをフィルタリング
  if (context.mood) {
    let preferredTones: string[] = [];
    
    if (context.mood === 'positive') {
      preferredTones = ['stoic', 'zen', 'quiet_deep'];
    } else if (context.mood === 'challenging') {
      preferredTones = ['stoic', 'scientific'];
    } else {
      preferredTones = ['zen', 'quiet_deep', 'stoic'];
    }
    
    const toneFiltered = candidates.filter(q => preferredTones.includes(q.tone));
    if (toneFiltered.length > 0) {
      candidates = toneFiltered;
    }
  }
  
  // 4. ランダムに1つ選択
  return getRandomQuote(candidates);
}

/**
 * 名言をフォーマットして返す
 */
export function formatQuote(quote: Quote, locale: 'ja' | 'en' = 'ja'): string {
  const text = quote.text[locale];
  const author = quote.author;
  
  return `「${text}」\n― ${author}`;
}

/**
 * 名言をシンプルな形式で返す（著者名と出典を含む）
 */
export function formatQuoteSimple(quote: Quote, locale: 'ja' | 'en' = 'ja'): string {
  const text = quote.text[locale];
  const author = quote.author;
  const source = quote.source[locale];
  
  return `${text} ― ${author}（${source}）`;
}

/**
 * すべての名言を取得（デバッグ用）
 */
export function getAllQuotes(): Quote[] {
  return quotes.items;
}

/**
 * チャプター別の統計情報を取得
 */
export function getQuotesStats() {
  const stats: Record<string, number> = {};
  
  quotes.meta.chapters.forEach(chapter => {
    stats[chapter] = getQuotesByChapter(chapter).length;
  });
  
  return {
    total: quotes.items.length,
    byChapter: stats
  };
}

