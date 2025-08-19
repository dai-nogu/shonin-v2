import { redirect } from 'next/navigation'

export default function HomePage() {
  // middlewareで認証済みユーザーは既に/dashboardにリダイレクトされる
  // 未認証ユーザーは/loginにリダイレクトされる
  // このページに到達することは通常ない
  redirect('/dashboard')
} 