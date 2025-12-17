"use client"

import { useState, useEffect, useRef, useCallback, type RefObject } from "react"
import { useTranslations, useLocale } from 'next-intl'
import type { SessionData } from "./time-tracker"
import { SessionReflection } from "@/types/database"
import { useReflectionsDb } from "@/hooks/use-reflections-db"
import { useGoalsDb } from "@/hooks/use-goals-db"
import { useSessions } from "@/contexts/sessions-context"
import { useAuth } from "@/contexts/auth-context"
import { useSubscriptionContext } from "@/contexts/subscription-context"
import { getPlanLimits } from "@/types/subscription"
import { uploadPhotos } from "@/lib/upload-photo"
import { getInputLimits } from "@/lib/input-limits"

// 分割されたコンポーネント
import { SessionTimer } from "./session/session-timer"
import { SessionControls } from "./session/session-controls"
import { SessionCompletionMessage } from "./session/session-completion-message"
import { SessionReflectionForm } from "./session/session-reflection-form"

interface ActiveSessionProps {
  session: SessionData
  onEnd: () => void
  onSave: (sessionData: any) => Promise<string | null> | string | null
  sessionState: "active" | "paused" | "ended"
  onTogglePause: () => void
  onResume: () => void
}

export function ActiveSession({ 
  session, 
  onEnd, 
  onSave, 
  sessionState, 
  onTogglePause, 
  onResume 
}: ActiveSessionProps) {
  const t = useTranslations()
  const locale = useLocale()
  const limits = getInputLimits(locale)
  
  // 認証フック
  const { user } = useAuth()
  
  // サブスクリプション情報
  const { userPlan } = useSubscriptionContext()
  const planLimits = getPlanLimits(userPlan)
  
  // 振り返りデータベースフック
  const { saveReflection } = useReflectionsDb()
  
  // 目標データを取得
  const { goals } = useGoalsDb()
  const activeGoals = goals.filter(goal => goal.status === 'active')

  // セッションコンテキストから一元化された時間データを取得
  const { formattedTime, elapsedTime } = useSessions()
  
  // 振り返り関連の状態
  const [mood, setMood] = useState(3)
  const [notes, setNotes] = useState("")
  const [showNotes, setShowNotes] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [isSaving, setIsSaving] = useState(false)
  
  // 2ステップフロー管理（SPのみ）
  const [currentStep, setCurrentStep] = useState(2)
  const [showPhotoAccordion, setShowPhotoAccordion] = useState(false)
  const [suggestedGoalId, setSuggestedGoalId] = useState<string | null>(null)
  const [selectedGoalForSession, setSelectedGoalForSession] = useState<string | null>(null)
  
  // 画面サイズ判定
  const [isMobile, setIsMobile] = useState(false)
  
  // プレースホルダー
  const [notesPlaceholder, setNotesPlaceholder] = useState(t('active_session.notes_placeholder'))
  const [isPreparingReflection, setIsPreparingReflection] = useState(false)
  const [hasGeneratedPlaceholder, setHasGeneratedPlaceholder] = useState(false)
  
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [localReflectionError, setLocalReflectionError] = useState<string | null>(null)
  const [completedDurationMinutes, setCompletedDurationMinutes] = useState<number>(0)
  const notesRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 画面サイズ判定
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // セッション開始時に目標を自動設定
  useEffect(() => {
    if (session.goalId) {
      setSelectedGoalForSession(session.goalId)
      setSuggestedGoalId(session.goalId)
    } else if (activeGoals.length === 1) {
      setSuggestedGoalId(activeGoals[0].id)
      setSelectedGoalForSession(activeGoals[0].id)
    } else {
      setSuggestedGoalId(null)
      setSelectedGoalForSession(null)
    }
  }, [session.goalId, activeGoals.length])
  
  // ローカルストレージのキー生成
  const getStorageKey = (field: string) => {
    return `session_${session.activityId}_${session.startTime.getTime()}_${field}`
  }

  // ローカルストレージからデータを復元
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedNotes = localStorage.getItem(getStorageKey('notes'))
      const savedMood = localStorage.getItem(getStorageKey('mood'))
      const savedPlaceholder = localStorage.getItem(getStorageKey('placeholder'))
      const savedHasGenerated = localStorage.getItem(getStorageKey('hasGeneratedPlaceholder'))

      if (savedNotes) setNotes(savedNotes)
      if (savedMood) setMood(parseInt(savedMood))
      if (savedPlaceholder) setNotesPlaceholder(savedPlaceholder)
      if (savedHasGenerated === 'true') setHasGeneratedPlaceholder(true)
      
      setIsInitialLoadComplete(true)
    }
  }, [session.activityId, session.startTime])

  // セッション開始時にプレースホルダーを事前生成
  const startTimeMs = session.startTime.getTime()
  useEffect(() => {
    if (!isInitialLoadComplete) return
    if (hasGeneratedPlaceholder || sessionState === 'ended') return
    
    // freeプランの場合はAI生成をスキップ
    if (!planLimits.hasAIPlaceholder) {
      return
    }
    
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/ai/generate-placeholder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activity_id: session.activityId,
            goal_id: session.goalId,
            locale: locale
          }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.placeholder) {
            setNotesPlaceholder(data.placeholder)
            setHasGeneratedPlaceholder(true)
          }
        }
      } catch (e) {
        console.error('Error generating placeholder:', e)
      }
    }, 500)
    
    return () => clearTimeout(timer)
  }, [isInitialLoadComplete, hasGeneratedPlaceholder, sessionState, session.activityId, session.goalId, startTimeMs, locale, planLimits.hasAIPlaceholder])

  // メモ内容をローカルストレージに自動保存
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(getStorageKey('notes'), notes)
    }
  }, [notes, session.activityId, session.startTime])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(getStorageKey('mood'), mood.toString())
    }
  }, [mood, session.activityId, session.startTime])

  // プレースホルダーと生成フラグをローカルストレージに自動保存
  const isInitialMountForPlaceholder = useRef(true)
  useEffect(() => {
    if (isInitialMountForPlaceholder.current) {
      isInitialMountForPlaceholder.current = false
      return
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(getStorageKey('placeholder'), notesPlaceholder)
    }
  }, [notesPlaceholder, session.activityId, session.startTime])

  const isInitialMountForFlag = useRef(true)
  useEffect(() => {
    if (isInitialMountForFlag.current) {
      isInitialMountForFlag.current = false
      return
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(getStorageKey('hasGeneratedPlaceholder'), hasGeneratedPlaceholder.toString())
    }
  }, [hasGeneratedPlaceholder, session.activityId, session.startTime])

  // ローカルストレージをクリアする関数
  const clearLocalStorage = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(getStorageKey('notes'))
      localStorage.removeItem(getStorageKey('mood'))
      localStorage.removeItem(getStorageKey('placeholder'))
      localStorage.removeItem(getStorageKey('hasGeneratedPlaceholder'))
    }
  }, [session.activityId, session.startTime])

  // 終了画面に遷移した時にメモ入力欄にフォーカス
  useEffect(() => {
    if (sessionState === "ended" && !isPreparingReflection) {
      const shouldFocus = (!isMobile && showNotes) || (isMobile && currentStep === 3)
      
      if (shouldFocus && notesRef.current) {
        setTimeout(() => {
          notesRef.current?.focus()
        }, 100)
      }
    }
  }, [sessionState, showNotes, currentStep, isMobile, isPreparingReflection])

  const handleEnd = async () => {
    setCompletedDurationMinutes(elapsedTime / 60)
    onEnd()
    
    setIsPreparingReflection(true)
    const minimumLoadingTime = 2500
    
    await new Promise(resolve => setTimeout(resolve, minimumLoadingTime))
    
    setIsPreparingReflection(false)
    setShowNotes(true)
  }

  const handleResume = () => {
    setShowNotes(false)
    setIsPreparingReflection(false)
    setCompletedDurationMinutes(0)
    onResume()
  }

  // 写真アップロード処理
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const newPhotos = Array.from(files)
      setPhotos(prev => [...prev, ...newPhotos])
    }
  }

  const handlePhotoRemove = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const handlePhotoButtonClick = () => {
    fileInputRef.current?.click()
  }

  // 保存処理の重複実行を防ぐフラグ
  const saveInProgressRef = useRef(false)

  const handleSave = useCallback(async () => {
    if (isSaving || saveInProgressRef.current) {
      return
    }
    
    saveInProgressRef.current = true
    setIsSaving(true)
    
    try {
      const sessionData = {
        ...session,
        duration: elapsedTime,
        endTime: new Date(),
        notes,
        mood,
        goalId: selectedGoalForSession || session.goalId,
      }

      const result = onSave(sessionData)
      const savedSessionId = result instanceof Promise ? await result : result
      
      // 写真をアップロード
      if (photos.length > 0 && savedSessionId && user?.id) {
        try {
          setIsUploading(true)
          await uploadPhotos(photos, savedSessionId, user.id)
          setPhotos([])
        } catch (photoError) {
          // 写真アップロードに失敗してもセッション保存は継続
        } finally {
          setIsUploading(false)
        }
      }
       
      if (savedSessionId) {
        const reflectionData: SessionReflection = {
          moodScore: mood,
          additionalNotes: notes.trim() || undefined,
        }
        
        const reflectionId = await saveReflection(savedSessionId, reflectionData)
        
        if (!reflectionId) {
          setLocalReflectionError(t('active_session.reflection_save_error'))
        }
      }
      
      clearLocalStorage()
      setHasGeneratedPlaceholder(false)
      setNotesPlaceholder(t('active_session.notes_placeholder'))
      
    } catch (error) {
      setLocalReflectionError(t('active_session.save_error'))
    } finally {
      setIsSaving(false)
      saveInProgressRef.current = false
    }
  }, [session, elapsedTime, notes, mood, photos, selectedGoalForSession, user, onSave, saveReflection, clearLocalStorage, t])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* メインタイマーカード */}
      <div>
        <SessionTimer
          activityName={session.activityName}
          formattedTime={formattedTime}
          startTime={session.startTime}
          elapsedTime={elapsedTime}
          targetTime={session.targetTime}
          sessionState={sessionState}
        />
        
        <div className="mt-4">
          <SessionControls
            sessionState={sessionState}
            onTogglePause={onTogglePause}
            onEnd={handleEnd}
            onResume={handleResume}
          />
        </div>

        {/* 完了メッセージ */}
        {sessionState === "ended" && (
          <div className="mt-4">
            <SessionCompletionMessage
              completedDurationMinutes={completedDurationMinutes}
              isPreparingReflection={isPreparingReflection}
            />
          </div>
        )}

        {/* エラー表示 */}
        {localReflectionError && (
          <div className="mt-4 bg-destructive/10 border border-destructive/20 rounded-xl p-4">
            <p className="text-destructive text-sm font-medium">⚠️ {localReflectionError}</p>
          </div>
        )}
      </div>

      {/* アクション・メモカード（終了時かつローディング完了後に表示） */}
      {sessionState === "ended" && !isPreparingReflection && (
        <SessionReflectionForm
          activeGoals={activeGoals.map(goal => ({
            id: goal.id,
            title: goal.title,
            status: goal.status ?? undefined
          }))}
          currentGoalId={session.goalId}
          selectedGoalId={selectedGoalForSession}
          setSelectedGoalId={setSelectedGoalForSession}
          mood={mood}
          setMood={setMood}
          notes={notes}
          setNotes={setNotes}
          notesPlaceholder={notesPlaceholder}
          notesMaxLength={limits.sessionNotes}
          notesRef={notesRef as RefObject<HTMLTextAreaElement>}
          photos={photos}
          showPhotoAccordion={showPhotoAccordion}
          setShowPhotoAccordion={setShowPhotoAccordion}
          onPhotoUpload={handlePhotoUpload}
          onPhotoRemove={handlePhotoRemove}
          onPhotoButtonClick={handlePhotoButtonClick}
          fileInputRef={fileInputRef as RefObject<HTMLInputElement>}
          isMobile={isMobile}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          onSave={handleSave}
          isSaving={isSaving}
          isUploading={isUploading}
        />
      )}
    </div>
  )
}
