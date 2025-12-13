'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function HomePage() {
  const [activeSection, setActiveSection] = useState('hero')

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'screenshot', 'origin', 'pricing']
      const scrollPosition = window.scrollY + 100

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen w-full bg-gray-950 text-gray-100">
      {/* 追従ヘッダー */}
      <Header activeSection={activeSection} scrollToSection={scrollToSection} />

      {/* Hero Section */}
      <HeroSection />

      {/* Screenshot Section */}
      <ScreenshotSection />

      {/* Origin Section */}
      <OriginSection />

      {/* Pricing Section */}
      <PricingSection />

      {/* Footer */}
      <Footer />
    </div>
  )
}

// ヘッダーコンポーネント
function Header({ 
  activeSection, 
  scrollToSection 
}: { 
  activeSection: string
  scrollToSection: (id: string) => void 
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* ロゴ */}
        <div className="text-2xl font-bold tracking-tight text-white">
          Shonin
        </div>

        {/* ナビゲーション */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { id: 'hero', label: 'Home' },
            { id: 'screenshot', label: 'Features' },
            { id: 'origin', label: 'Origin' },
            { id: 'pricing', label: 'Pricing' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`text-sm transition-colors duration-200 ${
                activeSection === item.id
                  ? 'text-emerald-500 font-semibold'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* ログインボタン */}
        <Link
          href="/ja/login"
          className="px-6 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-600 transition-colors duration-200 text-sm font-medium"
        >
          ログイン
        </Link>
      </div>
    </header>
  )
}

// Heroセクション
function HeroSection() {
  return (
    <section id="hero" className="pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight text-white text-yakumono-tight">
        見せない努力に証人を
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed tracking-[0.15em] pt-5">
        ただ自分の成長に没頭する時間だけが<br />
        あなたを進化させる。<br />
        Shoninはその時間に寄り添い続ける。
        </p>
      </div>
    </section>
  )
}

// スクリーンショットセクション
function ScreenshotSection() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setSelectedImage(null)
      setIsClosing(false)
    }, 300) // アニメーション時間と同じ
  }

  // ESCキーでモーダルを閉じる & スクロールロック
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedImage !== null) {
        handleClose()
      }
    }
    
    if (selectedImage !== null) {
      window.addEventListener('keydown', handleEscape)
      // モーダル開いている間はbodyのスクロールを無効化
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [selectedImage])

  const screenshots = [
    {
      title: 'あなたが捨てるもの',
      description: '目標達成には何か捨てる必要があります。',
      image: '/img/img01.png',
      alt: 'add Goal'
    },
    {
      title: 'Shoninからの手紙',
      description: '毎週1回、毎月1回の合計5回届くShoninからの手紙。',
      image: '/img/img02.png',
      alt: 'Letters'
    },
    {
      title: 'もう1人じゃない',
      description: '毎回の行動を見て送られる短文のメッセージ。',
      image: '/img/img03.png',
      alt: 'mood,memo'
    }
  ]

  return (
    <section id="screenshot" className="py-24 px-6 bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight pb-24 leading-tight text-white text-yakumono-tight text-center">自分に集中するための設計</h2>
        <div className="space-y-24">
          {screenshots.map((screenshot, i) => (
            <div
              key={i}
              className={`flex flex-col ${
                i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              } gap-8 md:gap-12 items-center`}
            >
              {/* 画像 */}
              <div className="w-full md:w-3/5">
                <div 
                  className="relative rounded-2xl border-2 border-gray-700 hover:border-emerald-700 transition-all duration-300 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl cursor-pointer group"
                  onClick={() => setSelectedImage(i)}
                >
                  <img
                    src={screenshot.image}
                    alt={screenshot.alt}
                    className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      // 画像が読み込めない場合はプレースホルダーを表示
                      e.currentTarget.style.display = 'none'
                      const parent = e.currentTarget.parentElement
                      if (parent) {
                        parent.innerHTML = `
                          <div class="aspect-video flex flex-col items-center justify-center p-12 text-center">
                            <div class="text-8xl mb-6 text-emerald-500/20">
                              ${i === 0 ? '📊' : i === 1 ? '💌' : '⏱️'}
                            </div>
                          </div>
                        `
                      }
                    }}
                  />
                  {/* ホバー時のオーバーレイ */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium">
                      クリックで拡大
                    </span>
                  </div>
                </div>
              </div>

              {/* 説明 */}
              <div className="w-full md:w-2/5 space-y-6">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">
                    {screenshot.title}
                  </h3>
                  <p className="text-lg text-gray-300 leading-relaxed tracking-wide">
                    {screenshot.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 画像モーダル */}
      {selectedImage !== null && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
            isClosing ? 'opacity-0' : 'opacity-100 animate-in fade-in-0'
          }`}
          onClick={handleClose}
        >
          {/* オーバーレイ */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          
          {/* モーダルコンテンツ */}
          <div 
            className={`relative w-[80vw] max-w-[100%] transition-all duration-300 ${
              isClosing 
                ? 'scale-95 opacity-0 translate-y-4' 
                : 'scale-100 opacity-100 translate-y-0 animate-in zoom-in-95 slide-in-from-top-4'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 閉じるボタン */}
            <button
              onClick={handleClose}
              className="absolute -top-12 right-0 text-white hover:text-emerald-500 hover:bg-white/10 transition-all duration-200 focus:outline-none rounded-lg w-10 h-10 flex items-center justify-center z-10 hover:scale-110"
            >
              <X className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </button>
            
            {/* 画像 */}
            <div className="bg-transparent backdrop-blur-md rounded-2xl border-2 border-gray-700 overflow-hidden shadow-2xl">
              <img
                src={screenshots[selectedImage].image}
                alt={screenshots[selectedImage].alt}
                className="w-full h-auto object-contain max-h-[85vh]"
                style={{
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// Originセクション
function OriginSection() {
  return (
    <section id="origin" className="py-20 px-6 bg-gray-950">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16 text-white text-yakumono-tight">
        Shonin（証人）とは
        </h2>
        <div className="text-center">
          {/* 左: Shoninの意味 */}
          <div className="p-5 rounded-2xl border-gray-700 shadow-sm">
            <p className="text-2xl text-gray-300 max-w-5xl mx-auto leading-relaxed tracking-[0.15em]">
            孤独な戦いの唯一の「証人」<br />
           誰も見ていないところで人は成長する。<br />
            Shoninはあなたに伴走し、努力の証人となる。
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// Pricingセクション
function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-6 bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16 text-white">
          料金プラン
        </h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* フリープラン */}
          <div className="bg-gray-800 p-10 rounded-2xl border-2 border-gray-700">
            <h3 className="text-2xl font-bold mb-4 text-white">フリープラン</h3>
            <div className="text-4xl font-bold mb-6 text-white">
            FREE
            </div>
            <ul className="space-y-3 mb-8 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">✓</span>
                <span>基本的な時間記録機能</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">✓</span>
                <span>カレンダー表示</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">✓</span>
                <span>目標設定（1つ）</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">✓</span>
                <span>基本的な統計機能</span>
              </li>
            </ul>
            <Link
              href="/ja/dashboard"
              className="block w-full py-3 text-center border-2 border-gray-600 text-gray-300 rounded-lg hover:border-gray-500 hover:bg-gray-700 transition-colors duration-200 font-medium"
            >
              無料で始める
            </Link>
          </div>

          {/* プレミアムプラン */}
          <div className="bg-gray-800 p-10 rounded-2xl border-2 border-emerald-700 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-700 text-white text-sm font-medium rounded-full">
              おすすめ
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white">スタンダードプラン</h3>
            <div className="text-4xl font-bold mb-6 text-white">
              $9.99<span className="text-lg text-gray-400 font-normal">/月</span>
            </div>
            <ul className="space-y-3 mb-8 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">✓</span>
                <span>フリープランの全機能</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">✓</span>
                <span>無制限の目標設定</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">✓</span>
                <span>AIによる週次・月次メッセージ</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">✓</span>
                <span>画像・動画・音声アップロード</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">✓</span>
                <span>高度な分析機能</span>
              </li>
            </ul>
            <Link
              href="/ja/dashboard"
              className="block w-full py-3 text-center bg-emerald-700 text-white rounded-lg hover:bg-emerald-600 transition-colors duration-200 font-medium"
            >
              プレミアムを始める
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// Footerコンポーネント
function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-gray-800 bg-gray-950">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          {/* ロゴとコピーライト */}
          <div className="md:col-span-2">
            <div className="text-2xl font-bold mb-4 text-white">Shonin</div>
            <p className="text-gray-400 text-sm mb-4">
              Be a witness to your growth.
            </p>
            <p className="text-gray-500 text-sm">
              © 2025 Shonin. All rights reserved.
            </p>
          </div>

          {/* プロダクト */}
          <div>
            <h4 className="font-bold mb-3 text-white">プロダクト</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/ja/dashboard" className="hover:text-white transition-colors">
                  ダッシュボード
                </Link>
              </li>
              <li>
                <button onClick={() => {
                  const element = document.getElementById('pricing')
                  if (element) element.scrollIntoView({ behavior: 'smooth' })
                }} className="hover:text-white transition-colors">
                  料金プラン
                </button>
              </li>
            </ul>
          </div>

          {/* 会社情報 */}
          <div>
            <h4 className="font-bold mb-3 text-white">会社情報</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <button onClick={() => {
                  const element = document.getElementById('origin')
                  if (element) element.scrollIntoView({ behavior: 'smooth' })
                }} className="hover:text-white transition-colors">
                  私たちについて
                </button>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  プライバシーポリシー
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  利用規約
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
