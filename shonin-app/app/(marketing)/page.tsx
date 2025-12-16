'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function HomePage() {
  const [activeSection, setActiveSection] = useState('top')

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['top', 'features', 'about', 'price']
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
        <div className="space-x-3">
          <div className="w-[170px] overflow-hidden bg-transparent">
            <img 
              src="/logo.png" 
              alt="Shonin Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          {/* <div className="text-2xl font-bold text-white tracking-[0.15em]">
            Shonin
          </div> */}
        </div>

        {/* ナビゲーション */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { id: 'top', label: 'Top' },
            { id: 'features', label: 'Features' },
            { id: 'about', label: 'About' },
            { id: 'price', label: 'Price' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`text-lg tracking-[0.15em] transition-colors duration-200 ${
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
          className="px-6 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-600 transition-colors duration-200 text-sm font-medium tracking-[0.15em]"
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
    <section id="top" className="pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
      <h1 className="text-5xl md:font-size: 3.5rem; font-bold leading-relaxed text-white">沈黙を愛する努力家たちへ</h1>
      <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed tracking-[0.15em]">
      No Chat, No Camera, No Avatar.
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
      title: 'ひとりだけど独りじゃない',
      description: 'チャット、カメラ、アバターはない。世界中の一人で頑張る同志の気配を感じ、ひとりで没頭する。',
      image: '/img/img01.png',
      alt: 'Deep work'
    },
    {
      title: 'あなたが捨てるもの',
      description: 'スマホ、娯楽、誘惑などを一時的に断つことでより深い集中が可能になり、目標達成の可能性が高まります。',
      image: '/img/img02.png',
      alt: 'add Goal'
    },
    {
      title: 'Shoninからの手紙',
      description: '一人で頑張るのがどうしても辛い時はShoninからの手紙を受け取ってみてください。あなたの影の頑張りを全て見ています。',
      image: '/img/img03.png',
      alt: 'Letters'
    }
  ]

  return (
    <section id="features" className="py-24 px-6 bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-4xl font-bold pb-24 leading-relaxed text-white text-center">自分に集中するための設計</h2>
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
                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium tracking-[0.15em]">
                      クリックで拡大
                    </span>
                  </div>
                </div>
              </div>

              {/* 説明 */}
              <div className="w-full md:w-2/5 space-y-6">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-4">
                    {screenshot.title}
                  </h3>
                  <p className="text-lg text-gray-300 leading-relaxed tracking-[0.15em]">
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
    <section id="about" className="py-20 px-6 bg-gray-950">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-white">
        Shonin（証人）とは
        </h2>
        <div className="text-center">
          {/* 左: Shoninの意味 */}
          <div className="p-5 rounded-2xl border-gray-700 shadow-sm">
            <p className="text-2xl text-gray-300 max-w-5xl mx-auto leading-relaxed tracking-[0.15em]">
            誰も見ていないところで人は成長する。<br />
            Shoninはあなたの努力の証人となる。
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
    <section id="price" className="py-24 px-6 bg-gray-900">
      <div className="max-w-8xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16 text-white">
          料金プラン
        </h2>
        <div className="grid md:grid-cols-3 gap-4 max-w-7xl mx-auto">
          {/* Freeプラン */}
          <div className="bg-gray-800 rounded-2xl border-2 border-gray-700 overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="text-xl font-semibold text-white mb-2">Starter</div>
                <div className="text-5xl font-bold text-white mb-2">
                  $4.99<span className="text-sm text-white font-normal">/month</span>
                  </div>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-white">目標追加</span>
                  <span className="text-white font-medium">1つ</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-white">カレンダー表示</span>
                  <span className="text-white font-medium">当月のみ</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-white">Shoninからの手紙</span>
                  <span className="text-white font-medium">—</span>
                </div>
              </div>

              <Link
                href="/ja/dashboard"
                className="block w-full py-4 text-center bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
              >
                無料で始める
              </Link>
            </div>
          </div>

          {/* Standardプラン */}
          <div className="bg-gray-800 rounded-2xl border-2 border-emerald-700 overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="text-xl font-semibold text-white mb-2">Standard</div>
                <div className="text-5xl font-bold text-emerald-500 mb-2">
                  $9.99<span className="text-sm text-white font-normal">/month</span>
                </div>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-white">目標追加</span>
                  <span className="text-emerald-500 font-medium">3つ</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-white">カレンダー表示</span>
                  <span className="text-emerald-500 font-medium">全期間</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-white">月1回、Shoninからの手紙</span>
                  <div className="w-6 h-6 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                  </div>
                </div>
              </div>

              <Link
                href="/ja/dashboard"
                className="block w-full py-4 text-center bg-emerald-700 text-white rounded-lg hover:bg-emerald-600 transition-colors duration-200 font-medium"
              >
                始める
              </Link>
            </div>
          </div>


          {/* Premiumプラン */}
          <div className="bg-gray-800 rounded-2xl border-2 border-gray-700 overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="text-xl font-semibold text-white mb-2">Premium</div>
                <div className="text-5xl font-bold text-white mb-2">
                  $14.99<span className="text-sm text-white font-normal">/month</span>
                  </div>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-white">目標追加</span>
                  <span className="text-white font-medium">無制限</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-white">カレンダー表示</span>
                  <span className="text-white font-medium">全期間</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-white">週1回、月1回のShoninからの手紙</span>
                  <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                  </div>
                </div>
              </div>

              <Link
                href="/ja/dashboard"
                className="block w-full py-4 text-center bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
              >
                無料で始める
              </Link>
            </div>
          </div>
        </div>
        
        {/* 注釈 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            ※ 基本的なタイマー、ログ機能、世界中の同士の表示などは全てのプランに含まれます。
          </p>
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
            <div className="space-x-3 mb-4">
              <div className="w-30 h-10 overflow-hidden bg-transparent">
                <img 
                  src="/logo.png" 
                  alt="Shonin Logo" 
                  className="h-full object-contain"
                />
              </div>
            </div>
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
                  const element = document.getElementById('price')
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
                  const element = document.getElementById('about')
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
