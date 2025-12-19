import type React from "react"
import { Metadata } from 'next'

interface MarketingLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  
  if (locale === 'ja') {
    return {
      title: 'Shonin - あなたの成長を見つめ、証明する',
      description: 'Be a witness to your growth. 日々の努力を記録・可視化し、成長の実感を促進するアプリ',
      openGraph: {
        title: 'Shonin - あなたの成長を見つめ、証明する',
        description: 'Be a witness to your growth. 日々の努力を記録・可視化し、成長の実感を促進するアプリ',
        type: 'website',
      },
    }
  }
  
  return {
    title: 'Shonin - Be a witness to your growth',
    description: 'Record and visualize your daily efforts to promote a sense of growth and achievement.',
    openGraph: {
      title: 'Shonin - Be a witness to your growth',
      description: 'Record and visualize your daily efforts to promote a sense of growth and achievement.',
      type: 'website',
    },
  }
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return <>{children}</>
}
