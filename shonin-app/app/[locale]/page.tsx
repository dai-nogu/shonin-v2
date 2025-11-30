import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  // 認証状態に応じてダッシュボードにリダイレクト
  redirect(`/${locale}/dashboard`)
} 