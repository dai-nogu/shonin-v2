"use client"

import { useEffect, useState } from "react"
import { X, Clock, Calendar, MapPin, Star, TrendingUp, MessageSquare, Target, Camera, Image } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { Progress } from "@/components/ui/common/progress"
import { useTranslations } from 'next-intl'
import { getSessionPhotos, type UploadedPhoto, getSessionPhotosWithPreload } from "@/lib/upload-photo"
import { useGoalsDb } from "@/hooks/use-goals-db"
import { useScrollLock } from "@/lib/modal-scroll-lock"
import type { CompletedSession } from "./time-tracker"

interface SessionDetailModalProps {
  isOpen: boolean
  session: CompletedSession | null
  onClose: () => void
  onStartSimilar?: (sessionData: any) => void
}

// 写真なしモーダル
function SessionDetailModalWithoutPhotos({ isOpen, session, onClose, onStartSimilar }: SessionDetailModalProps) {
  const t = useTranslations()
  const [isMobile, setIsMobile] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  
  // スワイプ機能用の状態
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [slideOffset, setSlideOffset] = useState(0)
  
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
  useScrollLock(isOpen)
  
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1) // モーダルが開いたら1ページ目に戻す
    }
  }, [isOpen])

  if (!isOpen || !session) return null

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}${t('time.hours_unit')}${minutes}${t('time.minutes_unit')}`
    }
    return `${minutes}${t('time.minutes_unit')}`
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
    if (currentPage < totalPages && !isTransitioning) {
      setIsTransitioning(true)
      setCurrentPage(currentPage + 1)
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1 && !isTransitioning) {
      setIsTransitioning(true)
      setCurrentPage(currentPage - 1)
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }

  // スワイプ機能
  const minSwipeDistance = 50 // 最小スワイプ距離

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
    setSlideOffset(0)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || isTransitioning) return
    
    const currentTouch = e.targetTouches[0].clientX
    const diff = touchStart - currentTouch
    
    // スワイプの制限（端のページでは逆方向にスワイプできない）
    if ((currentPage === 1 && diff < 0) || (currentPage === totalPages && diff > 0)) {
      setSlideOffset(diff * 0.3) // 抵抗感を演出
    } else {
      setSlideOffset(diff)
    }
    
    setTouchEnd(currentTouch)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || isTransitioning) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    // スライドオフセットをリセット
    setSlideOffset(0)

    if (isLeftSwipe && currentPage < totalPages) {
      handleNextPage()
    } else if (isRightSwipe && currentPage > 1) {
      handlePrevPage()
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
      <div className="grid grid-cols-1 gap-1">
        {/* 実施日時と場所を横並び */}
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300 font-medium text-sm">{t('session_detail.implementation_date')}</span>
              </div>
              <div className="text-white">
                <div className="text-sm">{formatDateTime(session.startTime)}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-green-400" />
                <span className="text-gray-300 font-medium text-sm">{t('session_detail.location')}</span>
              </div>
              <div className="text-white text-sm">{session.location || t('common.not_set')}</div>
            </CardContent>
          </Card>
        </div>

        {/* 関連する目標と気分を横並び */}
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300 font-medium text-sm">{t('session_detail.related_goal')}</span>
              </div>
              {goalInfo ? (
                <div className="text-white text-sm">{goalInfo.title}</div>
              ) : (
                <div className="text-gray-400 text-sm">{t('common.not_set')}</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-300 font-medium text-sm">{t('session_detail.mood')}</span>
              </div>
              <div className="flex items-center space-x-2">
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
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
              <span className="text-gray-300 font-medium text-sm">{t('session_detail.achievements')}</span>
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
              <span className="text-gray-300 font-medium text-sm">{t('session_detail.improvements')}</span>
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
    </div>
  )

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <Card 
        className={`bg-gray-900 border-gray-800 max-w-2xl w-full mx-auto ${
          isMobile ? 'h-[430px] overflow-hidden' : 'max-h-[90vh] overflow-y-auto'
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
              <div className="flex-1 min-w-0">
                <h2 className={`text-white font-bold ${isMobile ? 'text-lg' : 'text-xl'} truncate`}>
                  {session.activityName}
                </h2>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-green-400`} />
                  <span className={`text-green-400 font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>
                    {formatDuration(session.duration)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* 新しい構造: フレックスレイアウトでコンテンツエリアとフッターを分離 */}
        <CardContent className={`flex flex-col ${isMobile ? 'h-[290px]' : 'min-h-0'} relative`}>
          {/* ナビゲーションボタン（SP用） */}
          {isMobile && currentPage > 1 && totalPages > 1 && (
            <Button
              onClick={handlePrevPage}
              variant="outline"
              size="sm"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-gray-700 border-gray-600 text-white hover:bg-gray-600 shadow-lg p-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
          )}

          {isMobile && currentPage < totalPages && totalPages > 1 && (
            <Button
              onClick={handleNextPage}
              variant="outline"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-gray-700 border-gray-600 text-white hover:bg-gray-600 shadow-lg p-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          )}

          {/* コンテンツエリア - スクロール可能 */}
          <div className="flex-1 overflow-y-auto">
            {isMobile ? (
              // SPでのページ表示（スワイプ対応・アニメーション付き）
              <div 
                className="h-full relative overflow-hidden"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <div 
                  className="h-full transition-transform duration-300 ease-out"
                  style={{
                    transform: `translateX(calc(-${(currentPage - 1) * 100}% + ${-slideOffset}px))`
                  }}
                >
                  <div className="flex h-full">
                    {/* 1ページ目 */}
                    <div className="w-full flex-shrink-0">
                      <div className="pb-4 h-full overflow-y-auto">
                        {renderPage1()}
                      </div>
                    </div>
                    
                    {/* 2ページ目（メモがある場合のみ） */}
                    {hasContent && (
                      <div className="w-full flex-shrink-0">
                        <div className="pb-4 h-full overflow-y-auto">
                          {renderPage2()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // PCでの通常表示
              <div className="space-y-6">
                {renderPage1()}
                {hasContent && renderPage2()}
              </div>
            )}
          </div>

          {/* フッターエリア - 固定（ページインジケーター + スタートボタン） */}
          {isMobile && (
            <div className="flex-shrink-0 pt-4 space-y-3">
              {/* ページインジケーター */}
              {totalPages > 1 && (
                <div className="flex justify-center space-x-2">
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
              
              {/* スタートボタン */}
              <Button
                onClick={handleStartSimilar}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {t('session_detail.start_session')}
              </Button>
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
                {t('session_detail.close')}
              </Button>
              {onStartSimilar && (
                <Button
                  onClick={handleStartSimilar}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {t('session_detail.start_session')}
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
  const t = useTranslations()
  const [sessionPhotos, setSessionPhotos] = useState<UploadedPhoto[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [imageLoadStates, setImageLoadStates] = useState<Record<string, boolean>>({})
  const [preloadCompleted, setPreloadCompleted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  
  // スワイプ機能用の状態
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [slideOffset, setSlideOffset] = useState(0)
  
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
  useScrollLock(isOpen)
  
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1) // モーダルが開いたら1ページ目に戻す
    }
  }, [isOpen])

  if (!isOpen || !session) return null

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}${t('time.hours_unit')}${minutes}${t('time.minutes_unit')}`
    }
    return `${minutes}${t('time.minutes_unit')}`
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
    if (currentPage < totalPages && !isTransitioning) {
      setIsTransitioning(true)
      setCurrentPage(currentPage + 1)
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1 && !isTransitioning) {
      setIsTransitioning(true)
      setCurrentPage(currentPage - 1)
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }

  const handleImageLoad = (url: string) => {
    setImageLoadStates(prev => ({
      ...prev,
      [url]: true
    }))
  }

  // スワイプ機能
  const minSwipeDistance = 50 // 最小スワイプ距離

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
    setSlideOffset(0)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || isTransitioning) return
    
    const currentTouch = e.targetTouches[0].clientX
    const diff = touchStart - currentTouch
    
    // スワイプの制限（端のページでは逆方向にスワイプできない）
    if ((currentPage === 1 && diff < 0) || (currentPage === totalPages && diff > 0)) {
      setSlideOffset(diff * 0.3) // 抵抗感を演出
    } else {
      setSlideOffset(diff)
    }
    
    setTouchEnd(currentTouch)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || isTransitioning) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    // スライドオフセットをリセット
    setSlideOffset(0)

    if (isLeftSwipe && currentPage < totalPages) {
      handleNextPage()
    } else if (isRightSwipe && currentPage > 1) {
      handlePrevPage()
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
      <div className="grid grid-cols-1 gap-1">
        {/* 実施日時と場所を横並び */}
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300 font-medium text-sm">{t('session_detail.implementation_date')}</span>
              </div>
              <div className="text-white">
                <div className="text-sm">{formatDateTime(session.startTime)}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-green-400" />
                <span className="text-gray-300 font-medium text-sm">{t('session_detail.location')}</span>
              </div>
              <div className="text-white text-sm">{session.location || t('common.not_set')}</div>
            </CardContent>
          </Card>
        </div>

        {/* 関連する目標と気分を横並び */}
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300 font-medium text-sm">{t('session_detail.related_goal')}</span>
              </div>
              {goalInfo ? (
                <div className="text-white text-sm">{goalInfo.title}</div>
              ) : (
                <div className="text-gray-400 text-sm">{t('common.not_set')}</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-300 font-medium text-sm">{t('session_detail.mood')}</span>
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
              <span className="text-gray-300 font-medium text-sm">{t('session_detail.achievements')}</span>
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
              <span className="text-gray-300 font-medium text-sm">{t('session_detail.improvements')}</span>
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
    </div>
  )

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <Card 
        className={`bg-gray-900 border-gray-800 max-w-2xl w-full mx-auto ${
          isMobile ? 'h-[430px] overflow-hidden' : 'max-h-[90vh] overflow-y-auto'
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
              <div className="flex-1 min-w-0">
                <h2 className={`text-white font-bold ${isMobile ? 'text-lg' : 'text-xl'} truncate`}>
                  {session.activityName}
                </h2>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-green-400`} />
                  <span className={`text-green-400 font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>
                    {formatDuration(session.duration)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* 新しい構造: フレックスレイアウトでコンテンツエリアとフッターを分離 */}
        <CardContent className={`flex flex-col ${isMobile ? 'h-[290px]' : 'min-h-0'} relative`}>
          {/* ナビゲーションボタン（SP用） */}
          {isMobile && currentPage > 1 && totalPages > 1 && (
            <Button
              onClick={handlePrevPage}
              variant="outline"
              size="sm"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-gray-700 border-gray-600 text-white hover:bg-gray-600 shadow-lg p-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
          )}

          {isMobile && currentPage < totalPages && totalPages > 1 && (
            <Button
              onClick={handleNextPage}
              variant="outline"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-gray-700 border-gray-600 text-white hover:bg-gray-600 shadow-lg p-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          )}

          {/* コンテンツエリア - スクロール可能 */}
          <div className="flex-1 overflow-y-auto">
            {isMobile ? (
              // SPでのページ表示（スワイプ対応・アニメーション付き）
              <div 
                className="h-full relative overflow-hidden"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <div 
                  className="h-full transition-transform duration-300 ease-out"
                  style={{
                    transform: `translateX(calc(-${(currentPage - 1) * 100}% + ${-slideOffset}px))`
                  }}
                >
                  <div className="flex h-full">
                    {/* 1ページ目 */}
                    <div className="w-full flex-shrink-0">
                      <div className="pb-4 h-full overflow-y-auto">
                        {renderPage1()}
                      </div>
                    </div>
                    
                    {/* 2ページ目（メモがある場合） */}
                    {hasContent && (
                      <div className="w-full flex-shrink-0">
                        <div className="pb-4 h-full overflow-y-auto">
                          {renderPage2()}
                        </div>
                      </div>
                    )}
                    
                    {/* 2ページ目または3ページ目（写真がある場合） */}
                    {sessionPhotos.length > 0 && (
                      <div className="w-full flex-shrink-0">
                        <div className="pb-4 h-full overflow-y-auto">
                          {renderPage3()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // PCでの通常表示
              <div className="space-y-6">
                {renderPage1()}
                {hasContent && renderPage2()}
                {sessionPhotos.length > 0 && renderPage3()}
              </div>
            )}
          </div>

          {/* フッターエリア - 固定（ページインジケーター + スタートボタン） */}
          {isMobile && (
            <div className="flex-shrink-0 pt-4 space-y-3">
              {/* ページインジケーター */}
              {totalPages > 1 && (
                <div className="flex justify-center space-x-2">
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
              
              {/* スタートボタン */}
              <Button
                onClick={handleStartSimilar}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {t('session_detail.start_session')}
              </Button>
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
                {t('session_detail.close')}
              </Button>
              {onStartSimilar && (
                <Button
                  onClick={handleStartSimilar}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                                      {t('session_detail.start_session')}
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