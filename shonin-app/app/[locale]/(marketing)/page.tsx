'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { X, Globe } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter, usePathname } from 'next/navigation'

export default function HomePage() {
  const [activeSection, setActiveSection] = useState('top')
  const t = useTranslations('marketing')
  const params = useParams()
  const locale = params.locale as string

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
      <Header activeSection={activeSection} scrollToSection={scrollToSection} locale={locale} />

      {/* Hero Section */}
      <HeroSection />

      {/* Screenshot Section */}
      <ScreenshotSection />

      {/* Origin Section */}
      <OriginSection />

      {/* Pricing Section */}
      <PricingSection locale={locale} />

      {/* Footer */}
      <Footer locale={locale} />
    </div>
  )
}

// ヘッダーコンポーネント
function Header({ 
  activeSection, 
  scrollToSection,
  locale 
}: { 
  activeSection: string
  scrollToSection: (id: string) => void
  locale: string
}) {
  const t = useTranslations('marketing.header')
  const router = useRouter()
  const pathname = usePathname()
  const [showLangMenu, setShowLangMenu] = useState(false)
  
  const switchLanguage = (newLocale: string) => {
    if (!pathname) return
    const segments = pathname.split('/')
    segments[1] = newLocale
    const newPath = segments.join('/')
    router.push(newPath)
    setShowLangMenu(false)
  }
  
  // 外部クリックでメニューを閉じる
  useEffect(() => {
    const handleClickOutside = () => {
      if (showLangMenu) {
        setShowLangMenu(false)
      }
    }
    
    if (showLangMenu) {
      document.addEventListener('click', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showLangMenu])
  
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

        {/* 右側のボタングループ */}
        <div className="flex items-center gap-3">
          {/* 言語切り替えボタン */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowLangMenu(!showLangMenu)
              }}
              className="p-2 text-gray-300 hover:text-white transition-colors duration-200"
              aria-label="言語切り替え"
            >
              <Globe className="w-5 h-5" />
            </button>
            {showLangMenu && (
              <div 
                className="absolute right-0 mt-2 w-32 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => switchLanguage('ja')}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors ${
                    locale === 'ja' ? 'bg-gray-700 text-emerald-400' : 'text-gray-300'
                  }`}
                >
                  日本語
                </button>
                <button
                  onClick={() => switchLanguage('en')}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors ${
                    locale === 'en' ? 'bg-gray-700 text-emerald-400' : 'text-gray-300'
                  }`}
                >
                  English
                </button>
              </div>
            )}
          </div>
          
          {/* ログインボタン */}
          <Link
            href={`/${locale}/login`}
            className="px-6 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-600 transition-colors duration-200 text-sm font-medium tracking-[0.15em]"
          >
            {t('login')}
          </Link>
        </div>
      </div>
    </header>
  )
}

// Heroセクション
function HeroSection() {
  const t = useTranslations('marketing.hero')
  
  return (
    <section id="top" className="pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:font-size: 3.5rem; font-bold leading-relaxed text-white">{t('title')}</h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed tracking-[0.15em]">
          {t('subtitle')}
        </p>
      </div>
    </section>
  )
}

