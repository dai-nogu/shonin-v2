"use client"

import { useEffect, useState } from "react"
import { X, Calendar, MapPin, Star, TrendingUp, MessageSquare, Target, Camera, Image, Play } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/common/progress"
import { useTranslations } from 'next-intl'
import { cn } from "@/lib/utils"
import { getSessionPhotos, type UploadedPhoto, getSessionPhotosWithPreload } from "@/lib/upload-photo"
import { useGoalsDb } from "@/hooks/use-goals-db"
import { useSessions } from "@/contexts/sessions-context"
import { useScrollLock } from "@/lib/modal-scroll-lock"
import type { CompletedSession } from "./time-tracker"
import { safeWarn } from "@/lib/safe-logger"

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
  const [isAnimating, setIsAnimating] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  
  // スワイプ機能用の状態
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [slideOffset, setSlideOffset] = useState(0)
  
  // メモがあるかどうかをチェック
  const hasContent = !!(session?.achievements || session?.challenges || session?.notes || session?.targetTime)
  const totalPages = hasContent ? 2 : 1 // メモがある場合は2ページ、ない場合は1ページ
  
  // 固定高さが必要かどうか（複数ページ or スタートボタンがある場合）
  const needsFixedHeight = totalPages > 1 || !!onStartSimilar
  
  // 目標管理フック
  const { getGoal } = useGoalsDb()
  
  // セッション状態を取得
  const { isSessionActive } = useSessions()
  
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
  useScrollLock(isOpen || isClosing)
  
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1) // モーダルが開いたら1ページ目に戻す
      setIsClosing(false)
      // アニメーション開始
      requestAnimationFrame(() => {
        setIsAnimating(true)
      })
    } else {
      setIsAnimating(false)
    }
  }, [isOpen])

  // ふわっと閉じるハンドラー
  const handleClose = () => {
    setIsAnimating(false)
    setIsClosing(true)
    // アニメーション完了後に実際に閉じる
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 300)
  }

  if ((!isOpen && !isClosing) || !session) return null

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

  const handleStartSimilar = async () => {
    if (onStartSimilar) {
      setIsStarting(true)
      // 少し遅延を入れて開始感を演出
      await new Promise((resolve) => setTimeout(resolve, 500))
      onStartSimilar({
        activityId: session.activityId,
        activityName: session.activityName,
        location: session.location,
        targetTime: session.targetTime,
        goalId: session.goalId
      })
      setIsStarting(false)
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

  // アクティビティ情報を取得（一文字アイコン）
  const activityInfo = {
    icon: session.activityName?.charAt(0) || "?",
    color: session.activityColor || "bg-blue-500"
  }

  // 1ページ目のコンテンツ
  const renderPage1 = () => (
    <div className="space-y-2">
      {/* コンパクトな情報カード */}
      <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800/50 space-y-4">
        {/* 日時と場所 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="py-1">
            <div className="flex items-center space-x-1.5 text-blue-400 mb-1.5">
              <Calendar className="w-3 h-3" />
              <span className="text-xs font-medium opacity-70">{t('session_detail.implementation_date')}</span>
            </div>
            <div className="text-white text-sm font-medium">
              {formatDateTime(session.startTime)}
            </div>
          </div>
          
          <div className="py-1">
            <div className="flex items-center space-x-1.5 text-emerald-400 mb-1.5">
              <MapPin className="w-3 h-3" />
              <span className="text-xs font-medium opacity-70">{t('session_detail.location')}</span>
            </div>
            <div className="text-white text-sm font-medium truncate">
              {session.location || t('common.not_set')}
            </div>
          </div>
        </div>

        {/* 区切り線 */}
        <div className="border-t border-gray-700/50"></div>

        {/* 目標と気分 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="py-1">
            <div className="flex items-center space-x-1.5 text-purple-400 mb-1.5">
              <Target className="w-3 h-3" />
              <span className="text-xs font-medium opacity-70">{t('session_detail.related_goal')}</span>
            </div>
            <div className="text-white text-sm font-medium">
              {goalInfo ? goalInfo.title : <span className="text-gray-500">{t('common.not_set')}</span>}
            </div>
          </div>

          <div className="py-1">
            <div className="flex items-center space-x-1.5 text-yellow-400 mb-1.5">
              <Star className="w-3 h-3" />
              <span className="text-xs font-medium opacity-70">{t('session_detail.mood')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getMoodEmoji(session.mood || 3)}</span>
              <div className="flex space-x-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 transition-all ${
                      star <= (session.mood || 3) 
                        ? "text-yellow-400 fill-yellow-400" 
                        : "text-gray-700 fill-gray-800"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // 2ページ目のコンテンツ
  const renderPage2 = () => (
    <div className="space-y-2">
      {/* 振り返り・メモ */}
      <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-800/50 space-y-2.5">
        <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold flex items-center">
          <span className="w-0.5 h-3 bg-emerald-700 rounded-full mr-1.5"></span>
          {t('session_detail.reflection_and_notes')}
        </h3>

        <div className="space-y-3">
          {/* 学びや成果 */}
          {session.achievements && (
            <div className="relative pl-3 border-l-2 border-emerald-700/30">
              <span className="text-xs font-medium text-emerald-400 mb-0.5 block">{t('session_detail.achievements')}</span>
              <div className="text-gray-200 text-xs whitespace-pre-wrap leading-relaxed">
                {session.achievements}
              </div>
            </div>
          )}

          {/* 課題や改善点 */}
          {session.challenges && (
            <div className="relative pl-3 border-l-2 border-orange-500/30">
              <span className="text-xs font-medium text-orange-400 mb-0.5 block">{t('session_detail.improvements')}</span>
              <div className="text-gray-200 text-xs whitespace-pre-wrap leading-relaxed">
                {session.challenges}
              </div>
            </div>
          )}

          {/* その他のメモ */}
          {session.notes && (
            <div className="relative pl-3 border-l-2 border-blue-500/30">
              <span className="text-xs font-medium text-blue-400 mb-0.5 block">その他のメモ</span>
              <div className="text-gray-200 text-xs whitespace-pre-wrap leading-relaxed">
                {session.notes}
              </div>
            </div>
          )}
          
          {/* メモがない場合 */}
          {!session.achievements && !session.challenges && !session.notes && !session.targetTime && (
            <div className="text-center py-3 text-gray-500 text-xs italic">
              メモはありません
            </div>
          )}
        </div>
      </div>

      {/* 目標時間と達成度 */}
      {session.targetTime && (
        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-800/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5 text-purple-400">
              <Target className="w-3 h-3" />
              <span className="text-xs font-medium">目標達成度</span>
            </div>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
              session.duration >= session.targetTime * 60 
                ? "bg-emerald-700/10 text-emerald-400 border border-emerald-700/20" 
                : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
            }`}>
              {Math.round((session.duration / (session.targetTime * 60)) * 100)}%
            </span>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
              <span>0m</span>
              <span>{formatDuration(session.targetTime * 60)}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                   session.duration >= session.targetTime * 60 ? "bg-emerald-700" : "bg-yellow-500"
                }`}
                style={{ width: `${Math.min((session.duration / (session.targetTime * 60)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div 
      className={cn(
        "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity duration-300",
        isAnimating ? "opacity-100" : "opacity-0"
      )}
      onClick={handleClose}
    >
      <Card 
        className={cn(
          `bg-[#0f1115] border-gray-800 shadow-2xl max-w-2xl w-full mx-auto transition-all duration-300 ease-out overflow-hidden ring-1 ring-white/5`,
          isMobile && needsFixedHeight ? 'h-[450px] max-h-[85vh]' : 'max-h-[85vh] overflow-y-auto rounded-xl',
          isAnimating ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className={`relative ${isMobile ? 'pb-2 pt-3' : 'pb-3 pt-4'}`}>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 text-gray-400 hover:text-white hover:bg-white/10 z-10 rounded-lg w-7 h-7 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
          
          {/* コンパクトなヘッダー */}
          <div className="flex items-center space-x-3">
            <div className={`${isMobile ? 'w-12 h-12' : 'w-14 h-14'} ${activityInfo.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
              <span className="text-xl font-bold text-white">{activityInfo.icon}</span>
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className={`text-white font-bold ${isMobile ? 'text-base' : 'text-lg'} truncate mb-1`}>
                {session.activityName}
              </h2>
              <div className="flex items-center text-emerald-400">
                <span className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'} font-mono`}>
                  {formatDuration(session.duration)}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* 新しい構造: フレックスレイアウトでコンテンツエリアとフッターを分離 */}
        <CardContent className={`flex flex-col ${needsFixedHeight ? (isMobile ? 'h-[360px]' : 'h-[320px]') : ''} relative`}>
          {/* コンテンツエリア - スクロール可能 */}
          <div className={`${needsFixedHeight ? 'flex-1' : ''} overflow-hidden relative`}>
            {/* スライダー本体 */}
            <div 
              className={`${needsFixedHeight ? 'h-full' : ''} w-full relative`}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div 
                className={`${totalPages > 1 ? 'h-full' : ''} w-full transition-transform duration-300 ease-out flex`}
                style={{
                  transform: `translateX(calc(-${(currentPage - 1) * 100}% + ${-slideOffset}px))`
                }}
              >
                {/* 1ページ目: 基本情報 */}
                <div className="w-full flex-shrink-0 overflow-y-auto px-1 py-1">
                  {renderPage1()}
                </div>
                
                {/* 2ページ目: メモ（ある場合） */}
                {hasContent && (
                  <div className="w-full flex-shrink-0 overflow-y-auto px-1 py-1">
                    {renderPage2()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* フッターエリア - 固定（ナビゲーション + インジケーター + スタートボタン） */}
          <div className={`flex-shrink-0 pt-1 space-y-2 ${isMobile ? '' : 'px-1'}`}>
            {/* ナビゲーション行（左右ボタン + インジケーター） */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2">
                {/* 左ボタン */}
                <Button
                  onClick={handlePrevPage}
                  variant="ghost"
                  size="icon"
                  disabled={currentPage <= 1}
                  className={`hover:bg-gray-700 text-white rounded-lg w-8 h-8 p-0 transition-all ${currentPage <= 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>

                {/* インジケーター */}
                <div className="flex justify-center space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => !isTransitioning && setCurrentPage(i + 1)}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        i + 1 === currentPage 
                          ? 'bg-emerald-500 w-4' 
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                    />
                  ))}
                </div>

                {/* 右ボタン */}
                <Button
                  onClick={handleNextPage}
                  variant="ghost"
                  size="icon"
                  disabled={currentPage >= totalPages}
                  className={`hover:bg-gray-700 text-white rounded-lg w-8 h-8 p-0 transition-all ${currentPage >= totalPages ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            )}
              
              {/* スタートボタン */}
              {onStartSimilar && (
                isSessionActive ? (
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <span className="w-full inline-block cursor-not-allowed">
                          <Button
                            disabled
                            className="w-full bg-emerald-700 text-white opacity-50 pointer-events-none h-9"
                          >
                            <Play className="w-3.5 h-3.5 mr-1.5" />
                            <span className="text-sm">{t('session_detail.start_session')}</span>
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{t('common.recording_in_progress')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <Button
                    onClick={handleStartSimilar}
                    disabled={isStarting}
                    className="w-full bg-emerald-700 text-white disabled:opacity-50 h-9 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isStarting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin mr-1.5" />
                        <span className="text-sm">{t('session_start.starting_recording')}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 mr-1.5" />
                        <span className="text-sm">{t('session_detail.start_session')}</span>
                      </>
                    )}
                  </Button>
                )
              )}
          </div>

          {/* PCでのアクションボタン - PCレイアウト削除 */}
          {/* {!isMobile && ( ... )} は削除し、モバイルと同じスタートボタン配置に統合 */}
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
  const [isStarting, setIsStarting] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  
  // スワイプ機能用の状態
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [slideOffset, setSlideOffset] = useState(0)
  
  // メモがあるかどうかをチェック
  const hasContent = !!(session?.achievements || session?.challenges || session?.notes || session?.targetTime)
  // 写真がある場合は3ページ（基本情報、メモ、写真）、メモがない場合は2ページ（基本情報、写真）、写真もメモもない場合は1ページ
  const totalPages = sessionPhotos.length > 0 ? (hasContent ? 3 : 2) : (hasContent ? 2 : 1)
  
  // 固定高さが必要かどうか（複数ページ or スタートボタンがある場合）
  const needsFixedHeight = totalPages > 1 || !!onStartSimilar
  
  // 目標管理フック
  const { getGoal } = useGoalsDb()
  
  // セッション状態を取得
  const { isSessionActive } = useSessions()
  
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
            safeWarn('一部の画像のプリロードに失敗しました', preloadError)
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
  useScrollLock(isOpen || isClosing)
  
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1) // モーダルが開いたら1ページ目に戻す
      setIsClosing(false)
      // アニメーション開始
      requestAnimationFrame(() => {
        setIsAnimating(true)
      })
    } else {
      setIsAnimating(false)
    }
  }, [isOpen])

  // ふわっと閉じるハンドラー
  const handleClose = () => {
    setIsAnimating(false)
    setIsClosing(true)
    // アニメーション完了後に実際に閉じる
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 300)
  }

  if ((!isOpen && !isClosing) || !session) return null

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

  const handleStartSimilar = async () => {
    if (onStartSimilar) {
      setIsStarting(true)
      // 少し遅延を入れて開始感を演出
      await new Promise((resolve) => setTimeout(resolve, 500))
      onStartSimilar({
        activityId: session.activityId,
        activityName: session.activityName,
        location: session.location,
        targetTime: session.targetTime,
        goalId: session.goalId
      })
      setIsStarting(false)
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

  // アクティビティ情報を取得（一文字アイコン）
  const activityInfo = {
    icon: session.activityName?.charAt(0) || "?",
    color: session.activityColor || "bg-blue-500"
  }

  // 1ページ目のコンテンツ
  const renderPage1 = () => (
    <div className="space-y-2">
      {/* コンパクトな情報カード */}
      <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800/50 space-y-4">
        {/* 日時と場所 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="py-1">
            <div className="flex items-center space-x-1.5 text-blue-400 mb-1.5">
              <Calendar className="w-3 h-3" />
              <span className="text-xs font-medium opacity-70">{t('session_detail.implementation_date')}</span>
            </div>
            <div className="text-white text-sm font-medium">
              {formatDateTime(session.startTime)}
            </div>
          </div>
          
          <div className="py-1">
            <div className="flex items-center space-x-1.5 text-emerald-400 mb-1.5">
              <MapPin className="w-3 h-3" />
              <span className="text-xs font-medium opacity-70">{t('session_detail.location')}</span>
            </div>
            <div className="text-white text-sm font-medium truncate">
              {session.location || t('common.not_set')}
            </div>
          </div>
        </div>

        {/* 区切り線 */}
        <div className="border-t border-gray-700/50"></div>

        {/* 目標と気分 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="py-1">
            <div className="flex items-center space-x-1.5 text-purple-400 mb-1.5">
              <Target className="w-3 h-3" />
              <span className="text-xs font-medium opacity-70">{t('session_detail.related_goal')}</span>
            </div>
            <div className="text-white text-sm font-medium">
              {goalInfo ? goalInfo.title : <span className="text-gray-500">{t('common.not_set')}</span>}
            </div>
          </div>

          <div className="py-1">
            <div className="flex items-center space-x-1.5 text-yellow-400 mb-1.5">
              <Star className="w-3 h-3" />
              <span className="text-xs font-medium opacity-70">{t('session_detail.mood')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getMoodEmoji(session.mood || 3)}</span>
              <div className="flex space-x-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 transition-all ${
                      star <= (session.mood || 3) 
                        ? "text-yellow-400 fill-yellow-400" 
                        : "text-gray-700 fill-gray-800"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // 2ページ目のコンテンツ
  const renderPage2 = () => (
    <div className="space-y-2">
      {/* 振り返り・メモ */}
      <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-800/50 space-y-2.5">
        <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold flex items-center">
          <span className="w-0.5 h-3 bg-emerald-700 rounded-full mr-1.5"></span>
          {t('session_detail.reflection_and_notes')}
        </h3>

        <div className="space-y-3">
          {/* 学びや成果 */}
          {session.achievements && (
            <div className="relative pl-3 border-l-2 border-emerald-700/30">
              <span className="text-xs font-medium text-emerald-400 mb-0.5 block">{t('session_detail.achievements')}</span>
              <div className="text-gray-200 text-xs whitespace-pre-wrap leading-relaxed">
                {session.achievements}
              </div>
            </div>
          )}

          {/* 課題や改善点 */}
          {session.challenges && (
            <div className="relative pl-3 border-l-2 border-orange-500/30">
              <span className="text-xs font-medium text-orange-400 mb-0.5 block">{t('session_detail.improvements')}</span>
              <div className="text-gray-200 text-xs whitespace-pre-wrap leading-relaxed">
                {session.challenges}
              </div>
            </div>
          )}

          {/* その他のメモ */}
          {session.notes && (
            <div className="relative pl-3 border-l-2 border-blue-500/30">
              <span className="text-xs font-medium text-blue-400 mb-0.5 block">その他のメモ</span>
              <div className="text-gray-200 text-xs whitespace-pre-wrap leading-relaxed">
                {session.notes}
              </div>
            </div>
          )}
          
          {/* メモがない場合 */}
          {!session.achievements && !session.challenges && !session.notes && !session.targetTime && (
            <div className="text-center py-3 text-gray-500 text-xs italic">
              メモはありません
            </div>
          )}
        </div>
      </div>

      {/* 目標時間と達成度 */}
      {session.targetTime && (
        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-800/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5 text-purple-400">
              <Target className="w-3 h-3" />
              <span className="text-xs font-medium">目標達成度</span>
            </div>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
              session.duration >= session.targetTime * 60 
                ? "bg-emerald-700/10 text-emerald-400 border border-emerald-700/20" 
                : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
            }`}>
              {Math.round((session.duration / (session.targetTime * 60)) * 100)}%
            </span>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
              <span>0m</span>
              <span>{formatDuration(session.targetTime * 60)}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                   session.duration >= session.targetTime * 60 ? "bg-emerald-700" : "bg-yellow-500"
                }`}
                style={{ width: `${Math.min((session.duration / (session.targetTime * 60)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // 3ページ目のコンテンツ（写真）
  const renderPage3 = () => (
    <div className="space-y-2">
      {loadingPhotos ? (
        <div className="flex flex-col justify-center items-center py-8 bg-gray-800/30 rounded-lg border border-gray-800/50">
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-2"></div>
          <div className="text-gray-400 text-xs">読み込み中...</div>
        </div>
      ) : sessionPhotos.length > 0 ? (
        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-800/50">
          <div className="flex items-center space-x-1.5 text-blue-400 mb-2">
            <Camera className="w-3 h-3" />
            <span className="font-medium text-xs">写真</span>
          </div>
          <div className={`grid gap-2 ${
            sessionPhotos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
          }`}>
            {sessionPhotos.map((photo, index) => (
              <div 
                key={photo.id || index} 
                className={`relative group rounded-lg overflow-hidden border border-gray-700/50 bg-gray-900 ${
                  sessionPhotos.length === 1 ? 'aspect-video' : 'aspect-square'
                }`}
              >
                <img
                  src={photo.url}
                  alt={`Photo ${index + 1}`}
                  className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                    imageLoadStates[photo.url] ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => handleImageLoad(photo.url)}
                  loading="lazy"
                />
                
                {/* ローディングスケルトン */}
                {!imageLoadStates[photo.url] && (
                  <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center">
                    <Camera className="w-5 h-5 text-gray-600 opacity-50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 bg-gray-800/30 rounded-lg border border-gray-800/50">
          <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center mb-2 text-gray-600">
             <Image className="w-5 h-5" />
          </div>
          <p className="text-gray-500 text-xs">写真はありません</p>
        </div>
      )}
    </div>
  )

  return (
    <div 
      className={cn(
        "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity duration-300",
        isAnimating ? "opacity-100" : "opacity-0"
      )}
      onClick={handleClose}
    >
      <Card 
        className={cn(
          `bg-[#0f1115] border-gray-800 shadow-2xl max-w-2xl w-full mx-auto transition-all duration-300 ease-out overflow-hidden ring-1 ring-white/5`,
          isMobile && needsFixedHeight ? 'h-[450px] max-h-[85vh]' : 'max-h-[85vh] overflow-y-auto rounded-xl',
          isAnimating ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className={`relative ${isMobile ? 'pb-2 pt-3' : 'pb-3 pt-4'}`}>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 text-gray-400 hover:text-white hover:bg-white/10 z-10 rounded-lg w-7 h-7 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
          
          {/* コンパクトなヘッダー */}
          <div className="flex items-center space-x-3">
            <div className={`${isMobile ? 'w-12 h-12' : 'w-14 h-14'} ${activityInfo.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
              <span className="text-xl font-bold text-white">{activityInfo.icon}</span>
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className={`text-white font-bold ${isMobile ? 'text-base' : 'text-lg'} truncate mb-1`}>
                {session.activityName}
              </h2>
              <div className="flex items-center text-emerald-400">
                <span className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'} font-mono`}>
                  {formatDuration(session.duration)}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* 新しい構造: フレックスレイアウトでコンテンツエリアとフッターを分離 */}
        <CardContent className={`flex flex-col ${needsFixedHeight ? (isMobile ? 'h-[360px]' : 'h-[320px]') : ''} relative`}>
          {/* コンテンツエリア - スクロール可能 */}
          <div className={`${needsFixedHeight ? 'flex-1' : ''} overflow-hidden relative`}>
            {/* スライダー本体 */}
            <div 
              className={`${needsFixedHeight ? 'h-full' : ''} w-full relative`}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div 
                className={`${totalPages > 1 ? 'h-full' : ''} w-full transition-transform duration-300 ease-out flex`}
                style={{
                  transform: `translateX(calc(-${(currentPage - 1) * 100}% + ${-slideOffset}px))`
                }}
              >
                {/* 1ページ目: 基本情報 */}
                <div className="w-full flex-shrink-0 overflow-y-auto px-1 py-1">
                  {renderPage1()}
                </div>
                
                {/* 2ページ目: メモ（ある場合） */}
                {hasContent && (
                  <div className="w-full flex-shrink-0 overflow-y-auto px-1 py-1">
                    {renderPage2()}
                  </div>
                )}
                
                {/* 3ページ目: 写真（ある場合） */}
                {sessionPhotos.length > 0 && (
                  <div className="w-full flex-shrink-0 overflow-y-auto px-1 py-1">
                    {renderPage3()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* フッターエリア - 固定（ナビゲーション + インジケーター + スタートボタン） */}
          <div className={`flex-shrink-0 pt-1 space-y-2 ${isMobile ? '' : 'px-1'}`}>
            {/* ナビゲーション行（左右ボタン + インジケーター） */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2">
                {/* 左ボタン */}
                <Button
                  onClick={handlePrevPage}
                  variant="ghost"
                  size="icon"
                  disabled={currentPage <= 1}
                  className={`hover:bg-gray-700 text-white rounded-lg w-8 h-8 p-0 transition-all ${currentPage <= 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>

                {/* インジケーター */}
                <div className="flex justify-center space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => !isTransitioning && setCurrentPage(i + 1)}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        i + 1 === currentPage 
                          ? 'bg-emerald-500 w-4' 
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                    />
                  ))}
                </div>

                {/* 右ボタン */}
                <Button
                  onClick={handleNextPage}
                  variant="ghost"
                  size="icon"
                  disabled={currentPage >= totalPages}
                  className={`hover:bg-gray-700 text-white rounded-lg w-8 h-8 p-0 transition-all ${currentPage >= totalPages ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            )}
              
              {/* スタートボタン */}
              {onStartSimilar && (
                isSessionActive ? (
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <span className="w-full inline-block cursor-not-allowed">
                          <Button
                            disabled
                            className="w-full bg-emerald-700 text-white opacity-50 pointer-events-none h-9"
                          >
                            <Play className="w-3.5 h-3.5 mr-1.5" />
                            <span className="text-sm">{t('session_detail.start_session')}</span>
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{t('common.recording_in_progress')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <Button
                    onClick={handleStartSimilar}
                    disabled={isStarting}
                    className="w-full bg-emerald-700 text-white disabled:opacity-50 h-9 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isStarting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin mr-1.5" />
                        <span className="text-sm">{t('session_start.starting_recording')}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 mr-1.5" />
                        <span className="text-sm">{t('session_detail.start_session')}</span>
                      </>
                    )}
                  </Button>
                )
              )}
          </div>

          {/* PCでのアクションボタン - PCレイアウト削除 */}
          {/* {!isMobile && ( ... )} は削除し、モバイルと同じスタートボタン配置に統合 */}
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