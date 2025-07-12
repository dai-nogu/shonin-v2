"use client"

import { useEffect, useState } from "react"
import { X, Clock, Calendar, MapPin, Star, TrendingUp, MessageSquare, Target, Camera, Image } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { getSessionPhotos, type UploadedPhoto, getSessionPhotosWithPreload } from "@/lib/upload-photo"
import { useGoalsDb } from "@/hooks/use-goals-db"
import type { CompletedSession } from "./time-tracker"

interface SessionDetailModalProps {
  isOpen: boolean
  session: CompletedSession | null
  onClose: () => void
  onStartSimilar?: (sessionData: any) => void
}

// 写真なしモーダル
function SessionDetailModalWithoutPhotos({ isOpen, session, onClose, onStartSimilar }: SessionDetailModalProps) {
  // 目標管理フック
  const { getGoal } = useGoalsDb()
  
  // 目標情報を取得
  const goalInfo = session?.goalId ? getGoal(session.goalId) : null

  // モーダルが開いている間は背景スクロールを無効にする
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !session) return null

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}時間${minutes}分`
    }
    return `${minutes}分`
  }

  const formatDateTime = (date: Date) => {
    const dateStr = date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric"
    })
    const weekday = date.toLocaleDateString("ja-JP", {
      weekday: "long"
    })
    return `${dateStr} (${weekday})`
  }

  const getMoodEmoji = (mood: number) => {
    const emojis = ["😫", "😔", "😐", "😊", "😄"]
    return emojis[mood - 1] || "😐"
  }

  const getMoodText = (mood: number) => {
    const texts = ["とても悪い", "悪い", "普通", "良い", "とても良い"]
    return texts[mood - 1] || "普通"
  }

  const handleStartSimilar = () => {
    if (onStartSimilar) {
      onStartSimilar({
        activityId: session.activityId,
        activityName: session.activityName,
        location: session.location,
        targetTime: session.targetTime,
        goalId: session.goalId
      })
    }
  }

  // アクティビティ情報を取得
  const activityInfo = {
    icon: session.activityIcon || "📚",
    color: session.activityColor || "bg-blue-500"
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <Card 
        className="bg-gray-900 border-gray-800 max-w-2xl w-full mx-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="relative">
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
          
          {/* アクティビティヘッダー */}
          <div className={`p-4 rounded-lg ${activityInfo.color} bg-opacity-20 border border-opacity-30 mb-4`}>
            <div className="flex items-center space-x-3">
              <div className={`w-16 h-16 ${activityInfo.color} rounded-full flex items-center justify-center text-3xl`}>
                {activityInfo.icon}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{session.activityName}</h2>
                <div className="flex items-center text-green-400 mt-1">
                  <Clock className="w-4 h-4 mr-1" />
                  <span className="font-mono text-lg">{formatDuration(session.duration)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300 font-medium">実施日時</span>
                </div>
                <div className="text-white">
                  <div>{formatDateTime(session.startTime)}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {session.startTime.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} ～ {session.endTime.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {session.location && (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 font-medium">場所</span>
                  </div>
                  <div className="text-white">{session.location}</div>
                </CardContent>
              </Card>
            )}
            
            {/* 目標情報 */}
            {goalInfo && (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300 font-medium">関連する目標</span>
                  </div>
                  <div className="text-white">{goalInfo.title}</div>
                  {goalInfo.description && (
                    <div className="text-gray-400 text-sm mt-1">{goalInfo.description}</div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* 目標時間と達成度 */}
          {session.targetTime && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300 font-medium">目標達成度</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">目標時間</span>
                    <span className="text-white">{formatDuration(session.targetTime * 60)}</span>
                  </div>
                  <Progress 
                    value={Math.min((session.duration / (session.targetTime * 60)) * 100, 100)} 
                    className="h-2" 
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">達成率</span>
                    <span className={`font-medium ${
                      session.duration >= session.targetTime * 60 ? "text-green-400" : "text-yellow-400"
                    }`}>
                      {Math.round((session.duration / (session.targetTime * 60)) * 100)}%
                      {session.duration >= session.targetTime * 60 && " 🎉"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 気分評価 */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-300 font-medium">気分</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{getMoodEmoji(session.mood || 3)}</div>
                <div>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= (session.mood || 3) ? "text-yellow-400 fill-yellow-400" : "text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-white mt-1">{getMoodText(session.mood || 3)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 学びや成果 */}
          {session.achievements && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300 font-medium">学びや成果</span>
                </div>
                <div className="text-white whitespace-pre-wrap">{session.achievements}</div>
              </CardContent>
            </Card>
          )}

          {/* 課題や改善点 */}
          {session.challenges && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-orange-400" />
                  <span className="text-gray-300 font-medium">課題や改善点</span>
                </div>
                <div className="text-white whitespace-pre-wrap">{session.challenges}</div>
              </CardContent>
            </Card>
          )}

          {/* その他のメモ */}
          {session.notes && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300 font-medium">その他のメモ</span>
                </div>
                <div className="text-white whitespace-pre-wrap">{session.notes}</div>
              </CardContent>
            </Card>
          )}

          {/* アクションボタン */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
            >
              閉じる
            </Button>
            {onStartSimilar && (
              <Button
                onClick={handleStartSimilar}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                同じ設定で開始
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 写真ありモーダル
function SessionDetailModalWithPhotos({ isOpen, session, onClose, onStartSimilar }: SessionDetailModalProps) {
  const [sessionPhotos, setSessionPhotos] = useState<UploadedPhoto[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [imageLoadStates, setImageLoadStates] = useState<Record<string, boolean>>({})
  const [preloadCompleted, setPreloadCompleted] = useState(false)
  
  // 目標管理フック
  const { getGoal } = useGoalsDb()
  
  // 目標情報を取得
  const goalInfo = session?.goalId ? getGoal(session.goalId) : null

  // モーダルが開いている間は背景スクロールを無効にする
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // セッションの写真を取得してプリロード
  useEffect(() => {
    const fetchSessionPhotosWithPreload = async () => {
      if (!session?.id) return

      setLoadingPhotos(true)
      setPreloadCompleted(false)
      
      try {
        const { photos, preloadPromise, preloadedStates } = await getSessionPhotosWithPreload(session.id)
        
        // まず写真データをセット（レイアウトを確定）
        setSessionPhotos(photos)
        
        // プリロード済み状態を初期値として設定
        const initialLoadStates = photos.reduce((acc, photo) => {
          acc[photo.id] = preloadedStates[photo.url] || false
          return acc
        }, {} as Record<string, boolean>)
        setImageLoadStates(initialLoadStates)
        
        // 写真データセット後、少し待ってからローディング状態を解除
        // これによりレイアウトが確定してからプリロードが開始される
        setTimeout(() => {
          setLoadingPhotos(false)
        }, 50) // 短縮してより高速に
        
        // プリロード完了を待つ
        await preloadPromise
        
        // プリロード完了後、全ての画像を表示状態に
        const allPreloadedStates = photos.reduce((acc, photo) => {
          acc[photo.id] = true
          return acc
        }, {} as Record<string, boolean>)
        setImageLoadStates(allPreloadedStates)
        setPreloadCompleted(true)
        
      } catch (error) {
        console.error('写真の取得またはプリロードに失敗:', error)
        setSessionPhotos([])
        setPreloadCompleted(true)
        setLoadingPhotos(false)
      }
    }

    // モーダルが開いている場合のみ写真を取得
    if (isOpen && session) {
      fetchSessionPhotosWithPreload()
    } else {
      // モーダルが閉じたら写真データをクリア
      setSessionPhotos([])
      setLoadingPhotos(false)
      setImageLoadStates({})
      setPreloadCompleted(false)
    }
  }, [isOpen, session])

  // 画像読み込み完了ハンドラー（プリロード使用時は基本的に不要だが、フォールバック用）
  const handleImageLoad = (photoId: string) => {
    if (!preloadCompleted) {
      setImageLoadStates(prev => ({
        ...prev,
        [photoId]: true
      }))
    }
  }

  if (!isOpen || !session) return null

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}時間${minutes}分`
    }
    return `${minutes}分`
  }

  const formatDateTime = (date: Date) => {
    const dateStr = date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric"
    })
    const weekday = date.toLocaleDateString("ja-JP", {
      weekday: "long"
    })
    return `${dateStr} (${weekday})`
  }

  const getMoodEmoji = (mood: number) => {
    const emojis = ["😫", "😔", "😐", "😊", "😄"]
    return emojis[mood - 1] || "😐"
  }

  const getMoodText = (mood: number) => {
    const texts = ["とても悪い", "悪い", "普通", "良い", "とても良い"]
    return texts[mood - 1] || "普通"
  }

  const handleStartSimilar = () => {
    if (onStartSimilar) {
      onStartSimilar({
        activityId: session.activityId,
        activityName: session.activityName,
        location: session.location,
        targetTime: session.targetTime,
        goalId: session.goalId
      })
    }
  }

  // アクティビティ情報を取得
  const activityInfo = {
    icon: session.activityIcon || "📚",
    color: session.activityColor || "bg-blue-500"
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <Card 
        className="bg-gray-900 border-gray-800 max-w-2xl w-full mx-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="relative">
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
          
          {/* アクティビティヘッダー */}
          <div className={`p-4 rounded-lg ${activityInfo.color} bg-opacity-20 border border-opacity-30 mb-4`}>
            <div className="flex items-center space-x-3">
              <div className={`w-16 h-16 ${activityInfo.color} rounded-full flex items-center justify-center text-3xl`}>
                {activityInfo.icon}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{session.activityName}</h2>
                <div className="flex items-center text-green-400 mt-1">
                  <Clock className="w-4 h-4 mr-1" />
                  <span className="font-mono text-lg">{formatDuration(session.duration)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300 font-medium">実施日時</span>
                </div>
                <div className="text-white">
                  <div>{formatDateTime(session.startTime)}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {session.startTime.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} ～ {session.endTime.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {session.location && (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 font-medium">場所</span>
                  </div>
                  <div className="text-white">{session.location}</div>
                </CardContent>
              </Card>
            )}
            
            {/* 目標情報 */}
            {goalInfo && (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300 font-medium">関連する目標</span>
                  </div>
                  <div className="text-white">{goalInfo.title}</div>
                  {goalInfo.description && (
                    <div className="text-gray-400 text-sm mt-1">{goalInfo.description}</div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* 目標時間と達成度 */}
          {session.targetTime && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300 font-medium">目標達成度</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">目標時間</span>
                    <span className="text-white">{formatDuration(session.targetTime * 60)}</span>
                  </div>
                  <Progress 
                    value={Math.min((session.duration / (session.targetTime * 60)) * 100, 100)} 
                    className="h-2" 
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">達成率</span>
                    <span className={`font-medium ${
                      session.duration >= session.targetTime * 60 ? "text-green-400" : "text-yellow-400"
                    }`}>
                      {Math.round((session.duration / (session.targetTime * 60)) * 100)}%
                      {session.duration >= session.targetTime * 60 && " 🎉"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 気分評価 */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-300 font-medium">気分</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{getMoodEmoji(session.mood || 3)}</div>
                <div>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= (session.mood || 3) ? "text-yellow-400 fill-yellow-400" : "text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-white mt-1">{getMoodText(session.mood || 3)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 学びや成果 */}
          {session.achievements && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300 font-medium">学びや成果</span>
                </div>
                <div className="text-white whitespace-pre-wrap">{session.achievements}</div>
              </CardContent>
            </Card>
          )}

          {/* 課題や改善点 */}
          {session.challenges && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-orange-400" />
                  <span className="text-gray-300 font-medium">課題や改善点</span>
                </div>
                <div className="text-white whitespace-pre-wrap">{session.challenges}</div>
              </CardContent>
            </Card>
          )}

          {/* その他のメモ */}
          {session.notes && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300 font-medium">その他のメモ</span>
                </div>
                <div className="text-white whitespace-pre-wrap">{session.notes}</div>
              </CardContent>
            </Card>
          )}

          {/* 写真セクション */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Camera className="w-4 h-4 text-purple-400" />
                <span className="text-gray-300 font-medium">写真</span>
                {sessionPhotos.length > 0 && (
                  <span className="text-gray-400 text-sm">({sessionPhotos.length}枚)</span>
                )}
                {loadingPhotos && (
                  <span className="text-blue-400 text-sm">読み込み中...</span>
                )}
              </div>
              
              {/* 写真表示エリア - 常に固定高さを維持 */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {loadingPhotos ? (
                  // 読み込み中: 実際の写真枚数に応じたスケルトンを表示
                  [...Array(Math.max(sessionPhotos.length, 3))].map((_, index) => (
                    <div 
                      key={`skeleton-${index}`}
                      className="w-full h-32 bg-gray-700 rounded-lg animate-pulse border border-gray-600"
                    />
                  ))
                ) : (
                  // 写真表示: 各写真を固定高さコンテナで表示
                  sessionPhotos.map((photo, index) => (
                    <div key={photo.id} className="relative group">
                      {/* 画像コンテナ - 固定高さとアスペクト比を維持 */}
                      <div className="relative w-full h-32 bg-gray-700 rounded-lg overflow-hidden border border-gray-600 hover:border-purple-400 transition-colors">
                        {/* プリロード完了前のスケルトン表示 */}
                        {!imageLoadStates[photo.id] && (
                          <div className="absolute inset-0 bg-gray-700 animate-pulse flex items-center justify-center">
                            <div className="text-gray-500 text-xs">読み込み中</div>
                          </div>
                        )}
                        
                        {/* 実際の画像 */}
                        <img
                          src={photo.url}
                          alt={`セッション写真 ${index + 1}`}
                          className={`w-full h-full object-cover cursor-pointer transition-opacity duration-300 ${
                            imageLoadStates[photo.id] ? 'opacity-100' : 'opacity-0'
                          }`}
                          onLoad={() => handleImageLoad(photo.id)}
                          onClick={() => window.open(photo.url, '_blank')}
                        />
                        
                        {/* オーバーレイ要素 */}
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          {photo.fileName}
                        </div>
                        <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          <Image className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* アクションボタン */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
            >
              閉じる
            </Button>
            {onStartSimilar && (
              <Button
                onClick={handleStartSimilar}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                同じ設定で開始
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// メインのセッション詳細モーダル（写真の有無で出し分け）
export function SessionDetailModal({ isOpen, session, onClose, onStartSimilar }: SessionDetailModalProps) {
  // 写真の有無で適切なモーダルを表示
  if (session?.hasPhotos) {
    return (
      <SessionDetailModalWithPhotos
        isOpen={isOpen}
        session={session}
        onClose={onClose}
        onStartSimilar={onStartSimilar}
      />
    )
  } else {
    return (
      <SessionDetailModalWithoutPhotos
        isOpen={isOpen}
        session={session}
        onClose={onClose}
        onStartSimilar={onStartSimilar}
      />
    )
  }
} 