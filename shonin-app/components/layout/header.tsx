import { MobileMenu } from "@/components/layout/mobile-menu"

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
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <h1 className="text-xl font-bold text-white">SHONIN</h1>
        </div>
        
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
