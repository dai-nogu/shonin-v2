"use client"

import { useState, useEffect, useRef } from "react"
import { Pause, Play, Square, MessageSquare, Camera, Save, RotateCcw, X } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { SessionData } from "./time-tracker"
import { SessionReflection } from "@/types/database"
import { useReflectionsDb } from "@/hooks/use-reflections-db"
import { useSessions } from "@/contexts/sessions-context"
import { uploadPhotos, type UploadedPhoto } from "@/lib/upload-photo"

interface ActiveSessionProps {
  session: SessionData
  onEnd: () => void
  onSave: (sessionData: any) => Promise<string | null> | string | null
  sessionState: "active" | "paused" | "ended"
  onTogglePause: () => void
  onResume: () => void
}

export function ActiveSession({ session, onEnd, onSave, sessionState, onTogglePause, onResume }: ActiveSessionProps) {
  // 振り返りデータベースフック
  const { saveReflection, isLoading: isReflectionLoading, error: reflectionError } = useReflectionsDb()

  // セッションコンテキストから一元化された時間データを取得
  const { formattedTime, elapsedTime } = useSessions()

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
    setShowNotes(true) // 終了時に自動でメモ欄を表示
    onEnd() // 外部の終了処理を呼び出し
  }

  const handleResume = () => {
    setShowNotes(false)
    setShowPhotos(false)
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

  const handleSave = async () => {
    if (isSaving) return // 重複保存を防ぐ
    
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
      if (photos.length > 0 && savedSessionId) {
        try {
          setIsUploading(true)
          const uploadedPhotoResults = await uploadPhotos(photos, savedSessionId)
          // setSavedPhotos(uploadedPhotoResults) // この行は削除
          setPhotos([]) // アップロード完了後にクリア
        } catch (photoError) {
          console.error('写真アップロードエラー:', photoError)
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
          reflectionDuration: undefined, // 今回は振り返り時間は記録しない
        }
        
        const reflectionId = await saveReflection(savedSessionId, reflectionData)
        
        if (reflectionId) {
          // 振り返りが保存されたことを通知
          setTimeout(() => {
            onSave(sessionData)
          }, 1000)
        } else {
          // 振り返り保存に失敗した場合でもセッション保存は継続
          setLocalReflectionError('振り返りの保存に失敗しました。')
          setTimeout(() => {
            onSave(sessionData)
          }, 1000)
        }
      } else {
        // 振り返りデータがない場合は直接保存
        setTimeout(() => {
          onSave(sessionData)
        }, 1000)
      }
      
      // 保存が成功したらローカルストレージをクリア
      clearLocalStorage()
      
    } catch (error) {
      console.error('保存処理でエラーが発生:', error)
      setLocalReflectionError('保存処理でエラーが発生しました。')
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusInfo = () => {
    switch (sessionState) {
      case "active":
        return { color: "bg-green-500", text: "記録中", icon: "🟢" }
      case "paused":
        return { color: "bg-yellow-500", text: "一時停止中", icon: "⏸️" }
      case "ended":
        return { color: "bg-blue-500", text: "振り返り中", icon: "✏️" }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* メインタイマーカード */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <div
              className={`w-3 h-3 ${statusInfo.color} rounded-full ${sessionState === "active" ? "animate-pulse" : ""}`}
            />
            <span className="text-green-400 font-medium">{statusInfo.text}</span>
          </div>
          <h2 className="text-2xl font-bold text-white">{session.activityName}</h2>
          {session.location && <p className="text-gray-400 text-sm">📍 {session.location}</p>}
        </CardHeader>

        <CardContent className="text-center space-y-6">
          {/* 経過時間表示 */}
          <div className="space-y-2">
            <div
              className={`text-6xl font-mono font-bold ${sessionState === "ended" ? "text-blue-400" : "text-white"}`}
            >
              {formattedTime}
            </div>
            <div className="text-gray-400 text-sm">
              開始時刻:{" "}
              {session.startTime.toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            
            {/* 目標時間と進捗表示 */}
            {session.targetTime && (
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                  <span>目標: {Math.floor(session.targetTime / 60)}時間{session.targetTime % 60}分</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      elapsedTime >= session.targetTime * 60
                        ? "bg-green-500"
                        : elapsedTime >= session.targetTime * 60 * 0.8
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                    }`}
                    style={{
                      width: `${Math.min((elapsedTime / (session.targetTime * 60)) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="text-xs text-gray-400">
                  進捗: {Math.round((elapsedTime / (session.targetTime * 60)) * 100)}%
                  {elapsedTime >= session.targetTime * 60 && (
                    <span className="text-green-400 ml-2">🎉 目標達成！</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 制御ボタン */}
          <div className="flex justify-center space-x-4">
            {sessionState === "ended" ? (
              // 終了後のボタン
              <>
                <Button
                  onClick={handleResume}
                  variant="outline"
                  size="lg"
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  再開
                </Button>
                <Button 
                  onClick={handleSave} 
                  size="lg" 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={isSaving || isReflectionLoading || isUploading}
                >
                  <Save className="w-5 h-5 mr-2" />
                  {isUploading ? "写真アップロード中..." : (isSaving || isReflectionLoading ? "保存中..." : "保存")}
                </Button>
              </>
            ) : (
              // 通常の制御ボタン
              <>
                <Button
                  onClick={handleTogglePause}
                  variant="outline"
                  size="lg"
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  {sessionState === "paused" ? (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      再開
                    </>
                  ) : (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      一時停止
                    </>
                  )}
                </Button>

                <Button onClick={handleEnd} variant="destructive" size="lg" className="bg-red-600 hover:bg-red-700">
                  <Square className="w-5 h-5 mr-2" />
                  終了
                </Button>
              </>
            )}
          </div>

          {/* 状態別メッセージ */}
          {sessionState === "paused" && (
            <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 border-opacity-30 rounded-lg p-3">
              <p className="text-yellow-400 text-sm">⏸️ 一時停止中です。準備ができたら再開してください。</p>
            </div>
          )}

          {sessionState === "ended" && (
            <div className="bg-blue-500 bg-opacity-20 border border-blue-500 border-opacity-30 rounded-lg p-3">
              <p className="text-blue-400 text-sm">✏️ お疲れさまでした！振り返りを記録して保存しましょう。</p>
            </div>
          )}

          {/* エラー表示 */}
          {localReflectionError && (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 rounded-lg p-3">
              <p className="text-red-400 text-sm">⚠️ {localReflectionError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* アクション・メモカード（終了時のみ表示） */}
      {sessionState === "ended" && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Button
                onClick={() => {
                  setShowNotes(!showNotes)
                  setShowPhotos(false) // 写真タブを閉じる
                }}
                variant={showNotes ? "default" : "outline"}
                className={
                  showNotes
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                }
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                メモ
              </Button>

              <Button 
                onClick={() => {
                  setShowPhotos(!showPhotos)
                  setShowNotes(false) // メモタブを閉じる
                }}
                variant={showPhotos ? "default" : "outline"}
                className={
                  showPhotos
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                }
              >
                <Camera className="w-4 h-4 mr-2" />
                写真
                {(photos.length) > 0 && (
                  <span className="ml-1 bg-blue-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    {photos.length}
                  </span>
                )}
              </Button>
            </div>

            {/* 隠しファイル入力 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {/* 写真アップロードエリア */}
            {showPhotos && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300 text-sm font-medium">写真を追加</Label>
                  <Button
                    onClick={handlePhotoButtonClick}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={isUploading}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {isUploading ? "アップロード中..." : "写真を選択"}
                  </Button>
                </div>

                {/* アップロードされた写真のプレビュー */}
                {(photos.length > 0) && (
                  <div className="grid grid-cols-2 gap-3">
                    {/* 保存済みの写真 */}
                    {/* {savedPhotos.map((photo, index) => ( */}
                    {/*   <div key={`saved-${photo.id}`} className="relative group"> */}
                    {/*     <img */}
                    {/*       src={photo.url} */}
                    {/*       alt={`保存済み写真 ${index + 1}`} */}
                    {/*       className="w-full h-32 object-cover rounded-lg border border-green-500" */}
                    {/*     /> */}
                    {/*     <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded"> */}
                    {/*       ✓ 保存済み */}
                    {/*     </div> */}
                    {/*     <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded"> */}
                    {/*       {photo.fileName} */}
                    {/*     </div> */}
                    {/*   </div> */}
                    {/* ))} */}
                    {/* アップロード待ちの写真 */}
                    {photos.map((photo, index) => (
                      <div key={`pending-${index}`} className="relative group">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`アップロード予定写真 ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-600"
                        />
                        <Button
                          onClick={() => handlePhotoRemove(index)}
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                          保存待ち
                        </div>
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          {photo.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {photos.length === 0 && (
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                    <Camera className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm mb-2">写真をアップロードして記録を残しましょう</p>
                    <Button
                      onClick={handlePhotoButtonClick}
                      variant="outline"
                      size="sm"
                      className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      写真を選択
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* メモ・振り返り入力エリア */}
            {showNotes && !showPhotos && (
              <div className="space-y-4">
                {/* 気分評価 */}
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm font-medium">今の気分はどうですか？</Label>
                  <div className="flex justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        onClick={() => setMood(rating)}
                        variant={mood === rating ? "default" : "outline"}
                        size="sm"
                        className={
                          mood === rating
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                        }
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

                {/* 学びや成果 */}
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm font-medium">今日学んだことや成果</Label>
                  <Textarea
                    ref={achievementsRef}
                    placeholder="どんなことを学びましたか？どんな成果がありましたか？"
                    value={achievements}
                    onChange={(e) => setAchievements(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 min-h-[80px]"
                  />
                </div>

                {/* 課題や改善点 */}
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm font-medium">課題や次回への改善点</Label>
                  <Textarea
                    placeholder="どんな課題がありましたか？次回はどう改善しますか？"
                    value={challenges}
                    onChange={(e) => setChallenges(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 min-h-[80px]"
                  />
                </div>

                {/* 自由記述メモ */}
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm font-medium">その他のメモ</Label>
                  <Textarea
                    placeholder="その他、記録しておきたいことがあれば..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 min-h-[80px]"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 励ましメッセージ */}
      <Card className="bg-gradient-to-r from-green-500 to-blue-500 bg-opacity-20 border-green-500 border-opacity-30">
        <CardContent className="p-4 text-center">
          {sessionState === "active" && (
            <>
              <p className="text-green-400 font-medium">🌟 素晴らしい集中力です！</p>
              <p className="text-gray-300 text-sm mt-1">誰も見ていなくても、私たちはあなたの努力を見ています</p>
            </>
          )}
          {sessionState === "paused" && (
            <>
              <p className="text-yellow-400 font-medium">⏸️ 少し休憩しましょう</p>
              <p className="text-gray-300 text-sm mt-1">準備ができたら、また一緒に頑張りましょう</p>
            </>
          )}
          {sessionState === "ended" && (
            <>
              <p className="text-white font-medium">🎉 お疲れさまでした！</p>
              <p className="text-white text-sm mt-1">あなたの努力は確実に積み重なっています</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
