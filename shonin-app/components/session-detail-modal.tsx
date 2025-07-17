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
  const [isMobile, setIsMobile] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  
  // メモがあるかどうかをチェック
  const hasContent = !!(session?.achievements || session?.challenges || session?.notes || session?.targetTime)
  const totalPages = hasContent ? 2 : 1 // メモがある場合は2ページ、ない場合は1ページ
  
  // 目標管理フック
  const { getGoal } = useGoalsDb()
  
  // 目標情報を取得
  const goalInfo = session?.goalId ? getGoal(session.goalId) : null

  // モバイル判定
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // モーダルが開いている間は背景スクロールを無効にする
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setCurrentPage(1) // モーダルが開いたら1ページ目に戻す
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

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // アクティビティ情報を取得
  const activityInfo = {
    icon: session.activityIcon || "📚",
    color: session.activityColor || "bg-blue-500"
  }

  // 1ページ目のコンテンツ
  const renderPage1 = () => (
    <div className="space-y-4">
      {/* 基本情報 */}
      <div className="grid grid-cols-1 gap-5">
        {/* 実施日時と場所を横並び */}
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300 font-medium text-sm">実施日時</span>
              </div>
              <div className="text-white">
                <div className="text-sm">{formatDateTime(session.startTime)}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {session.startTime.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} ～ {session.endTime.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-green-400" />
                <span className="text-gray-300 font-medium text-sm">場所</span>
              </div>
              <div className="text-white text-sm">{session.location || '未設定'}</div>
            </CardContent>
          </Card>
        </div>

        {/* 関連する目標と気分を横並び */}
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300 font-medium text-sm">関連する目標</span>
              </div>
              {goalInfo ? (
                <>
                  <div className="text-white text-sm">{goalInfo.title}</div>
                  {goalInfo.description && (
                    <div className="text-gray-400 text-xs mt-1">{goalInfo.description}</div>
                  )}
                </>
              ) : (
                <div className="text-gray-400 text-sm">未設定</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-300 font-medium text-sm">気分</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-xl">{getMoodEmoji(session.mood || 3)}</div>
                <div>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= (session.mood || 3) ? "text-yellow-400 fill-yellow-400" : "text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-white text-sm mt-1">{getMoodText(session.mood || 3)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SPでのページインジケーター（関連する目標と気分の下に配置） */}
        {isMobile && totalPages > 1 && (
          <div className="flex justify-center space-x-2 mt-6">
            {Array.from({ length: totalPages }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i + 1 === currentPage ? 'bg-green-400' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        )}

        {/* SPでのスタートボタン（アクティビティ名と同じ幅で配置） */}
        {isMobile && (
          <Button
            onClick={handleStartSimilar}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            同じ設定で開始
          </Button>
        )}
      </div>
    </div>
  )

  // 2ページ目のコンテンツ
  const renderPage2 = () => (
    <div className="space-y-3">
      {/* 学びや成果 */}
      {session.achievements && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-gray-300 font-medium text-sm">今日学んだことや成果</span>
            </div>
            <div className="text-white text-sm whitespace-pre-wrap">{session.achievements}</div>
          </CardContent>
        </Card>
      )}

      {/* 課題や改善点 */}
      {session.challenges && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="w-4 h-4 text-orange-400" />
              <span className="text-gray-300 font-medium text-sm">課題や次回への改善点</span>
            </div>
            <div className="text-white text-sm whitespace-pre-wrap">{session.challenges}</div>
          </CardContent>
        </Card>
      )}

      {/* その他のメモ */}
      {session.notes && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300 font-medium text-sm">その他のメモ</span>
            </div>
            <div className="text-white text-sm whitespace-pre-wrap">{session.notes}</div>
          </CardContent>
        </Card>
      )}

      {/* 目標時間と達成度 */}
      {session.targetTime && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-gray-300 font-medium text-sm">目標達成度</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">目標時間</span>
                <span className="text-white">{formatDuration(session.targetTime * 60)}</span>
              </div>
              <Progress 
                value={Math.min((session.duration / (session.targetTime * 60)) * 100, 100)} 
                className="h-2" 
              />
              <div className="flex justify-between text-xs">
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

      {/* メモがない場合の表示 */}
      {!session.achievements && !session.challenges && !session.notes && !session.targetTime && (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">記録されたメモはありません</p>
        </div>
      )}

      {/* SPでのページインジケーター（スクロール領域の最後に配置） */}
      {isMobile && totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-6 pt-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i + 1 === currentPage ? 'bg-green-400' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      )}

      {/* SPでのスタートボタン（スクロール領域の最後に配置） */}
      {isMobile && (
        <Button
          onClick={handleStartSimilar}
          className="w-full bg-green-600 hover:bg-green-700 text-white mt-4 mb-6"
        >
          同じ設定で開始
        </Button>
      )}
    </div>
  )

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <Card 
        className={`bg-gray-900 border-gray-800 max-w-2xl w-full mx-auto ${
          isMobile ? 'h-[500px] overflow-hidden' : 'max-h-[90vh] overflow-y-auto'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className={`relative ${isMobile ? 'pb-2' : ''}`} style={isMobile ? { paddingTop: '3rem' } : {}}>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
          
          {/* アクティビティヘッダー */}
          <div className={`p-3 rounded-lg ${activityInfo.color} bg-opacity-20 border border-opacity-30 mb-2`}>
            <div className="flex items-center space-x-3">
              <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} ${activityInfo.color} rounded-full flex items-center justify-center ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
                {activityInfo.icon}
              </div>
              <div className="flex-1">
                <h2 className={`font-bold text-white ${isMobile ? 'text-lg' : 'text-2xl'}`}>{session.activityName}</h2>
                <div className="flex items-center text-green-400 mt-1">
                  <Clock className="w-4 h-4 mr-1" />
                  <span className={`font-mono ${isMobile ? 'text-base' : 'text-lg'}`}>{formatDuration(session.duration)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className={`${isMobile ? 'h-[420px] overflow-hidden' : 'space-y-6'} relative`}>
          {/* SPでの前のページボタン（モーダルの左側中央に配置） */}
          {isMobile && currentPage > 1 && totalPages > 1 && (
            <Button
              onClick={handlePrevPage}
              variant="outline"
              size="sm"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 p-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
          )}

          {/* SPでの次のページボタン（モーダルの右側中央に配置） */}
          {isMobile && currentPage < totalPages && totalPages > 1 && (
            <Button
              onClick={handleNextPage}
              variant="outline"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 p-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          )}

          {isMobile ? (
            // SPでのスライダー表示
            <div className="h-full">
              {currentPage === 1 && renderPage1()}
              {currentPage === 2 && hasContent && (
                <div className="h-full overflow-y-auto pb-12">
                  {renderPage2()}
                </div>
              )}
            </div>
          ) : (
            // PCでの通常表示
            <div className="space-y-6">
              {renderPage1()}
              {hasContent && renderPage2()}
            </div>
          )}

          {/* PCでのアクションボタン */}
          {!isMobile && (
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
          )}
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
  const [isMobile, setIsMobile] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  
  // メモがあるかどうかをチェック
  const hasContent = !!(session?.achievements || session?.challenges || session?.notes || session?.targetTime)
  // 写真がある場合は3ページ（基本情報、メモ、写真）、メモがない場合は2ページ（基本情報、写真）、写真もメモもない場合は1ページ
  const totalPages = sessionPhotos.length > 0 ? (hasContent ? 3 : 2) : (hasContent ? 2 : 1)
  
  // 目標管理フック
  const { getGoal } = useGoalsDb()
  
  // 目標情報を取得
  const goalInfo = session?.goalId ? getGoal(session.goalId) : null

  // モバイル判定
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 写真を読み込む
  useEffect(() => {
    const loadPhotos = async () => {
      if (isOpen && session?.id) {
        setLoadingPhotos(true)
        try {
          const result = await getSessionPhotosWithPreload(session.id)
          const photos = result.photos
          setSessionPhotos(photos)
          
          // 画像の読み込み状態を初期化（プリロード済みの画像は既に読み込み完了とマーク）
          const initialStates: Record<string, boolean> = {}
          photos.forEach(photo => {
            // プリロード済みの画像かチェック
            initialStates[photo.url] = result.preloadedStates[photo.url] || false
          })
          setImageLoadStates(initialStates)
          
          // プリロードを実行
          try {
            await result.preloadPromise
            setPreloadCompleted(true)
          } catch (preloadError) {
            console.warn('一部の画像のプリロードに失敗しました:', preloadError)
          }
        } catch (error) {
          console.error('写真の読み込みに失敗しました:', error)
          // エラー時は空配列を設定
          setSessionPhotos([])
        } finally {
          setLoadingPhotos(false)
        }
      }
    }

    loadPhotos()
  }, [isOpen, session?.id])

  // モーダルが開いている間は背景スクロールを無効にする
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setCurrentPage(1) // モーダルが開いたら1ページ目に戻す
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

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleImageLoad = (url: string) => {
    setImageLoadStates(prev => ({
      ...prev,
      [url]: true
    }))
  }

  // アクティビティ情報を取得
  const activityInfo = {
    icon: session.activityIcon || "📚",
    color: session.activityColor || "bg-blue-500"
  }

  // 1ページ目のコンテンツ
  const renderPage1 = () => (
    <div className="space-y-4">
      {/* 基本情報 */}
      <div className="grid grid-cols-1 gap-5">
        {/* 実施日時と場所を横並び */}
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300 font-medium text-sm">実施日時</span>
              </div>
              <div className="text-white">
                <div className="text-sm">{formatDateTime(session.startTime)}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {session.startTime.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} ～ {session.endTime.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-green-400" />
                <span className="text-gray-300 font-medium text-sm">場所</span>
              </div>
              <div className="text-white text-sm">{session.location || '未設定'}</div>
            </CardContent>
          </Card>
        </div>

        {/* 関連する目標と気分を横並び */}
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300 font-medium text-sm">関連する目標</span>
              </div>
              {goalInfo ? (
                <>
                  <div className="text-white text-sm">{goalInfo.title}</div>
                  {goalInfo.description && (
                    <div className="text-gray-400 text-xs mt-1">{goalInfo.description}</div>
                  )}
                </>
              ) : (
                <div className="text-gray-400 text-sm">未設定</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-300 font-medium text-sm">気分</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-xl">{getMoodEmoji(session.mood || 3)}</div>
                <div>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= (session.mood || 3) ? "text-yellow-400 fill-yellow-400" : "text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-white text-sm mt-1">{getMoodText(session.mood || 3)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SPでのページインジケーター（関連する目標と気分の下に配置） */}
        {isMobile && totalPages > 1 && (
          <div className="flex justify-center space-x-2 mt-6">
            {Array.from({ length: totalPages }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i + 1 === currentPage ? 'bg-green-400' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        )}

        {/* SPでのスタートボタン（アクティビティ名と同じ幅で配置） */}
        {isMobile && (
          <Button
            onClick={handleStartSimilar}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            同じ設定で開始
          </Button>
        )}
      </div>
    </div>
  )

  // 2ページ目のコンテンツ
  const renderPage2 = () => (
    <div className="space-y-3">
      {/* 学びや成果 */}
      {session.achievements && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-gray-300 font-medium text-sm">今日学んだことや成果</span>
            </div>
            <div className="text-white text-sm whitespace-pre-wrap">{session.achievements}</div>
          </CardContent>
        </Card>
      )}

      {/* 課題や改善点 */}
      {session.challenges && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="w-4 h-4 text-orange-400" />
              <span className="text-gray-300 font-medium text-sm">課題や次回への改善点</span>
            </div>
            <div className="text-white text-sm whitespace-pre-wrap">{session.challenges}</div>
          </CardContent>
        </Card>
      )}

      {/* その他のメモ */}
      {session.notes && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300 font-medium text-sm">その他のメモ</span>
            </div>
            <div className="text-white text-sm whitespace-pre-wrap">{session.notes}</div>
          </CardContent>
        </Card>
      )}

      {/* 目標時間と達成度 */}
      {session.targetTime && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-gray-300 font-medium text-sm">目標達成度</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">目標時間</span>
                <span className="text-white">{formatDuration(session.targetTime * 60)}</span>
              </div>
              <Progress 
                value={Math.min((session.duration / (session.targetTime * 60)) * 100, 100)} 
                className="h-2" 
              />
              <div className="flex justify-between text-xs">
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

      {/* SPでのページインジケーター（スクロール領域の最後に配置） */}
      {isMobile && totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-6 pt-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i + 1 === currentPage ? 'bg-green-400' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      )}

      {/* SPでのスタートボタン（スクロール領域の最後に配置） */}
      {isMobile && (
        <Button
          onClick={handleStartSimilar}
          className="w-full bg-green-600 hover:bg-green-700 text-white mt-4 mb-6"
        >
          同じ設定で開始
        </Button>
      )}
    </div>
  )

  // 3ページ目のコンテンツ（写真）
  const renderPage3 = () => (
    <div className="space-y-3">
      {loadingPhotos ? (
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-400 text-sm">写真を読み込んでいます...</div>
        </div>
      ) : sessionPhotos.length > 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className={`${isMobile ? 'p-2' : 'p-3'}`}>
            <div className="flex items-center space-x-2 mb-3">
              <Camera className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300 font-medium text-sm">写真</span>
            </div>
            <div className={`grid gap-3 ${
              isMobile 
                ? 'grid-cols-1' // SPでは1列で大きく表示
                : sessionPhotos.length === 1 
                  ? 'grid-cols-1' // PCで1枚の場合は1列
                  : sessionPhotos.length === 2
                    ? 'grid-cols-2' // PCで2枚の場合は2列
                    : 'grid-cols-2' // PCで3枚以上の場合は2列
            }`}>
              {sessionPhotos.map((photo, index) => (
                <div key={photo.id || index} className="relative group">
                  <img
                    src={photo.url}
                    alt={`Photo ${index + 1}`}
                    className={`w-full object-cover rounded-lg transition-opacity duration-200 ${
                      isMobile 
                        ? 'h-48' // SPでは高さを大きく
                        : sessionPhotos.length === 1
                          ? 'h-64' // PCで1枚の場合は大きく
                          : 'h-32' // PCで複数枚の場合
                    } ${imageLoadStates[photo.url] ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => handleImageLoad(photo.url)}
                    loading="lazy"
                  />
                  {/* ローディング表示（初期状態または読み込み中のみ表示） */}
                  {!imageLoadStates[photo.url] && (
                    <div className={`absolute inset-0 bg-gray-700 animate-pulse rounded-lg flex items-center justify-center ${
                      isMobile ? 'h-48' : sessionPhotos.length === 1 ? 'h-64' : 'h-32'
                    }`}>
                      <div className="text-gray-500 text-sm">読み込み中...</div>
                    </div>
                  )}
                  {/* ホバー効果（PCのみ） */}
                  {!isMobile && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">写真はありません</p>
        </div>
      )}

      {/* SPでのページインジケーター */}
      {isMobile && totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i + 1 === currentPage ? 'bg-green-400' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      )}

      {/* SPでのスタートボタン */}
      {isMobile && (
        <Button
          onClick={handleStartSimilar}
          className="w-full bg-green-600 hover:bg-green-700 text-white mt-4"
        >
          同じ設定で開始
        </Button>
      )}
    </div>
  )

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <Card 
        className={`bg-gray-900 border-gray-800 max-w-2xl w-full mx-auto ${
          isMobile ? 'h-[500px] overflow-hidden' : 'max-h-[90vh] overflow-y-auto'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className={`relative ${isMobile ? 'pb-2' : ''}`} style={isMobile ? { paddingTop: '3rem' } : {}}>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
          
          {/* アクティビティヘッダー */}
          <div className={`p-3 rounded-lg ${activityInfo.color} bg-opacity-20 border border-opacity-30 mb-2`}>
            <div className="flex items-center space-x-3">
              <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} ${activityInfo.color} rounded-full flex items-center justify-center ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
                {activityInfo.icon}
              </div>
              <div className="flex-1">
                <h2 className={`font-bold text-white ${isMobile ? 'text-lg' : 'text-2xl'}`}>{session.activityName}</h2>
                <div className="flex items-center text-green-400 mt-1">
                  <Clock className="w-4 h-4 mr-1" />
                  <span className={`font-mono ${isMobile ? 'text-base' : 'text-lg'}`}>{formatDuration(session.duration)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className={`${isMobile ? 'h-[420px] overflow-hidden' : 'space-y-6'} relative`}>
          {/* SPでの前のページボタン（モーダルの左側中央に配置） */}
          {isMobile && currentPage > 1 && totalPages > 1 && (
            <Button
              onClick={handlePrevPage}
              variant="outline"
              size="sm"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 p-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
          )}

          {/* SPでの次のページボタン（モーダルの右側中央に配置） */}
          {isMobile && currentPage < totalPages && totalPages > 1 && (
            <Button
              onClick={handleNextPage}
              variant="outline"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 p-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          )}

          {isMobile ? (
            // SPでのスライダー表示
            <div className="h-full">
              {currentPage === 1 && renderPage1()}
              {currentPage === 2 && hasContent && (
                <div className="h-full overflow-y-auto pb-12">
                  {renderPage2()}
                </div>
              )}
              {currentPage === 2 && !hasContent && sessionPhotos.length > 0 && renderPage3()}
              {currentPage === 3 && hasContent && sessionPhotos.length > 0 && renderPage3()}
            </div>
          ) : (
            // PCでの通常表示
            <div className="space-y-6">
              {renderPage1()}
              {hasContent && renderPage2()}
              {sessionPhotos.length > 0 && renderPage3()}
            </div>
          )}

          {/* PCでのアクションボタン */}
          {!isMobile && (
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
          )}
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
  }

  return (
    <SessionDetailModalWithoutPhotos
      isOpen={isOpen}
      session={session}
      onClose={onClose}
      onStartSimilar={onStartSimilar}
    />
  )
}

export default SessionDetailModal 