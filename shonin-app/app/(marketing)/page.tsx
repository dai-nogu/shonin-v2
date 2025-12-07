'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

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
    <div className="min-h-screen bg-[#fcfbf9] text-gray-800">
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#fcfbf9]/90 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* ロゴ */}
        <div className="text-2xl font-bold tracking-tight">
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
                  ? 'text-emerald-700 font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* ログインボタン */}
        <Link
          href="/ja/login"
          className="px-6 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors duration-200 text-sm font-medium"
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
    <section id="hero" className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
          あなたの成長を<br />見つめ、証明する
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed">
          Be a witness to your growth.
        </p>
        <p className="text-lg text-gray-700 mb-12 max-w-2xl mx-auto leading-relaxed">
          日々の努力を記録し、可視化することで<br />
          成長の実感と継続のモチベーションを育みます
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/ja/dashboard"
            className="px-8 py-4 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors duration-200 text-lg font-medium"
          >
            無料で始める
          </Link>
          <button
            onClick={() => {
              const element = document.getElementById('origin')
              if (element) element.scrollIntoView({ behavior: 'smooth' })
            }}
            className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors duration-200 text-lg font-medium"
          >
            詳しく見る
          </button>
        </div>
      </div>
    </section>
  )
}

// スクリーンショットセクション
function ScreenshotSection() {
  return (
    <section id="screenshot" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16">
          シンプルで美しいインターフェース
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-[3/4] bg-gray-100 rounded-2xl border-2 border-gray-200 flex items-center justify-center"
            >
              <span className="text-gray-400 text-lg">スクリーンショット {i}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Originセクション
function OriginSection() {
  return (
    <section id="origin" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16">
          名前の由来
        </h2>
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* 左: Shoninの意味 */}
          <div className="bg-white p-10 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-2xl font-bold mb-6">Shonin（証人）</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              「証人」とは、ある出来事や事実を直接見聞きし、それを証明できる存在のこと。
            </p>
            <p className="text-gray-700 leading-relaxed">
              このアプリは、あなたが日々積み重ねる努力の証人となり、<br />
              その成長を記録し、証明します。
            </p>
          </div>

          {/* 右: コンセプト */}
          <div className="bg-white p-10 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-2xl font-bold mb-6">コンセプト</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              努力は孤独なもの。誰にも言わず、ひっそりと頑張り続けることもあるでしょう。
            </p>
            <p className="text-gray-700 leading-relaxed">
              でも、本当は誰かに認めてもらいたい。<br />
              Shoninは、そんなあなたの努力を見守り、<br />
              成長の道標となる存在です。
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
    <section id="pricing" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16">
          料金プラン
        </h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* フリープラン */}
          <div className="bg-[#fcfbf9] p-10 rounded-2xl border-2 border-gray-200">
            <h3 className="text-2xl font-bold mb-4">フリープラン</h3>
            <div className="text-4xl font-bold mb-6">
              ¥0<span className="text-lg text-gray-600 font-normal">/月</span>
            </div>
            <ul className="space-y-3 mb-8 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-700 mt-1">✓</span>
                <span>基本的な時間記録機能</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-700 mt-1">✓</span>
                <span>カレンダー表示</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-700 mt-1">✓</span>
                <span>目標設定（3つまで）</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-700 mt-1">✓</span>
                <span>基本的な統計機能</span>
              </li>
            </ul>
            <Link
              href="/ja/dashboard"
              className="block w-full py-3 text-center border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              無料で始める
            </Link>
          </div>

          {/* プレミアムプラン */}
          <div className="bg-emerald-50 p-10 rounded-2xl border-2 border-emerald-700 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-700 text-white text-sm font-medium rounded-full">
              おすすめ
            </div>
            <h3 className="text-2xl font-bold mb-4">プレミアムプラン</h3>
            <div className="text-4xl font-bold mb-6">
              ¥980<span className="text-lg text-gray-600 font-normal">/月</span>
            </div>
            <ul className="space-y-3 mb-8 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-700 mt-1">✓</span>
                <span>フリープランの全機能</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-700 mt-1">✓</span>
                <span>無制限の目標設定</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-700 mt-1">✓</span>
                <span>AIによる週次・月次メッセージ</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-700 mt-1">✓</span>
                <span>画像・動画・音声アップロード</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-700 mt-1">✓</span>
                <span>高度な分析機能</span>
              </li>
            </ul>
            <Link
              href="/ja/dashboard"
              className="block w-full py-3 text-center bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors duration-200 font-medium"
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
    <footer className="py-12 px-6 border-t border-gray-200">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          {/* ロゴとコピーライト */}
          <div className="md:col-span-2">
            <div className="text-2xl font-bold mb-4">Shonin</div>
            <p className="text-gray-600 text-sm mb-4">
              Be a witness to your growth.
            </p>
            <p className="text-gray-500 text-sm">
              © 2025 Shonin. All rights reserved.
            </p>
          </div>

          {/* プロダクト */}
          <div>
            <h4 className="font-bold mb-3">プロダクト</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/ja/dashboard" className="hover:text-gray-900 transition-colors">
                  ダッシュボード
                </Link>
              </li>
              <li>
                <button onClick={() => {
                  const element = document.getElementById('pricing')
                  if (element) element.scrollIntoView({ behavior: 'smooth' })
                }} className="hover:text-gray-900 transition-colors">
                  料金プラン
                </button>
              </li>
            </ul>
          </div>

          {/* 会社情報 */}
          <div>
            <h4 className="font-bold mb-3">会社情報</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <button onClick={() => {
                  const element = document.getElementById('origin')
                  if (element) element.scrollIntoView({ behavior: 'smooth' })
                }} className="hover:text-gray-900 transition-colors">
                  私たちについて
                </button>
              </li>
              <li>
                <a href="#" className="hover:text-gray-900 transition-colors">
                  プライバシーポリシー
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-900 transition-colors">
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
