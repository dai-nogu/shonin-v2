"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X, Calendar, MapPin, Star, TrendingUp, MessageSquare, Target, Camera, Image, Play, CloudRain, Cloud, Minus, Sun, Sparkles } from "lucide-react"
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
  const [mounted, setMounted] = useState(false)
  
  // スワイプ機能用の状態
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [slideOffset, setSlideOffset] = useState(0)
  
  // メモがあるかどうかをチェック
  const hasContent = !!(session?.notes || session?.targetTime)
  const totalPages = hasContent ? 2 : 1 // メモがある場合は2ページ、ない場合は1ページ
  
  // 固定高さが必要かどうか（複数ページ or スタートボタンがある場合）
  const needsFixedHeight = totalPages > 1 || !!onStartSimilar
  
  // 目標管理フック
  const { getGoal } = useGoalsDb()
  
  // セッション状態を取得
  const { isSessionActive } = useSessions()
  
  // 目標情報を取得
  const goalInfo = session?.goalId ? getGoal(session.goalId) : null

  // マウント状態の管理
  useEffect(() => {
    setMounted(true)
  }, [])

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
      // モーダルが完全に閉じた後にスライドを1ページ目にリセット（ユーザーには見えない）
      setCurrentPage(1)
      onClose()
    }, 300)
  }

  if ((!isOpen && !isClosing) || !session || !mounted) return null

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

  const getMoodIcon = (mood: number) => {
    const icons = [
      <CloudRain key="1" className="w-5 h-5 text-gray-400" />,
      <Cloud key="2" className="w-5 h-5 text-gray-400" />,
      <Minus key="3" className="w-5 h-5 text-gray-400" />,
      <Sun key="4" className="w-5 h-5 text-gray-400" />,
      <Sparkles key="5" className="w-5 h-5 text-gray-400" />
    ]
    return icons[mood - 1] || icons[2]
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
    <div className="space-y-4 px-1">
      {/* 日時と場所のグリッド */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900/40 rounded-xl p-4 border border-white/5 flex flex-col justify-center space-y-2 relative overflow-hidden group">
           {/* ホバー時の微かな光 */}
           <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="flex items-center space-x-2 text-blue-400">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-xs font-medium opacity-70 tracking-wide">{t('session_detail.implementation_date')}</span>
           </div>
           <div className="text-white text-sm font-medium pl-0.5">
              {formatDateTime(session.startTime)}
           </div>
        </div>
  
        <div className="bg-gray-900/40 rounded-xl p-4 border border-white/5 flex flex-col justify-center space-y-2 relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="flex items-center space-x-2 text-emerald-400">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-xs font-medium opacity-70 tracking-wide">{t('session_detail.location')}</span>
           </div>
           <div className="text-white text-sm font-medium truncate pl-0.5">
              {session.location || t('common.not_set')}
           </div>
        </div>
      </div>
  
      {/* 目標（全幅） */}
      <div className="bg-gray-900/40 rounded-xl p-4 border border-white/5 space-y-2 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center space-x-2 text-purple-400">
            <Target className="w-3.5 h-3.5" />
            <span className="text-xs font-medium opacity-70 tracking-wide">{t('session_detail.related_goal')}</span>
          </div>
          <div className="text-white text-sm font-medium pl-0.5">
            {goalInfo ? goalInfo.title : <span className="text-gray-500">{t('common.not_set')}</span>}
          </div>
      </div>
  
      {/* 気分（全幅） */}
      <div className="bg-gray-900/40 rounded-xl p-4 border border-white/5 space-y-2 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-yellow-400">
                <Star className="w-3.5 h-3.5" />
                <span className="text-xs font-medium opacity-70 tracking-wide">{t('session_detail.mood')}</span>
              </div>
              <span className="text-xs text-yellow-400/80 font-medium">{getMoodText(session.mood || 3)}</span>
          </div>
          
          <div className="flex items-center space-x-3 pl-0.5">
            <div className="bg-yellow-500/10 p-1.5 rounded-lg text-yellow-400">
               {getMoodIcon(session.mood || 3)}
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 transition-all ${
                    star <= (session.mood || 3) 
                      ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_2px_rgba(250,204,21,0.5)]" 
                      : "text-gray-700 fill-gray-800/50"
                  }`}
                />
              ))}
            </div>
          </div>
      </div>
    </div>
  )

  // 2ページ目のコンテンツ
  const renderPage2 = () => (
    <div className="space-y-4 px-1">
      {/* 振り返り・メモ */}
      <div className="bg-gray-900/40 rounded-xl p-4 border border-white/5 space-y-3 min-h-[120px]">
        <div className="flex items-center space-x-2 text-blue-400 mb-1">
           <MessageSquare className="w-3.5 h-3.5" />
           <span className="text-xs font-medium opacity-70 tracking-wide">メモ・振り返り</span>
        </div>
        
        <div className="space-y-3 pl-1">
          {session.notes && (
            <>
              <div className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed font-light">
                {session.notes}
              </div>
            </>
          )}
          
          {/* メモがない場合 */}
          {!session.notes && !session.targetTime && (
            <div className="text-center py-6 text-gray-500 text-xs italic">
              メモはありません
            </div>
          )}
        </div>
      </div>

      {/* 目標時間と達成度 */}
      {session.targetTime && session.targetTime > 0 && (
        <div className="bg-gray-900/40 rounded-xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-1.5 text-purple-400">
              <Target className="w-3.5 h-3.5" />
              <span className="text-xs font-medium tracking-wide">目標達成度</span>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              session.duration >= session.targetTime * 60 
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" 
                : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20"
            }`}>
              {Math.round((session.duration / (session.targetTime * 60)) * 100)}%
            </span>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
              <span>0 min</span>
              <span>{formatDuration(session.targetTime * 60)}</span>
            </div>
            <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden border border-white/5">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                   session.duration >= session.targetTime * 60 
                     ? "bg-emerald-600 shadow-[0_0_10px_rgba(5,150,105,0.4)]" 
                     : "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]"
                }`}
                style={{ width: `${Math.min((session.duration / (session.targetTime * 60)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return createPortal(
    <div 
      className={cn(
        "fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm transition-opacity duration-300",
        isAnimating ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
      onClick={handleClose}
    >
      <Card 
        className={cn(
          `bg-gray-950 border-gray-800 shadow-2xl max-w-2xl w-full mx-auto transition-all duration-300 ease-out overflow-hidden ring-1 ring-white/5`,
          isMobile && needsFixedHeight ? 'h-[500px] max-h-[85vh]' : 'max-h-[85vh] overflow-y-auto rounded-2xl',
          isAnimating ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className={`relative ${isMobile ? 'pb-4 pt-5 px-5' : 'pb-5 pt-6 px-6'}`}>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="absolute right-3 top-3 text-gray-500 hover:text-white hover:bg-white/10 z-10 rounded-full w-8 h-8 p-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </Button>
          
          {/* ヘッダー */}
          <div className="flex items-center space-x-5">
            <div className={`${isMobile ? 'w-14 h-14' : 'w-16 h-16'} ${activityInfo.color} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-black/40 ring-1 ring-white/10`}>
              <span className="text-2xl font-bold text-white drop-shadow-md">{activityInfo.icon}</span>
            </div>
            
            <div className="flex-1 min-w-0 py-1">
              <h2 className={`text-white font-bold ${isMobile ? 'text-xl' : 'text-2xl'} truncate mb-1.5 tracking-tight drop-shadow-sm`}>
                {session.activityName}
              </h2>
              <div className="flex items-center space-x-3">
                <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full text-sm font-semibold border border-emerald-500/20">
                  {formatDuration(session.duration)}
                </span>
                {session.goalId && (
                    <span className="text-xs text-gray-400 truncate max-w-[150px]">
                      {goalInfo?.title}
                    </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        {/* コンテンツとフッター */}
        <CardContent className={`flex flex-col relative ${isMobile ? 'px-4 pb-4' : 'px-6 pb-6'}`}>
          {/* コンテンツエリア - スクロール可能 */}
          <div className="overflow-hidden relative py-1">
            {/* スライダー本体 */}
            <div 
              className="w-full relative"
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

          {/* フッターエリア */}
          <div className="flex-shrink-0 pt-4 space-y-4">
            {/* ナビゲーション行（左右ボタン + インジケーター） */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2">
                {/* 左ボタン */}
                <Button
                  onClick={handlePrevPage}
                  variant="ghost"
                  size="icon"
                  disabled={currentPage <= 1}
                  className={`hover:bg-white/5 text-gray-400 hover:text-white rounded-full w-9 h-9 p-0 transition-all ${currentPage <= 1 ? 'opacity-0 cursor-default' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>

                {/* インジケーター */}
                <div className="flex justify-center space-x-2.5">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => !isTransitioning && setCurrentPage(i + 1)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i + 1 === currentPage 
                          ? 'bg-emerald-500 w-6 shadow-[0_0_8px_rgba(16,185,129,0.4)]' 
                          : 'bg-gray-700 w-1.5 hover:bg-gray-600'
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
                  className={`hover:bg-white/5 text-gray-400 hover:text-white rounded-full w-9 h-9 p-0 transition-all ${currentPage >= totalPages ? 'opacity-0 cursor-default' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            )}
              
              {/* スタートボタン */}
              <div className="pt-2 pb-1">
              {onStartSimilar && (
                isSessionActive ? (
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <span className="w-full inline-block cursor-not-allowed">
                          <Button
                            disabled
                            className="w-full bg-emerald-900/40 border border-emerald-900/50 text-emerald-400 opacity-70 pointer-events-none h-12 rounded-xl"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            <span className="text-base font-medium">{t('session_detail.start_session')}</span>
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
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-900/40 h-12 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isStarting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        <span className="text-base font-bold tracking-wide">{t('session_start.starting_recording')}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2 fill-current" />
                        <span className="text-base font-bold tracking-wide">{t('session_detail.start_session')}</span>
                      </>
                    )}
                  </Button>
                )
              )}
              </div>
          </div>
        </CardContent>
      </Card>
    </div>,
    document.body
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
  const [mounted, setMounted] = useState(false)
  
  // スワイプ機能用の状態
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [slideOffset, setSlideOffset] = useState(0)
  
  // メモがあるかどうかをチェック
  const hasContent = !!(session?.notes || session?.targetTime)
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

  // マウント状態の管理
  useEffect(() => {
    setMounted(true)
  }, [])

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
      // モーダルが完全に閉じた後にスライドを1ページ目にリセット（ユーザーには見えない）
      setCurrentPage(1)
      onClose()
    }, 300)
  }

  if ((!isOpen && !isClosing) || !session || !mounted) return null

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

  const getMoodIcon = (mood: number) => {
    const icons = [
      <CloudRain key="1" className="w-5 h-5 text-gray-400" />,
      <Cloud key="2" className="w-5 h-5 text-gray-400" />,
      <Minus key="3" className="w-5 h-5 text-gray-400" />,
      <Sun key="4" className="w-5 h-5 text-gray-400" />,
      <Sparkles key="5" className="w-5 h-5 text-gray-400" />
    ]
    return icons[mood - 1] || icons[2]
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
    <div className="space-y-4 px-1">
      {/* 日時と場所のグリッド */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900/40 rounded-xl p-4 border border-white/5 flex flex-col justify-center space-y-2 relative overflow-hidden group">
           {/* ホバー時の微かな光 */}
           <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="flex items-center space-x-2 text-blue-400">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-xs font-medium opacity-70 tracking-wide">{t('session_detail.implementation_date')}</span>
           </div>
           <div className="text-white text-sm font-medium pl-0.5">
              {formatDateTime(session.startTime)}
           </div>
        </div>
  
        <div className="bg-gray-900/40 rounded-xl p-4 border border-white/5 flex flex-col justify-center space-y-2 relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="flex items-center space-x-2 text-emerald-400">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-xs font-medium opacity-70 tracking-wide">{t('session_detail.location')}</span>
           </div>
           <div className="text-white text-sm font-medium truncate pl-0.5">
              {session.location || t('common.not_set')}
           </div>
        </div>
      </div>
  
      {/* 目標（全幅） */}
      <div className="bg-gray-900/40 rounded-xl p-4 border border-white/5 space-y-2 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center space-x-2 text-purple-400">
            <Target className="w-3.5 h-3.5" />
            <span className="text-xs font-medium opacity-70 tracking-wide">{t('session_detail.related_goal')}</span>
          </div>
          <div className="text-white text-sm font-medium pl-0.5">
            {goalInfo ? goalInfo.title : <span className="text-gray-500">{t('common.not_set')}</span>}
          </div>
      </div>
  
      {/* 気分（全幅） */}
      <div className="bg-gray-900/40 rounded-xl p-4 border border-white/5 space-y-2 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-yellow-400">
                <Star className="w-3.5 h-3.5" />
                <span className="text-xs font-medium opacity-70 tracking-wide">{t('session_detail.mood')}</span>
              </div>
              <span className="text-xs text-yellow-400/80 font-medium">{getMoodText(session.mood || 3)}</span>
          </div>
          
          <div className="flex items-center space-x-3 pl-0.5">
            <div className="bg-yellow-500/10 p-1.5 rounded-lg text-yellow-400">
               {getMoodIcon(session.mood || 3)}
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 transition-all ${
                    star <= (session.mood || 3) 
                      ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_2px_rgba(250,204,21,0.5)]" 
                      : "text-gray-700 fill-gray-800/50"
                  }`}
                />
              ))}
            </div>
          </div>
      </div>
    </div>
  )

  // 2ページ目のコンテンツ
  const renderPage2 = () => (
    <div className="space-y-4 px-1">
      {/* 振り返り・メモ */}
      <div className="bg-gray-900/40 rounded-xl p-4 border border-white/5 space-y-3 min-h-[120px]">
        <div className="flex items-center space-x-2 text-blue-400 mb-1">
           <MessageSquare className="w-3.5 h-3.5" />
           <span className="text-xs font-medium opacity-70 tracking-wide">メモ・振り返り</span>
        </div>
        
        <div className="space-y-3 pl-1">
          {session.notes && (
            <>
              <div className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed font-light">
                {session.notes}
              </div>
            </>
          )}
          
          {/* メモがない場合 */}
          {!session.notes && !session.targetTime && (
            <div className="text-center py-6 text-gray-500 text-xs italic">
              メモはありません
            </div>
          )}
        </div>
      </div>

      {/* 目標時間と達成度 */}
      {session.targetTime && session.targetTime > 0 && (
        <div className="bg-gray-900/40 rounded-xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-1.5 text-purple-400">
              <Target className="w-3.5 h-3.5" />
              <span className="text-xs font-medium tracking-wide">目標達成度</span>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              session.duration >= session.targetTime * 60 
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" 
                : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20"
            }`}>
              {Math.round((session.duration / (session.targetTime * 60)) * 100)}%
            </span>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
              <span>0 min</span>
              <span>{formatDuration(session.targetTime * 60)}</span>
            </div>
            <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden border border-white/5">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                   session.duration >= session.targetTime * 60 
                     ? "bg-emerald-600 shadow-[0_0_10px_rgba(5,150,105,0.4)]" 
                     : "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]"
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
        <div className="flex flex-col justify-center items-center py-8 bg-gray-900/40 rounded-xl border border-white/5 min-h-[200px]">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <div className="text-gray-400 text-xs tracking-wide">{t('common.loading')}</div>
        </div>
      ) : sessionPhotos.length > 0 ? (
        <div className="bg-gray-900/40 rounded-xl p-4 border border-white/5 min-h-[200px]">
          <div className="flex items-center space-x-2 text-blue-400 mb-4">
            <Camera className="w-3.5 h-3.5" />
            <span className="font-medium text-xs tracking-wide">写真</span>
          </div>
          <div className={`grid gap-3 ${
            sessionPhotos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
          }`}>
            {sessionPhotos.map((photo, index) => (
              <div 
                key={photo.id || index} 
                className={`relative group rounded-lg overflow-hidden border border-white/10 bg-black ${
                  sessionPhotos.length === 1 ? 'aspect-video' : 'aspect-square'
                } shadow-lg`}
              >
                <img
                  src={photo.url}
                  alt={`Photo ${index + 1}`}
                  className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
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
        <div className="flex flex-col items-center justify-center py-12 bg-gray-900/40 rounded-xl border border-white/5">
          <div className="w-12 h-12 bg-gray-800/50 rounded-full flex items-center justify-center mb-3 text-gray-600 ring-1 ring-white/5">
             <Image className="w-5 h-5" />
          </div>
          <p className="text-gray-500 text-xs">写真はありません</p>
        </div>
      )}
    </div>
  )

  return createPortal(
    <div 
      className={cn(
        "fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm transition-opacity duration-300",
        isAnimating ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
      onClick={handleClose}
    >
      <Card 
        className={cn(
          `bg-gray-950 border-gray-800 shadow-2xl max-w-2xl w-full mx-auto transition-all duration-300 ease-out overflow-hidden ring-1 ring-white/5`,
          isMobile && needsFixedHeight ? 'h-[500px] max-h-[85vh]' : 'max-h-[85vh] overflow-y-auto rounded-2xl',
          isAnimating ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className={`relative ${isMobile ? 'pb-4 pt-5 px-5' : 'pb-5 pt-6 px-6'}`}>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="absolute right-3 top-3 text-gray-500 hover:text-white hover:bg-white/10 z-10 rounded-full w-8 h-8 p-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </Button>
          
          {/* ヘッダー */}
          <div className="flex items-center space-x-5">
            <div className={`${isMobile ? 'w-14 h-14' : 'w-16 h-16'} ${activityInfo.color} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-black/40 ring-1 ring-white/10`}>
              <span className="text-2xl font-bold text-white drop-shadow-md">{activityInfo.icon}</span>
            </div>
            
            <div className="flex-1 min-w-0 py-1">
              <h2 className={`text-white font-bold ${isMobile ? 'text-xl' : 'text-2xl'} truncate mb-1.5 tracking-tight drop-shadow-sm`}>
                {session.activityName}
              </h2>
              <div className="flex items-center space-x-3">
                <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full text-sm font-semibold border border-emerald-500/20">
                  {formatDuration(session.duration)}
                </span>
                {session.goalId && (
                    <span className="text-xs text-gray-400 truncate max-w-[150px]">
                      {goalInfo?.title}
                    </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        {/* コンテンツとフッター */}
        <CardContent className={`flex flex-col relative ${isMobile ? 'px-4 pb-4' : 'px-6 pb-6'}`}>
          {/* コンテンツエリア - スクロール可能 */}
          <div className="overflow-hidden relative py-1">
            {/* スライダー本体 */}
            <div 
              className="w-full relative"
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

          {/* フッターエリア */}
          <div className="flex-shrink-0 pt-4 space-y-4">
            {/* ナビゲーション行（左右ボタン + インジケーター） */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2">
                {/* 左ボタン */}
                <Button
                  onClick={handlePrevPage}
                  variant="ghost"
                  size="icon"
                  disabled={currentPage <= 1}
                  className={`hover:bg-white/5 text-gray-400 hover:text-white rounded-full w-9 h-9 p-0 transition-all ${currentPage <= 1 ? 'opacity-0 cursor-default' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>

                {/* インジケーター */}
                <div className="flex justify-center space-x-2.5">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => !isTransitioning && setCurrentPage(i + 1)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i + 1 === currentPage 
                          ? 'bg-emerald-500 w-6 shadow-[0_0_8px_rgba(16,185,129,0.4)]' 
                          : 'bg-gray-700 w-1.5 hover:bg-gray-600'
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
                  className={`hover:bg-white/5 text-gray-400 hover:text-white rounded-full w-9 h-9 p-0 transition-all ${currentPage >= totalPages ? 'opacity-0 cursor-default' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            )}
              
              {/* スタートボタン */}
              <div className="pt-2 pb-1">
              {onStartSimilar && (
                isSessionActive ? (
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <span className="w-full inline-block cursor-not-allowed">
                          <Button
                            disabled
                            className="w-full bg-emerald-900/40 border border-emerald-900/50 text-emerald-400 opacity-70 pointer-events-none h-12 rounded-xl"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            <span className="text-base font-medium">{t('session_detail.start_session')}</span>
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
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-900/40 h-12 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isStarting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        <span className="text-base font-bold tracking-wide">{t('session_start.starting_recording')}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2 fill-current" />
                        <span className="text-base font-bold tracking-wide">{t('session_detail.start_session')}</span>
                      </>
                    )}
                  </Button>
                )
              )}
              </div>
          </div>
        </CardContent>
      </Card>
    </div>,
    document.body
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