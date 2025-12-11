"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Pause, Play, Square, MessageSquare, Camera, Save, RotateCcw, X, CloudRain, Cloud, Minus, Sun, Sparkles, Plus, ChevronRight, Check } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { Badge } from "@/components/ui/common/badge"
import { Textarea } from "@/components/ui/common/textarea"
import { Label } from "@/components/ui/common/label"
import { CharacterCounter } from "@/components/ui/common/character-counter"
import { useTranslations, useLocale } from 'next-intl'
import type { SessionData } from "./time-tracker"
import { SessionReflection } from "@/types/database"
import { useReflectionsDb } from "@/hooks/use-reflections-db"
import { useGoalsDb } from "@/hooks/use-goals-db"
import { useSessions } from "@/contexts/sessions-context"
import { useAuth } from "@/contexts/auth-context"
import { uploadPhotos, type UploadedPhoto } from "@/lib/upload-photo"
import { getTimeString } from "@/lib/date-utils"
import { getInputLimits } from "@/lib/input-limits"
import { cn } from "@/lib/utils"

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
  const encouragementMessages = useTranslations('encouragement')
  // 認証フック
  const { user } = useAuth()
  
  // 振り返りデータベースフック
  const { saveReflection, isLoading: isReflectionLoading, error: reflectionError } = useReflectionsDb()
  
  // 目標データを取得
  const { goals } = useGoalsDb()
  const activeGoals = goals.filter(goal => goal.status === 'active')

  // セッションコンテキストから一元化された時間データを取得
  const { formattedTime, elapsedTime, sessions } = useSessions()
  
  // 振り返り関連の状態
  const [mood, setMood] = useState(3)
  const [notes, setNotes] = useState("")
  const [showNotes, setShowNotes] = useState(false)
  const [showPhotos, setShowPhotos] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [isSaving, setIsSaving] = useState(false)
  
  // 3ステップフロー管理（SPのみ）
  // 目標が1つの場合はステップ1（目標確認）をスキップしてステップ2から開始
  const [currentStep, setCurrentStep] = useState(1) // 1: 目標確認, 2: 気分評価, 3: メモ入力
  const [goalMatched, setGoalMatched] = useState<boolean | null>(null) // 目標と一致したか
  const [showPhotoAccordion, setShowPhotoAccordion] = useState(false) // 写真アコーディオンの開閉
  const [suggestedGoalId, setSuggestedGoalId] = useState<string | null>(null) // 提案された目標ID
  const [selectedGoalForSession, setSelectedGoalForSession] = useState<string | null>(null) // セッションに紐づける目標ID
  
  // 画面サイズ判定（SPかPCか）
  const [isMobile, setIsMobile] = useState(false)
  
  // プレースホルダー（開始時1回 + 終了時1回 = 最大2回）
  const [notesPlaceholder, setNotesPlaceholder] = useState(t('active_session.notes_placeholder'))
  const [isPreparingReflection, setIsPreparingReflection] = useState(false)
  const [hasGeneratedPlaceholder, setHasGeneratedPlaceholder] = useState(false) // 開始時
  const [hasGeneratedFinalPlaceholder, setHasGeneratedFinalPlaceholder] = useState(false) // 終了時
  
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
  
  // 目標が1つの場合、セッション終了時にステップ1をスキップしてステップ2から開始
  useEffect(() => {
    if (sessionState === "ended" && activeGoals.length === 1) {
      setCurrentStep(2)
    }
  }, [sessionState, activeGoals.length])
  
  // セッション開始時にプレースホルダーを事前生成（シンプル版）
  const startTimeMs = session.startTime.getTime()
  useEffect(() => {
    if (hasGeneratedPlaceholder || sessionState === 'ended') return
    
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/ai/generate-placeholder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activity_id: session.activityId,
            goal_id: session.goalId,
            is_pre_generation: true,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.activityId, startTimeMs])
  const [isUploading, setIsUploading] = useState(false)
  const [localReflectionError, setLocalReflectionError] = useState<string | null>(null)
  const [completedDurationMinutes, setCompletedDurationMinutes] = useState<number>(0)
  const notesRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
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
    }
  }, [session.activityId, session.startTime])

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
    // 初回マウント時はスキップ（復元用のuseEffectが先に実行されるため）
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
    // 初回マウント時はスキップ（復元用のuseEffectが先に実行されるため）
    if (isInitialMountForFlag.current) {
      isInitialMountForFlag.current = false
      return
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(getStorageKey('hasGeneratedPlaceholder'), hasGeneratedPlaceholder.toString())
    }
  }, [hasGeneratedPlaceholder, session.activityId, session.startTime])

  // ローカルストレージをクリアする関数
  const clearLocalStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(getStorageKey('notes'))
      localStorage.removeItem(getStorageKey('mood'))
      localStorage.removeItem(getStorageKey('placeholder'))
      localStorage.removeItem(getStorageKey('hasGeneratedPlaceholder'))
    }
  }

  // 終了画面に遷移した時にメモ入力欄にフォーカス
  useEffect(() => {
    if (sessionState === "ended" && !isPreparingReflection) {
      // PC版: showNotesがtrueの時
      // SP版: currentStep === 3の時
      const shouldFocus = (!isMobile && showNotes) || (isMobile && currentStep === 3)
      
      if (shouldFocus && notesRef.current) {
        // 少し遅延させてフォーカス
        setTimeout(() => {
          notesRef.current?.focus()
        }, 100)
      }
    }
  }, [sessionState, showNotes, currentStep, isMobile, isPreparingReflection])

  const handleTogglePause = () => {
    onTogglePause()
  }

  const handleEnd = async () => {
    // 終了時点の経過時間を分単位で保存
    setCompletedDurationMinutes(elapsedTime / 60)
    
    // 外部の終了処理を呼び出し
    onEnd()
    
    // 終了時のプレースホルダーを1回だけ生成（再開→再終了しても再生成しない）
    if (!hasGeneratedFinalPlaceholder) {
      setIsPreparingReflection(true)
      const startTime = Date.now()
      const minimumLoadingTime = 2500
      
      try {
        const res = await fetch('/api/ai/generate-placeholder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activity_id: session.activityId,
            goal_id: selectedGoalForSession || session.goalId,
            current_mood: mood,
            current_duration: elapsedTime,
            is_pre_generation: false,
            locale: locale
          }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.placeholder) setNotesPlaceholder(data.placeholder)
        }
      } catch (e) {
        console.error('Error generating final placeholder:', e)
      }
      
      setHasGeneratedFinalPlaceholder(true)
      
      // 最低ローディング時間を確保
      const elapsed = Date.now() - startTime
      if (elapsed < minimumLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minimumLoadingTime - elapsed))
      }
      
      setIsPreparingReflection(false)
    }
    
    setShowNotes(true)
  }

  const handleResume = () => {
    setShowNotes(false)
    setShowPhotos(false)
    setIsPreparingReflection(false)
    // 完了時間をリセット（再開後に新しい時間で計算し直すため）
    setCompletedDurationMinutes(0)
    // プレースホルダー生成フラグはリセットしない（同じセッションで再利用）
    // セッション状態をactiveに戻す
    onResume() // 終了状態からアクティブ状態に戻る
  }

  // 写真アップロード処理
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const newPhotos = Array.from(files)
      setPhotos(prev => [...prev, ...newPhotos])
    }
  }

  // 写真削除処理
  const handlePhotoRemove = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  // 写真選択ボタンクリック
  const handlePhotoButtonClick = () => {
    fileInputRef.current?.click()
  }

  // 保存処理の重複実行を防ぐフラグ
  const saveInProgressRef = useRef(false)

  const handleSave = useCallback(async () => {
    if (isSaving || saveInProgressRef.current) {
      return // 重複保存を防ぐ
    }
    
    // 保存処理開始フラグを設定
    saveInProgressRef.current = true
    setIsSaving(true)
    
    try {
      // まずセッションデータを保存
      const sessionData = {
        ...session,
        duration: elapsedTime,
        endTime: new Date(),
        notes,
        mood,
        // 目標IDを更新（ユーザーが選択した目標 or 元の目標）
        goalId: selectedGoalForSession || session.goalId,
      }

      // セッションデータを外部保存処理に渡し、セッションIDを取得
      const result = onSave(sessionData)
      const savedSessionId = result instanceof Promise ? await result : result
      
      // 写真をアップロード
      if (photos.length > 0 && savedSessionId && user?.id) {
        try {
          setIsUploading(true)
          const uploadedPhotoResults = await uploadPhotos(photos, savedSessionId, user.id)
          setPhotos([]) // アップロード完了後にクリア
        } catch (photoError) {
          // 写真アップロードに失敗してもセッション保存は継続
        } finally {
          setIsUploading(false)
        }
      }
       
      // セッションが正常に保存された場合のみ振り返りデータを保存
      if (savedSessionId) {
        const reflectionData: SessionReflection = {
          moodScore: mood,
          additionalNotes: notes.trim() || undefined,
        }
        
  
        
        const reflectionId = await saveReflection(savedSessionId, reflectionData)
        
        if (!reflectionId) {
          // 振り返り保存に失敗した場合でもセッション保存は継続
          setLocalReflectionError(t('active_session.reflection_save_error'))
        }
      }
      
      // 保存が成功したらローカルストレージをクリア
      clearLocalStorage()
      
      // プレースホルダー生成フラグもリセット（次のセッション用）
      setHasGeneratedPlaceholder(false)
      setNotesPlaceholder(t('active_session.notes_placeholder'))
      
    } catch (error) {
              setLocalReflectionError(t('active_session.save_error'))
    } finally {
      setIsSaving(false)
      saveInProgressRef.current = false // 保存処理完了フラグをリセット
    }
  }, [session, elapsedTime, notes, mood, photos, onSave, isSaving, saveReflection, isReflectionLoading, isUploading, setLocalReflectionError, clearLocalStorage, t])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* メインタイマーカード */}
      <Card className="backdrop-blur-xl bg-card/50 border-white/10 shadow-2xl rounded-lg">
        <CardHeader className="text-center pb-4">
          <h2 className="text-4xl font-bold tracking-tight">{session.activityName}</h2>
        </CardHeader>

        <CardContent className="text-center">
          {/* 経過時間表示 */}
          <>
            <div
              className="text-7xl md:text-8xl font-bold tracking-tighter tabular-nums transition-colors py-4 text-emerald-600"
            >
              {formattedTime}
            </div>
            <div className="text-muted-foreground text-sm font-medium">
              {t('active_session.start_time')}:{" "}
              {getTimeString(session.startTime, '24h').substring(0, 5)}
            </div>
            
            {/* 目標時間と進捗表示 */}
            {session.targetTime && (
              <div className="space-y-3 mt-8 max-w-md mx-auto">
                <div className="flex items-center justify-between text-sm text-muted-foreground font-medium">
                  <span>
                    {t('active_session.target')}: {Math.floor(session.targetTime / 60)}{t('time.hours_unit')}
                    {session.targetTime % 60 > 0 && `${session.targetTime % 60}${t('time.minutes_unit')}`}
                  </span>
                  <span>
                    {Math.round((elapsedTime / (session.targetTime * 60)) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-secondary/50 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500",
                      elapsedTime >= session.targetTime * 60
                        ? "bg-emerald-700 shadow-[0_0_15px_rgba(4,120,87,0.6)]"
                        : elapsedTime >= session.targetTime * 60 * 0.8
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                    )}
                    style={{
                      width: `${Math.min((elapsedTime / (session.targetTime * 60)) * 100, 100)}%`,
                    }}
                  />
                </div>
                {elapsedTime >= session.targetTime * 60 && (
                  <div className="text-sm text-emerald-500 font-medium animate-pulse flex items-center justify-center gap-1">
                     {t('active_session.goal_achieved')}
                  </div>
                )}
              </div>
            )}
          </>

          {/* 制御ボタン */}
          <div className="flex justify-center items-center gap-4 pt-4">
            {sessionState === "ended" ? (
              // 終了後のボタン
              <Button
                onClick={handleResume}
                variant="outline"
                size="lg"
                className="h-20 px-12 text-xl font-semibold hover:bg-secondary/80 border-white/10 rounded-full w-full max-w-md shadow-lg"
              >
                <RotateCcw className="w-7 h-7 mr-3" />
                {t('active_session.resume')}
              </Button>
            ) : (
              // 通常の制御ボタン
              <>
                <Button
                  onClick={handleTogglePause}
                  variant="outline"
                  size="lg"
                  className="h-16 px-8 rounded-full border-2 hover:bg-secondary/80 border-white/10 backdrop-blur-sm"
                >
                  {sessionState === "paused" ? (
                    <>
                      <Play className="w-6 h-6 mr-2 fill-current" />
                      {t('active_session.resume')}
                    </>
                  ) : (
                    <>
                      <Pause className="w-6 h-6 mr-2 fill-current" />
                      {t('active_session.pause')}
                    </>
                  )}
                </Button>

                <Button 
                  onClick={handleEnd} 
                  variant="destructive" 
                  size="lg" 
                  className="h-16 px-8 rounded-full shadow-lg hover:shadow-red-900/20 transition-all hover:-translate-y-0.5"
                >
                  <Square className="w-6 h-6 mr-2 fill-current" />
                  {t('active_session.end')}
                </Button>
              </>
            )}
          </div>

          {/* 状態別メッセージ */}
          {sessionState === "paused" && (
            <div className="text-center p-4">
              <p className="text-yellow-500 text-sm font-medium" dangerouslySetInnerHTML={{ __html: t('active_session.paused_message') }} />
            </div>
          )}

          {sessionState === "ended" && completedDurationMinutes > 0 && (
            <div className="space-y-2 mt-2">
              <p className="text-foreground font-medium" dangerouslySetInnerHTML={{ __html: t('active_session.completed_message') }} />
              
              <p className="text-muted-foreground text-sm leading-relaxed">
                {(() => {
                  const minutes = Math.floor(completedDurationMinutes)
                  const hours = Math.floor(completedDurationMinutes / 60)
                  
                  // 時間範囲に応じたメッセージを直接取得
                  if (completedDurationMinutes <= 5) {
                    return encouragementMessages('session_completion.range_0_5', { minutes })
                  } else if (completedDurationMinutes <= 15) {
                    return encouragementMessages('session_completion.range_6_15', { minutes })
                  } else if (completedDurationMinutes <= 30) {
                    return encouragementMessages('session_completion.range_16_30', { minutes })
                  } else if (completedDurationMinutes <= 45) {
                    return encouragementMessages('session_completion.range_31_45', { minutes })
                  } else if (completedDurationMinutes <= 60) {
                    return encouragementMessages('session_completion.range_46_60', { minutes, hours })
                  } else if (completedDurationMinutes <= 90) {
                    return encouragementMessages('session_completion.range_61_90', { minutes, hours })
                  } else if (completedDurationMinutes <= 120) {
                    return encouragementMessages('session_completion.range_91_120', { minutes, hours })
                  } else if (completedDurationMinutes <= 180) {
                    return encouragementMessages('session_completion.range_121_180', { minutes, hours })
                  } else if (completedDurationMinutes <= 360) {
                    return encouragementMessages('session_completion.range_180_360', { hours })
                  } else if (completedDurationMinutes <= 720) {
                    return encouragementMessages('session_completion.range_360_720', { hours })
                  } else {
                    return encouragementMessages('session_completion.range_720_1440', { hours })
                  }
                })()}
              </p>
              
              {/* プレースホルダー生成中のローディング表示 */}
              {isPreparingReflection && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-emerald-700/20 border-t-emerald-700 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-emerald-700 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm font-medium animate-pulse">
                    {t('active_session.preparing_reflection')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* エラー表示 */}
          {localReflectionError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
              <p className="text-destructive text-sm font-medium">⚠️ {localReflectionError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* アクション・メモカード（終了時かつローディング完了後に表示） */}
      {sessionState === "ended" && !isPreparingReflection && (
        <Card className="backdrop-blur-xl bg-card/50 border-white/10 shadow-xl rounded-lg">
          <CardContent className="p-6">
            {/* 隠しファイル入力 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,image/heic,image/heif"
              capture="environment"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {/* SP: 3ステップフロー */}
            {isMobile ? (
              <>
                {/* ステップ1: 目標確認 */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    {/* セッション開始時に目標が設定されていた場合 */}
                    {session.goalId ? (
                      <>
                        <div className="text-center space-y-4">
                          <h3 className="text-xl font-bold text-white">
                            {(() => {
                              const goal = activeGoals.find(g => g.id === session.goalId)
                              return goal ? `「${goal.title}」のための時間でしたか？` : t('active_session.goal_match_question')
                            })()}
                          </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <Button
                            onClick={() => {
                              setGoalMatched(true)
                              setSelectedGoalForSession(session.goalId!)
                              setCurrentStep(2)
                            }}
                            size="lg"
                            className="h-16 text-lg font-semibold bg-emerald-700 hover:bg-emerald-600 text-white shadow-lg"
                          >
                            <Check className="w-5 h-5 mr-2" />
                            はい
                          </Button>
                          <Button
                            onClick={() => {
                              setGoalMatched(false)
                              setSelectedGoalForSession(null)
                              setCurrentStep(2)
                            }}
                            size="lg"
                            variant="outline"
                            className="h-16 text-lg font-semibold border-2 hover:bg-secondary"
                          >
                            いいえ
                          </Button>
                        </div>
                      </>
                    ) : (
                      /* セッション開始時に目標が設定されていなかった場合 */
                      <>
                        {/* 目標が1つだけの場合：自動的に紐づけ */}
                        {suggestedGoalId && activeGoals.length === 1 ? (
                          <>
                            <div className="text-center space-y-4">
                              <h3 className="text-xl font-bold text-white">
                                「{activeGoals[0].title}」
                              </h3>
                            </div>

                            <div className="space-y-3">
                              <Button
                                onClick={() => {
                                  setGoalMatched(true)
                                  // selectedGoalForSessionは既にuseEffectで設定済み
                                  setCurrentStep(2)
                                }}
                                size="lg"
                                className="w-full h-16 text-lg font-semibold bg-emerald-700 hover:bg-emerald-600 text-white shadow-lg"
                              >
                                次へ
                                <ChevronRight className="w-5 h-5 ml-2" />
                              </Button>
                              <Button
                                onClick={() => {
                                  setGoalMatched(false)
                                  setSelectedGoalForSession(null) // 紐づけを解除
                                  setCurrentStep(2)
                                }}
                                size="sm"
                                variant="ghost"
                                className="w-full h-12 text-sm text-gray-400 hover:text-white hover:bg-secondary"
                              >
                                目標なしにする
                              </Button>
                            </div>
                          </>
                        ) : activeGoals.length > 1 ? (
                          /* 目標が複数ある場合：目標選択UI（AI判断は後で実装） */
                          <>
                            <div className="text-center space-y-4">
                              <h3 className="text-xl font-bold text-white">
                                どの目標のための時間でしたか？
                              </h3>
                              <p className="text-muted-foreground text-sm">
                                この活動を目標に紐づけますか？
                              </p>
                            </div>

                            <div className="space-y-3 max-w-md mx-auto">
                              {activeGoals.map((goal) => (
                                <Button
                                  key={goal.id}
                                  onClick={() => {
                                    setGoalMatched(true)
                                    setSelectedGoalForSession(goal.id)
                                    setCurrentStep(2)
                                  }}
                                  variant={selectedGoalForSession === goal.id ? "default" : "outline"}
                                  className={cn(
                                    "w-full h-16 justify-start gap-3 text-base transition-all",
                                    selectedGoalForSession === goal.id
                                      ? "bg-emerald-700 text-white border-2 border-emerald-500"
                                      : "hover:bg-secondary"
                                  )}
                                >
                                  <span className="font-semibold truncate">{goal.title}</span>
                                  {selectedGoalForSession === goal.id && (
                                    <Check className="w-5 h-5 ml-auto flex-shrink-0" />
                                  )}
                                </Button>
                              ))}
                              
                              <Button
                                onClick={() => {
                                  setGoalMatched(false)
                                  setSelectedGoalForSession(null)
                                  setCurrentStep(2)
                                }}
                                variant="outline"
                                className="w-full h-14 text-base border-2 hover:bg-secondary"
                              >
                                目標なし
                              </Button>
                            </div>
                          </>
                        ) : (
                          /* 目標がない場合 */
                          <>
                            <div className="text-center space-y-4">
                              <h3 className="text-xl font-bold text-white">
                                お疲れさまでした！
                              </h3>
                              <p className="text-muted-foreground text-sm">
                                目標を設定すると、より効果的に進捗を管理できます
                              </p>
                            </div>

                            <Button
                              onClick={() => {
                                setGoalMatched(false)
                                setSelectedGoalForSession(null)
                                setCurrentStep(2)
                              }}
                              size="lg"
                              className="w-full h-16 text-lg font-semibold bg-emerald-700 hover:bg-emerald-600 text-white shadow-lg"
                            >
                              次へ
                              <ChevronRight className="w-5 h-5 ml-2" />
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* ステップ2: 気分評価 */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    {/* 目標表示（目標が設定されている場合） */}
                    {(session.goalId || (activeGoals.length === 1 && selectedGoalForSession)) && (
                      <div className="bg-emerald-700/10 border border-emerald-700/30 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-700/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-white font-semibold">
                              {(() => {
                                const goalId = session.goalId || selectedGoalForSession
                                const goal = activeGoals.find(g => g.id === goalId)
                                return goal ? goal.title : t('active_session.no_goal')
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-bold text-white">
                        {t('active_session.mood_question')}
                      </h3>
                    </div>

                    <div className="space-y-3 max-w-md mx-auto">
                      {[
                        { value: 5, icon: Sparkles, label: '最高！', color: 'emerald' },
                        { value: 4, icon: Sun, label: '良い', color: 'emerald' },
                        { value: 3, icon: Minus, label: 'ふつう', color: 'gray' },
                        { value: 2, icon: Cloud, label: 'イマイチ', color: 'gray' },
                        { value: 1, icon: CloudRain, label: 'つらい', color: 'gray' },
                      ].map(({ value, icon: Icon, label, color }) => (
                        <Button
                          key={value}
                          onClick={() => setMood(value)}
                          variant={mood === value ? "default" : "outline"}
                          className={cn(
                            "w-full h-16 justify-start gap-4 text-base transition-all",
                            mood === value
                              ? "bg-emerald-700 text-white scale-105 shadow-lg border-2 border-emerald-500"
                              : "hover:bg-secondary hover:scale-[1.02]"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            mood === value ? "bg-white/20" : "bg-secondary"
                          )}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className="font-semibold">{label}</span>
                          {mood === value && (
                            <Check className="w-5 h-5 ml-auto" />
                          )}
                        </Button>
                      ))}
                    </div>

                    <Button
                      onClick={() => setCurrentStep(3)}
                      disabled={!mood}
                      className="w-full h-12 text-base font-semibold bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50"
                    >
                      次へ
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                )}

                {/* ステップ3: メモ入力 */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    {/* 目標表示（目標が設定されている場合） */}
                    {(session.goalId || (activeGoals.length === 1 && selectedGoalForSession)) && (
                      <div className="bg-emerald-700/10 border border-emerald-700/30 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-700/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-white font-semibold">
                              {(() => {
                                const goalId = session.goalId || selectedGoalForSession
                                const goal = activeGoals.find(g => g.id === goalId)
                                return goal ? goal.title : t('active_session.no_goal')
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* メモ入力 */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-end mb-2">
                        <CharacterCounter current={notes.length} max={limits.sessionNotes} />
                      </div>
                      <Textarea
                        ref={notesRef}
                        placeholder={notesPlaceholder}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value.slice(0, limits.sessionNotes))}
                        maxLength={limits.sessionNotes}
                        className="bg-secondary/20 border-white/10 min-h-[120px] focus-visible:ring-primary resize-none text-base"
                      />
                    </div>

                    {/* 写真アコーディオン */}
                    <div className="border-t border-white/5 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowPhotoAccordion(!showPhotoAccordion)}
                        className="flex items-center space-x-2 text-left group w-full"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                          <Plus className={`w-4 h-4 text-gray-400 group-hover:text-white transition-all duration-200 ${showPhotoAccordion ? 'rotate-45' : ''}`} />
                        </div>
                        <Label className="text-sm text-gray-400 cursor-pointer group-hover:text-gray-300 transition-colors">
                          {t('active_session.photos_label')} (オプション)
                        </Label>
                        {photos.length > 0 && (
                          <span className="ml-2 bg-emerald-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                            {photos.length}
                          </span>
                        )}
                      </button>

                      {/* 写真アップロードエリア */}
                      {showPhotoAccordion && (
                        <div className="mt-4 space-y-4 animate-in fade-in duration-300">
                          {/* アップロードされた写真のプレビュー */}
                          {photos.length > 0 && (
                            <div className="grid grid-cols-2 gap-3">
                              {photos.map((photo, index) => (
                                <div key={`pending-${index}`} className="relative group rounded-lg overflow-hidden shadow-md">
                                  <img
                                    src={URL.createObjectURL(photo)}
                                    alt={`写真 ${index + 1}`}
                                    className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                  <Button
                                    onClick={() => handlePhotoRemove(index)}
                                    size="icon"
                                    variant="destructive"
                                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-all"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          <Button
                            onClick={handlePhotoButtonClick}
                            variant="outline"
                            className="w-full h-12 border-dashed border-2 hover:bg-secondary"
                          >
                            <Camera className="w-5 h-5 mr-2" />
                            {photos.length > 0 ? '写真を追加' : '写真を選択'}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* 保存ボタン */}
                    <Button
                      onClick={handleSave}
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
              </>
            ) : (
              /* PC: 1画面完結型UI */
              <div className="animate-in fade-in duration-300">
                {/* 1. 目標確認セクション */}
                {session.goalId ? (
                  <div className="space-y-3 pb-6">
                    <div className="bg-emerald-700/10 border border-emerald-700/30 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-700/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">
                            {(() => {
                              const goal = activeGoals.find(g => g.id === session.goalId)
                              return goal ? goal.title : t('active_session.no_goal')
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activeGoals.length > 0 ? (
                  <div className="space-y-3 pb-6">
                    <Label className="text-base font-medium">{t('active_session.select_goal_optional')}</Label>
                    <div className="space-y-2">
                      {activeGoals.map((goal) => (
                        <Button
                          key={goal.id}
                          onClick={() => setSelectedGoalForSession(goal.id)}
                          variant={selectedGoalForSession === goal.id ? "default" : "outline"}
                          className={cn(
                            "w-full h-14 justify-start gap-3 text-base transition-all",
                            selectedGoalForSession === goal.id
                              ? "bg-emerald-700 text-white border-2 border-emerald-500"
                              : "hover:bg-secondary"
                          )}
                        >
                          <span className="font-semibold truncate flex-1 text-left">{goal.title}</span>
                          {selectedGoalForSession === goal.id && (
                            <Check className="w-5 h-5 ml-auto flex-shrink-0" />
                          )}
                        </Button>
                      ))}
                      <Button
                        onClick={() => setSelectedGoalForSession(null)}
                        variant={selectedGoalForSession === null ? "default" : "outline"}
                        className={cn(
                          "w-full h-12 text-sm",
                          selectedGoalForSession === null
                            ? "bg-gray-700 text-white"
                            : "hover:bg-secondary"
                        )}
                      >
                        {t('active_session.no_goal')}
                      </Button>
                    </div>
                  </div>
                ) : null}

                {/* 2. 気分評価セクション */}
                <div className="space-y-3 pb-6">
                  <Label className="text-base font-medium">{t('active_session.mood_question')}</Label>
                  <div className="flex justify-between sm:justify-start sm:gap-4">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        onClick={() => setMood(rating)}
                        variant={mood === rating ? "default" : "outline"}
                        className={cn(
                          "h-14 w-14 p-0 flex items-center justify-center rounded-xl transition-all",
                          mood === rating
                            ? "bg-emerald-700 text-white scale-110 shadow-lg shadow-emerald-900/20 ring-2 ring-emerald-700 ring-offset-2 ring-offset-background"
                            : "text-gray-400 hover:bg-secondary hover:scale-105"
                        )}
                      >
                        {rating === 1 && <CloudRain className="w-6 h-6" />}
                        {rating === 2 && <Cloud className="w-6 h-6" />}
                        {rating === 3 && <Minus className="w-6 h-6" />}
                        {rating === 4 && <Sun className="w-6 h-6" />}
                        {rating === 5 && <Sparkles className="w-6 h-6" />}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 3. メモ入力セクション */}
                <div className="space-y-3 pb-6">
                  <div className="flex items-center justify-between">
                    <CharacterCounter current={notes.length} max={limits.sessionNotes} />
                  </div>
                  <Textarea
                    ref={notesRef}
                    placeholder={notesPlaceholder}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value.slice(0, limits.sessionNotes))}
                    maxLength={limits.sessionNotes}
                    className="bg-secondary/20 border-white/10 min-h-[120px] focus-visible:ring-primary resize-none text-base"
                  />
                </div>

                {/* 4. 写真アップロードセクション（アコーディオン） */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowPhotoAccordion(!showPhotoAccordion)}
                    className="flex items-center space-x-2 text-left group w-full"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                      <Plus className={`w-4 h-4 text-gray-400 group-hover:text-white transition-all duration-200 ${showPhotoAccordion ? 'rotate-45' : ''}`} />
                    </div>
                    <Label className="text-sm text-gray-400 cursor-pointer group-hover:text-gray-300 transition-colors">
                      {t('active_session.photos_label')} (オプション)
                    </Label>
                    {photos.length > 0 && (
                      <span className="ml-2 bg-emerald-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                        {photos.length}
                      </span>
                    )}
                  </button>

                  {/* 写真アップロードエリア */}
                  {showPhotoAccordion && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      {/* アップロードされた写真のプレビュー */}
                      {photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-3">
                          {photos.map((photo, index) => (
                            <div key={`pending-${index}`} className="relative group rounded-lg overflow-hidden shadow-md">
                              <img
                                src={URL.createObjectURL(photo)}
                                alt={`写真 ${index + 1}`}
                                className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <Button
                                onClick={() => handlePhotoRemove(index)}
                                size="icon"
                                variant="destructive"
                                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <Button
                        onClick={handlePhotoButtonClick}
                        variant="outline"
                        className="w-full h-12 border-dashed border-2 hover:bg-secondary"
                      >
                        <Camera className="w-5 h-5 mr-2" />
                        {photos.length > 0 ? '写真を追加' : '写真を選択'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* 5. 保存ボタン */}
                <div className="pt-2">
                  <Button
                    onClick={handleSave}
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
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
