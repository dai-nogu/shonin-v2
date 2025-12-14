import { MobileMenu } from "@/components/layout/mobile-menu"
import { ActiveUsersBadge } from "@/components/ui/marketing/active-users-badge"

interface HeaderProps {
  currentPage?: string
  onPageChange?: (pageId: string) => void
}

export function Header({ 
  currentPage = "dashboard", 
  onPageChange
}: HeaderProps) {
  return (
    <header className="border-b border-gray-800 bg-gray-950">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-emerald-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">?</span>
          </div>
          <h1 className="text-xl font-bold text-white">Shonin</h1>
        </div>
        
        {/* アクティブユーザー数バッジ */}
        <ActiveUsersBadge />
        
        {/* SP専用：ハンバーガーメニュー（ボトムナビゲーション実装により非表示） */}
        {/* {onPageChange && (
          <div className="md:hidden">
            <MobileMenu currentPage={currentPage} onPageChange={onPageChange} />
          </div>
        )} */}
      </div>
    </header>
  )
}
