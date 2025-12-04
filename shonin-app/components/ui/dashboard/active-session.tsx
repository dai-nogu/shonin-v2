"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Pause, Play, Square, MessageSquare, Camera, Save, RotateCcw, X } from "lucide-react"
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
import { useSessions } from "@/contexts/sessions-context"
import { useTimezone } from "@/contexts/timezone-context"
import { useAuth } from "@/contexts/auth-context"
import { uploadPhotos, type UploadedPhoto } from "@/lib/upload-photo"
import { getTimeStringInTimezone } from "@/lib/timezone-utils"
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

  // セッションコンテキストから一元化された時間データを取得
  const { formattedTime, elapsedTime } = useSessions()
  
  // タイムゾーンコンテキスト
  const { timezone } = useTimezone()

  // 振り返り関連の状態
  const [mood, setMood] = useState(3)
  const [achievements, setAchievements] = useState("")
  const [challenges, setChallenges] = useState("")
  const [notes, setNotes] = useState("")
  const [showNotes, setShowNotes] = useState(false)
  const [showPhotos, setShowPhotos] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [localReflectionError, setLocalReflectionError] = useState<string | null>(null)
  const [completedDurationMinutes, setCompletedDurationMinutes] = useState<number>(0)
  const achievementsRef = useRef<HTMLTextAreaElement>(null)
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
      const savedAchievements = localStorage.getItem(getStorageKey('achievements'))
      const savedChallenges = localStorage.getItem(getStorageKey('challenges'))

      if (savedNotes) setNotes(savedNotes)
      if (savedMood) setMood(parseInt(savedMood))
      if (savedAchievements) setAchievements(savedAchievements)
      if (savedChallenges) setChallenges(savedChallenges)
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(getStorageKey('achievements'), achievements)
    }
  }, [achievements, session.activityId, session.startTime])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(getStorageKey('challenges'), challenges)
    }
  }, [challenges, session.activityId, session.startTime])

  // ローカルストレージをクリアする関数
  const clearLocalStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(getStorageKey('notes'))
      localStorage.removeItem(getStorageKey('mood'))
      localStorage.removeItem(getStorageKey('achievements'))
      localStorage.removeItem(getStorageKey('challenges'))
    }
  }

  // セッションが終了状態になった時にメモ欄を自動表示
  useEffect(() => {
    if (sessionState === "ended") {
      setShowNotes(true)
    }
  }, [sessionState])

  // 終了画面に遷移した時にメモ入力欄にフォーカス
  useEffect(() => {
    if (sessionState === "ended" && showNotes && achievementsRef.current) {
      // 少し遅延させてフォーカス
      setTimeout(() => {
        achievementsRef.current?.focus()
      }, 100)
    }
  }, [sessionState, showNotes])

  const handleTogglePause = () => {
    onTogglePause()
  }

  const handleEnd = () => {
    // 終了時点の経過時間を分単位で保存
    setCompletedDurationMinutes(elapsedTime / 60)
    setShowNotes(true) // 終了時に自動でメモ欄を表示
    onEnd() // 外部の終了処理を呼び出し
  }

  const handleResume = () => {
    setShowNotes(false)
    setShowPhotos(false)
    // 完了時間をリセット（再開後に新しい時間で計算し直すため）
    setCompletedDurationMinutes(0)
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
        achievements,
        challenges,
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
          achievements: achievements.trim() || '特になし',
          challenges: challenges.trim() || '特になし',
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
      
    } catch (error) {
              setLocalReflectionError(t('active_session.save_error'))
    } finally {
      setIsSaving(false)
      saveInProgressRef.current = false // 保存処理完了フラグをリセット
    }
  }, [session, elapsedTime, notes, mood, achievements, challenges, photos, onSave, isSaving, saveReflection, isReflectionLoading, isUploading, setLocalReflectionError, clearLocalStorage])

  const getStatusInfo = () => {
    switch (sessionState) {
      case "active":
        return { color: "bg-green-500", text: t('active_session.recording') }
      case "paused":
        return { color: "bg-yellow-500", text: t('active_session.paused') }
      case "ended":
        return { color: "bg-blue-500", text: t('active_session.reflecting') }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* メインタイマーカード */}
      <Card className="backdrop-blur-xl bg-card/50 border-white/10 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div
              className={`w-3 h-3 ${statusInfo.color} rounded-full shadow-[0_0_10px_currentColor] ${sessionState === "active" ? "animate-pulse" : ""}`}
            />
            <span className={cn("font-medium tracking-wide", 
              sessionState === "active" ? "text-green-500" : 
              sessionState === "paused" ? "text-yellow-500" : "text-blue-500"
            )}>{statusInfo.text}</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-2">{session.activityName}</h2>
          {session.location && (
            <Badge variant="secondary" className="text-muted-foreground bg-secondary/50">
              📍 {session.location}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="text-center space-y-8">
          {/* 経過時間表示 */}
          <div className="space-y-2">
            <div
              className={cn("text-7xl md:text-8xl font-mono font-bold tracking-tighter tabular-nums transition-colors py-4", 
                sessionState === "ended" ? "text-blue-500" : "text-foreground"
              )}
            >
              {formattedTime}
            </div>
            <div className="text-muted-foreground text-sm font-medium">
              {t('active_session.start_time')}:{" "}
              {getTimeStringInTimezone(session.startTime, timezone, '24h').substring(0, 5)}
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
                        ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]"
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
                  <div className="text-sm text-green-500 font-medium animate-pulse flex items-center justify-center gap-1">
                     🎉 {t('active_session.goal_achieved')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 制御ボタン */}
          <div className="flex justify-center items-center gap-4 pt-4">
            {sessionState === "ended" ? (
              // 終了後のボタン
              <>
                <Button
                  onClick={handleResume}
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 text-base hover:bg-secondary/80 border-white/10"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  {t('active_session.resume')}
                </Button>
                <Button 
                  onClick={handleSave} 
                  size="lg" 
                  className="h-14 px-8 text-base bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-900/20 transition-all hover:-translate-y-0.5"
                  disabled={isSaving || isReflectionLoading || isUploading}
                >
                  <Save className="w-5 h-5 mr-2" />
                  {isUploading ? t('active_session.photo_uploading') : (isSaving || isReflectionLoading ? t('active_session.saving') : t('active_session.save'))}
                </Button>
              </>
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
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-yellow-500 text-sm font-medium" dangerouslySetInnerHTML={{ __html: t('active_session.paused_message') }} />
            </div>
          )}

          {sessionState === "ended" && completedDurationMinutes > 0 && (
            <div className="space-y-4 bg-secondary/30 rounded-xl p-6 backdrop-blur-sm border border-white/5">
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
                    return encouragementMessages('session_completion.range_46_60', { minutes })
                  } else if (completedDurationMinutes <= 90) {
                    return encouragementMessages('session_completion.range_61_90', { minutes })
                  } else if (completedDurationMinutes <= 120) {
                    return encouragementMessages('session_completion.range_91_120', { minutes })
                  } else if (completedDurationMinutes <= 180) {
                    return encouragementMessages('session_completion.range_121_180', { minutes })
                  } else if (completedDurationMinutes <= 360) {
                    return encouragementMessages('session_completion.range_180_360', { hours })
                  } else if (completedDurationMinutes <= 720) {
                    return encouragementMessages('session_completion.range_360_720', { hours })
                  } else {
                    return encouragementMessages('session_completion.range_720_1440', { hours })
                  }
                })()}
              </p>
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

      {/* アクション・メモカード（終了時のみ表示） */}
      {sessionState === "ended" && (
        <Card className="backdrop-blur-xl bg-card/50 border-white/10 shadow-xl animate-in slide-in-from-bottom-4 duration-500">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Button
                onClick={() => {
                  setShowNotes(!showNotes)
                  setShowPhotos(false) // 写真タブを閉じる
                }}
                variant={showNotes ? "default" : "outline"}
                className={cn("h-12 text-base transition-all",
                  showNotes
                    ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
                    : "hover:bg-secondary"
                )}
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                {t('active_session.memo_label')}
              </Button>

              <Button 
                onClick={() => {
                  setShowPhotos(!showPhotos)
                  setShowNotes(false) // メモタブを閉じる
                }}
                variant={showPhotos ? "default" : "outline"}
                className={cn("h-12 text-base transition-all",
                  showPhotos
                    ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
                    : "hover:bg-secondary"
                )}
              >
                <Camera className="w-5 h-5 mr-2" />
                {t('active_session.photos_label')}
                {(photos.length) > 0 && (
                  <span className="ml-2 bg-blue-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center shadow-sm">
                    {photos.length}
                  </span>
                )}
              </Button>
            </div>

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

            {/* 写真アップロードエリア */}
            {showPhotos && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="mb-4">
                  <Label className="text-base font-medium">{t('active_session.add_photos')}</Label>
                </div>

                {/* アップロードされた写真のプレビュー */}
                {(photos.length > 0) && (
                  <div className="grid grid-cols-2 gap-4">
                    {photos.map((photo, index) => (
                      <div key={`pending-${index}`} className="relative group rounded-xl overflow-hidden shadow-md">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`アップロード予定写真 ${index + 1}`}
                          className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Button
                          onClick={() => handlePhotoRemove(index)}
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <div className="absolute top-2 left-2 bg-yellow-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                          {t('active_session.waiting_save')}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <p className="text-white text-xs truncate px-1">
                            {photo.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {photos.length === 0 && (
                  <div className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors rounded-xl p-10 text-center bg-secondary/20">
                    <div className="bg-secondary/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Camera className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm mb-4">{t('active_session.upload_photos_description')}</p>
                    <Button
                      onClick={handlePhotoButtonClick}
                      variant="outline"
                      className="bg-background hover:bg-secondary"
                    >
                      {t('active_session.select_photos')}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* メモ・振り返り入力エリア */}
            {showNotes && !showPhotos && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* 気分評価 */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">{t('active_session.mood_question')}</Label>
                  <div className="flex justify-between sm:justify-start sm:gap-4">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        onClick={() => setMood(rating)}
                        variant={mood === rating ? "default" : "outline"}
                        className={cn(
                          "h-14 w-14 text-2xl p-0 flex items-center justify-center rounded-xl transition-all",
                          mood === rating
                            ? "bg-green-500 hover:bg-green-600 text-white scale-110 shadow-lg shadow-green-900/20 ring-2 ring-green-500 ring-offset-2 ring-offset-background"
                            : "hover:bg-secondary hover:scale-105"
                        )}
                      >
                        {rating === 1 && "😞"}
                        {rating === 2 && "😐"}
                        {rating === 3 && "🙂"}
                        {rating === 4 && "😊"}
                        {rating === 5 && "😄"}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 学びや成果（振り返り） */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{t('active_session.achievements_label')}</Label>
                    <CharacterCounter current={achievements.length} max={limits.sessionAchievements} />
                  </div>
                  <Textarea
                    ref={achievementsRef}
                    placeholder={t('active_session.achievements_placeholder')}
                    value={achievements}
                    onChange={(e) => setAchievements(e.target.value.slice(0, limits.sessionAchievements))}
                    maxLength={limits.sessionAchievements}
                    className="bg-secondary/20 border-white/10 min-h-[100px] focus-visible:ring-primary resize-none"
                  />
                </div>

                {/* 課題や改善点（明日の予定） */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{t('active_session.challenges_label')}</Label>
                    <CharacterCounter current={challenges.length} max={limits.sessionChallenges} />
                  </div>
                  <Textarea
                    placeholder={t('active_session.challenges_placeholder')}
                    value={challenges}
                    onChange={(e) => setChallenges(e.target.value.slice(0, limits.sessionChallenges))}
                    maxLength={limits.sessionChallenges}
                    className="bg-secondary/20 border-white/10 min-h-[100px] focus-visible:ring-primary resize-none"
                  />
                </div>

                {/* 自由記述メモ（その他） */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{t('active_session.notes_label')}</Label>
                    <CharacterCounter current={notes.length} max={limits.sessionNotes} />
                  </div>
                  <Textarea
                    placeholder={t('active_session.notes_placeholder')}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value.slice(0, limits.sessionNotes))}
                    maxLength={limits.sessionNotes}
                    className="bg-secondary/20 border-white/10 min-h-[100px] focus-visible:ring-primary resize-none"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
