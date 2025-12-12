"use client"

import { useState } from "react"
import { Label } from "@/components/ui/common/label"
import { Input } from "@/components/ui/common/input"
import { Button } from "@/components/ui/common/button"
import { useTranslations } from 'next-intl'
import { Plus, X } from "lucide-react"

// プリセットタグのキー（言語に依存しない）
const PRESET_TAG_KEYS = [
  "smartphone",
  "multitask",
  "excuses",
  "perfectionism",
  "comparison",
]

const MAX_TAGS = 10

interface GoalDontDoSelectorProps {
  selectedTags: string[]
  onChange: (tags: string[]) => void
}

export function GoalDontDoSelector({ 
  selectedTags, 
  onChange 
}: GoalDontDoSelectorProps) {
  const t = useTranslations()
  const [customInput, setCustomInput] = useState("")
  const [isComposing, setIsComposing] = useState(false) // IME変換中フラグ

  // プリセットタグの翻訳を取得
  const presetTags = PRESET_TAG_KEYS.map(key => ({
    key,
    name: t(`goals.preset_tags.${key}`)
  }))

  // selectedTagsからカスタムタグを計算（stateではなく直接計算）
  const customTags = selectedTags.filter(
    tag => !presetTags.some(preset => preset.name === tag)
  )

  // プリセットタグの選択/解除
  const handlePresetToggle = (tagName: string) => {
    const selectedPresetTags = selectedTags.filter(tag => 
      presetTags.some(preset => preset.name === tag)
    )
    
    if (selectedPresetTags.includes(tagName)) {
      // 選択解除
      const newPresetTags = selectedPresetTags.filter(tag => tag !== tagName)
      onChange([...newPresetTags, ...customTags])
    } else if ((selectedPresetTags.length + customTags.length) < MAX_TAGS) {
      // 選択追加
      onChange([...selectedPresetTags, tagName, ...customTags])
    }
  }

  // カスタムタグの追加
  const handleAddCustomTag = () => {
    const trimmed = customInput.trim()
    if (!trimmed) return
    
    // 重複チェック（重複の場合でも入力欄はクリア）
    if (selectedTags.includes(trimmed)) {
      setCustomInput("")
      return
    }
    
    if (totalCount >= MAX_TAGS) return
    
    // プリセットタグとカスタムタグを分けて管理
    const selectedPresetTags = selectedTags.filter(tag => 
      presetTags.some(preset => preset.name === tag)
    )
    const newCustomTags = [...customTags, trimmed]
    
    onChange([...selectedPresetTags, ...newCustomTags])
    setCustomInput("")
  }

  // カスタムタグの削除
  const handleRemoveCustomTag = (tagName: string) => {
    const newSelectedTags = selectedTags.filter(tag => tag !== tagName)
    onChange(newSelectedTags)
  }

  const totalCount = selectedTags.length
  const isMaxReached = totalCount >= MAX_TAGS

  return (
    <div className="space-y-4">
      <Label className="text-gray-300">{t('goals.dont_do_label')}</Label>
      
      {/* プリセットタグ */}
      <div className="flex flex-wrap gap-2">
        {presetTags.map((tag) => {
          const isSelected = selectedTags.includes(tag.name)
          return (
            <button
              key={tag.key}
              type="button"
              onClick={() => handlePresetToggle(tag.name)}
              disabled={!isSelected && isMaxReached}
              className={`group inline-flex items-center px-3 py-1.5 rounded-full text-sm transition-all duration-200 border ${
                isSelected
                  ? "bg-gray-900/40 border-emerald-700/50 shadow-[0_0_10px_rgba(4,120,87,0.1)]"
                  : isMaxReached
                  ? "bg-gray-900/20 border-gray-800 opacity-50 cursor-not-allowed"
                  : "bg-gray-900/40 border-gray-700 hover:border-gray-500"
              }`}
            >
              <span className={`text-xs font-medium ${
                isSelected ? "text-white" : "text-gray-300 group-hover:text-white"
              }`}>
                {tag.name}
              </span>
            </button>
          )
        })}
      </div>

      {/* カスタムタグ表示 */}
      {customTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customTags.map((tag) => (
            <div key={tag} className="relative inline-flex items-center">
              <div
                className="inline-flex items-center pl-3 pr-8 py-1.5 rounded-full text-sm transition-all duration-200 border bg-gray-900/40 border-emerald-700/50 shadow-[0_0_10px_rgba(4,120,87,0.1)]"
              >
                <span className="text-xs font-medium text-white">
                  {tag}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveCustomTag(tag)
                }}
                className="absolute right-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 自由記述欄 */}
      <div className="flex gap-2">
        <Input
          placeholder={t('goals.dont_do_custom_placeholder')}
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={(e) => {
            // IME変換中（日本語入力の確定時など）は無視
            if (isComposing) return
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAddCustomTag()
            }
          }}
          disabled={isMaxReached}
          maxLength={20}
          className="flex-1 bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 text-sm h-10 focus:border-emerald-700/50 focus:ring-emerald-700/20 disabled:opacity-50"
        />
        <Button
          type="button"
          onClick={handleAddCustomTag}
          disabled={!customInput.trim() || isMaxReached}
          size="icon"
          className="bg-gray-800 hover:bg-gray-700 border border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed h-10 w-10 flex-shrink-0 rounded-lg transition-all"
        >
          <Plus className="w-4 h-4 text-gray-300" />
        </Button>
      </div>
      
      {/* 選択数表示 */}
      <p className="text-xs text-gray-500">
        {t('goals.dont_do_count', { current: totalCount, max: MAX_TAGS })}
      </p>
    </div>
  )
}
