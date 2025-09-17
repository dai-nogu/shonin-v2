'use client'

import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { Button } from './button'

interface LanguageSwitcherProps {
  currentLocale: string
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()

  const switchLanguage = (locale: string) => {
    // パスの最初のロケール部分を新しいロケールに置き換える
    const segments = pathname.split('/')
    segments[1] = locale
    const newPath = segments.join('/')
    router.push(newPath)
  }

  return (
    <div className="flex gap-2">
      <Button
        variant={currentLocale === 'ja' ? 'default' : 'outline'}
        size="sm"
        onClick={() => switchLanguage('ja')}
      >
        日本語
      </Button>
      <Button
        variant={currentLocale === 'en' ? 'default' : 'outline'}
        size="sm"
        onClick={() => switchLanguage('en')}
      >
        English
      </Button>
    </div>
  )
} 