// スクリーンショットセクション
function ScreenshotSection() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const t = useTranslations('marketing.features')

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setSelectedImage(null)
      setIsClosing(false)
    }, 300)
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
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [selectedImage])

  const screenshots = [
    {
      title: t('feature1.title'),
      description: t('feature1.description'),
      image: '/img/img01.png',
      alt: 'Deep work'
    },
    {
      title: t('feature2.title'),
      description: t('feature2.description'),
      image: '/img/img02.png',
      alt: 'add Goal'
    },
    {
      title: t('feature3.title'),
      description: t('feature3.description'),
      image: '/img/img03.png',
      alt: 'Letters'
    }
  ]

  return (
    <section id="features" className="py-24 px-6 bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-4xl font-bold pb-24 leading-relaxed text-white text-center">{t('title')}</h2>
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
                  className="relative rounded-2xl border-2 border-gray-700 hover:border-emerald-700 transition-all duration-300 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl group"
                  onClick={() => setSelectedImage(i)}
                >
                  <img
                    src={screenshot.image}
                    alt={screenshot.alt}
                    className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
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
                      {t('clickToEnlarge')}
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
  const t = useTranslations('marketing.about')
  
  return (
    <section id="about" className="py-20 px-6 bg-gray-950">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-white">
          {t('title')}
        </h2>
        <div className="text-center">
          <div className="p-5 rounded-2xl border-gray-700 shadow-sm">
            <p 
              className="text-2xl text-gray-300 max-w-5xl mx-auto leading-relaxed tracking-[0.15em]"
              dangerouslySetInnerHTML={{ __html: t('description') }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// Pricingセクション
function PricingSection({ locale }: { locale: string }) {
  const [isYearly, setIsYearly] = useState(false)
  const t = useTranslations('marketing.pricing')
  
  return (
    <section id="price" className="py-24 px-6 bg-gray-900">
      <div className="max-w-8xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-4 text-white">
          {t('title')}
        </h2>
        <p className="text-center text-gray-400 mb-8">{t('subtitle')}</p>
        
        {/* 年額/月額切り替えボタン */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-lg ${!isYearly ? 'text-white' : 'text-gray-500'}`}>{t('monthly')}</span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={`relative w-16 h-8 rounded-full transition-colors duration-200 ${
              isYearly ? 'bg-emerald-700' : 'bg-gray-600'
            }`}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                isYearly ? 'translate-x-9' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-lg ${isYearly ? 'text-emerald-400' : 'text-gray-500'}`}>{t('yearly')}</span>
        </div>

        <div className="grid md:grid-cols-3 gap-4 max-w-7xl mx-auto">
          {/* Starterプラン */}
          <div className="bg-gray-800 rounded-2xl border-2 border-gray-700 overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="text-xl font-semibold text-white mb-2">{t('starter.name')}</div>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-5xl font-bold text-white">{t('starter.price_monthly')}</span>
                  <span className="text-sm text-white font-normal">{t('starter.per_month')}</span>
                </div>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-white">{t('features.goals')}</span>
                  <span className="text-white font-medium">{t('starter.goal_limit')}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-white">{t('features.calendar')}</span>
                  <span className="text-white font-medium">{t('starter.calendar')}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-white">{t('features.letters')}</span>
                  <span className="text-white font-medium">{t('starter.letters')}</span>
                </div>
              </div>

              <Link
                href={`/${locale}/dashboard`}
                className="block w-full py-4 text-center bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
              >
                {t('starter.cta')}
              </Link>
            </div>
          </div>

          {/* Standardプラン */}
          <div className="bg-gray-800 rounded-2xl border-2 border-emerald-700 overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="text-xl font-semibold text-white mb-2">{t('standard.name')}</div>
                {isYearly ? (
                  <>
                    <div className="flex items-baseline justify-center gap-2 mb-2">
                      <span className="text-5xl font-bold text-emerald-500">{t('standard.price_yearly')}</span>
                      <span className="text-sm text-white font-normal">{t('standard.per_year')}</span>
                      <span className="text-lg text-gray-400 line-through">{t('standard.original_yearly')}</span>
                    </div>
                    <div className="inline-block text-xs bg-emerald-700/20 text-emerald-400 px-2.5 py-1 rounded-full font-medium">
                      {t('yearly_savings')}
                    </div>
                  </>
                ) : (
                  <div className="text-5xl font-bold text-emerald-500 mb-2">
                    {t('standard.price_monthly')}<span className="text-sm text-white font-normal">{t('standard.per_month')}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-white">{t('features.goals')}</span>
                  <span className="text-emerald-500 font-medium">{t('standard.goal_limit')}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-white">{t('features.calendar')}</span>
                  <span className="text-emerald-500 font-medium">{t('standard.calendar')}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-white">{t('standard.letters')}</span>
                  <div className="w-6 h-6 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                  </div>
                </div>
              </div>

              <Link
                href={`/${locale}/dashboard`}
                className="block w-full py-4 text-center bg-emerald-700 text-white rounded-lg hover:bg-emerald-600 transition-colors duration-200 font-medium"
              >
                {t('standard.cta')}
              </Link>
            </div>
          </div>

          {/* Premiumプラン */}
          <div className="bg-gray-800 rounded-2xl border-2 border-gray-700 overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="text-xl font-semibold text-white mb-2">{t('premium.name')}</div>
                {isYearly ? (
                  <>
                    <div className="flex items-baseline justify-center gap-2 mb-2">
                      <span className="text-5xl font-bold text-white">{t('premium.price_yearly')}</span>
                      <span className="text-sm text-white font-normal">{t('premium.per_year')}</span>
                      <span className="text-lg text-gray-400 line-through">{t('premium.original_yearly')}</span>
                    </div>
                    <div className="inline-block text-xs bg-gray-700/50 text-white px-2.5 py-1 rounded-full font-medium">
                      {t('yearly_savings')}
                    </div>
                  </>
                ) : (
                  <div className="text-5xl font-bold text-white mb-2">
                    {t('premium.price_monthly')}<span className="text-sm text-white font-normal">{t('premium.per_month')}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-white">{t('features.goals')}</span>
                  <span className="text-white font-medium">{t('premium.goal_limit')}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-white">{t('features.calendar')}</span>
                  <span className="text-white font-medium">{t('premium.calendar')}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-white">{t('premium.letters')}</span>
                  <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                  </div>
                </div>
              </div>

              <Link
                href={`/${locale}/dashboard`}
                className="block w-full py-4 text-center bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
              >
                {t('premium.cta')}
              </Link>
            </div>
          </div>
        </div>
        
        {/* 注釈 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            {t('note')}
          </p>
        </div>
      </div>
    </section>
  )
}

// Footerコンポーネント
function Footer({ locale }: { locale: string }) {
  const t = useTranslations('marketing.footer')
  
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
              {t('tagline')}
            </p>
            <p className="text-gray-500 text-sm">
              {t('copyright')}
            </p>
          </div>

          {/* プロダクト */}
          <div>
            <h4 className="font-bold mb-3 text-white">{t('product')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href={`/${locale}/dashboard`} className="hover:text-white transition-colors">
                  {t('dashboard')}
                </Link>
              </li>
              <li>
                <button onClick={() => {
                  const element = document.getElementById('price')
                  if (element) element.scrollIntoView({ behavior: 'smooth' })
                }} className="hover:text-white transition-colors">
                  {t('pricing')}
                </button>
              </li>
            </ul>
          </div>

          {/* 会社情報 */}
          <div>
            <h4 className="font-bold mb-3 text-white">{t('company')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <button onClick={() => {
                  const element = document.getElementById('about')
                  if (element) element.scrollIntoView({ behavior: 'smooth' })
                }} className="hover:text-white transition-colors">
                  {t('about')}
                </button>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t('privacy')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t('terms')}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
