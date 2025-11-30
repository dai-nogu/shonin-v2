"use client"

import { cn } from "@/lib/utils"

interface CharacterCounterProps {
  /** 現在の文字数 */
  current: number;
  /** 最大文字数 */
  max: number;
  /** 追加のクラス名 */
  className?: string;
}

/**
 * 文字数制限警告
 * 
 * 上限に達した時のみ赤文字で警告を表示
 */
export function CharacterCounter({ current, max, className }: CharacterCounterProps) {
  const isAtLimit = current >= max;
  
  // 上限に達していない場合は何も表示しない
  if (!isAtLimit) return null;
  
  return (
    <span
      className={cn(
        "text-xs text-red-500 font-medium",
        className
      )}
    >
      これ以上入力できません
    </span>
  );
}

