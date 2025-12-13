"use client"

import { lazy, Suspense } from "react"
import { Card, CardContent } from "@/components/ui/common/card"
import { SessionGoalSelector } from "./session-goal-selector"
import { SessionMoodSelector } from "./session-mood-selector"
import { SessionNotesInput } from "./session-notes-input"
import { Button } from "@/components/ui/common/button"
import { Save, ChevronRight } from "lucide-react"
import { useTranslations } from 'next-intl'
import type { RefObject } from "react"

// 写真アップロードを遅延読み込み
const SessionPhotoUpload = lazy(() => 
  import("./session-photo-upload").then(mod => ({ default: mod.SessionPhotoUpload }))
)

interface Goal {
  id: string
  title: string
  status?: string
}

interface SessionReflectionFormProps {
  // Goal selection
  activeGoals: Goal[]
  currentGoalId?: string | null
  selectedGoalId: string | null
  setSelectedGoalId: (goalId: string | null) => void
  
  // Mood
  mood: number
  setMood: (mood: number) => void
  
  // Notes
  notes: string
  setNotes: (notes: string) => void
  notesPlaceholder: string
  notesMaxLength: number
  notesRef?: RefObject<HTMLTextAreaElement>
  
  // Photos
  photos: File[]
  showPhotoAccordion: boolean
  setShowPhotoAccordion: (show: boolean) => void
  onPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onPhotoRemove: (index: number) => void
  onPhotoButtonClick: () => void
  fileInputRef: RefObject<HTMLInputElement>
  
  // Mobile flow
  isMobile: boolean
  currentStep?: number
  setCurrentStep?: (step: number) => void
  
  // Save
  onSave: () => void
  isSaving: boolean
  isUploading: boolean
}

export function SessionReflectionForm({
  activeGoals,
  currentGoalId,
  selectedGoalId,
  setSelectedGoalId,
  mood,
  setMood,
  notes,
  setNotes,
  notesPlaceholder,
  notesMaxLength,
  notesRef,
  photos,
  showPhotoAccordion,
  setShowPhotoAccordion,
  onPhotoUpload,
  onPhotoRemove,
  onPhotoButtonClick,
  fileInputRef,
  isMobile,
  currentStep = 2,
  setCurrentStep,
  onSave,
  isSaving,
  isUploading
}: SessionReflectionFormProps) {
  const t = useTranslations()

  // SP: 2ステップフロー
  if (isMobile && setCurrentStep) {
    return (
      <Card className="backdrop-blur-xl bg-card/50 border-white/10 shadow-xl rounded-lg">
        <CardContent className="p-6">
          {/* ステップ2: 気分評価 */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* 目標表示 */}
              {(currentGoalId || (activeGoals.length === 1 && selectedGoalId)) && (
                <div className="mb-6">
                  <SessionGoalSelector
                    goals={activeGoals}
                    selectedGoalId={selectedGoalId}
                    setSelectedGoalId={setSelectedGoalId}
                    currentGoalId={currentGoalId}
                  />
                </div>
              )}

              <SessionMoodSelector 
                mood={mood} 
                setMood={setMood} 
                isMobile={true} 
              />

              <Button
                onClick={() => setCurrentStep(3)}
                disabled={!mood}
                className="w-full h-12 text-base font-semibold bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50"
              >
                {t('active_session.next')}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* ステップ3: メモ入力 */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* 目標表示 */}
              {(currentGoalId || (activeGoals.length === 1 && selectedGoalId)) && (
                <SessionGoalSelector
                  goals={activeGoals}
                  selectedGoalId={selectedGoalId}
                  setSelectedGoalId={setSelectedGoalId}
                  currentGoalId={currentGoalId}
                />
              )}

              {/* メモ入力 */}
              <SessionNotesInput
                notes={notes}
                setNotes={setNotes}
                notesPlaceholder={notesPlaceholder}
                maxLength={notesMaxLength}
                notesRef={notesRef}
              />

              {/* 写真アップロード */}
              <Suspense fallback={<div className="h-12" />}>
                <SessionPhotoUpload
                  photos={photos}
                  showPhotoAccordion={showPhotoAccordion}
                  setShowPhotoAccordion={setShowPhotoAccordion}
                  onPhotoUpload={onPhotoUpload}
                  onPhotoRemove={onPhotoRemove}
                  onPhotoButtonClick={onPhotoButtonClick}
                  fileInputRef={fileInputRef}
                />
              </Suspense>

              {/* 保存ボタン */}
              <Button
                onClick={onSave}
                disabled={isSaving || isUploading}
                className="w-full h-14 text-base font-bold bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 shadow-lg"
              >
                {isSaving || isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    {isUploading ? t('active_session.uploading') : t('active_session.saving')}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    {t('active_session.save_button')}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // PC: 1画面完結型UI
  return (
    <Card className="backdrop-blur-xl bg-card/50 border-white/10 shadow-xl rounded-lg">
      <CardContent className="p-6">
        <div className="animate-in fade-in duration-300">
          {/* 1. 目標確認セクション */}
          <SessionGoalSelector
            goals={activeGoals}
            selectedGoalId={selectedGoalId}
            setSelectedGoalId={setSelectedGoalId}
            currentGoalId={currentGoalId}
          />

          {/* 2. 気分評価セクション */}
          <SessionMoodSelector 
            mood={mood} 
            setMood={setMood} 
            isMobile={false} 
          />

          {/* 3. メモ入力セクション */}
          <div className="pb-6">
            <SessionNotesInput
              notes={notes}
              setNotes={setNotes}
              notesPlaceholder={notesPlaceholder}
              maxLength={notesMaxLength}
              notesRef={notesRef}
            />
          </div>

          {/* 4. 写真アップロードセクション */}
          <div className="space-y-3">
            <Suspense fallback={<div className="h-12" />}>
              <SessionPhotoUpload
                photos={photos}
                showPhotoAccordion={showPhotoAccordion}
                setShowPhotoAccordion={setShowPhotoAccordion}
                onPhotoUpload={onPhotoUpload}
                onPhotoRemove={onPhotoRemove}
                onPhotoButtonClick={onPhotoButtonClick}
                fileInputRef={fileInputRef}
              />
            </Suspense>
          </div>

          {/* 5. 保存ボタン */}
          <div className="pt-2">
            <Button
              onClick={onSave}
              disabled={isSaving || isUploading}
              className="w-full h-14 text-base font-bold bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 shadow-lg"
            >
              {isSaving || isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  {isUploading ? t('active_session.uploading') : t('active_session.saving')}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {t('active_session.save_button')}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

