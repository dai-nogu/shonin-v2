import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/common/button"

interface ModalPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems: number
  itemsPerPage: number
  className?: string
}

export function ModalPagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems, 
  itemsPerPage,
  className = ""
}: ModalPaginationProps) {
  if (totalPages <= 1) return null

  const startIndex = (currentPage - 1) * itemsPerPage

  return (
    <div className={`mt-3 sm:mt-6 pt-2 sm:pt-4 border-t border-gray-800 ${className}`}>
      <div className="flex items-center justify-center space-x-2 sm:space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 disabled:opacity-50 px-3 sm:px-3"
        >
          <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>

        <div className="flex items-center space-x-2">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number
            if (totalPages <= 5) {
              pageNum = i + 1
            } else if (currentPage <= 3) {
              pageNum = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = currentPage - 2 + i
            }

            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className={
                  currentPage === pageNum
                    ? "bg-green-600 hover:bg-green-700 px-3 sm:px-3 text-xs sm:text-sm min-w-[32px]"
                    : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 px-3 sm:px-3 text-xs sm:text-sm min-w-[32px]"
                }
              >
                {pageNum}
              </Button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 disabled:opacity-50 px-3 sm:px-3"
        >
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
      </div>
      
      <div className="text-center mt-2">
        <span className="text-xs sm:text-sm text-gray-400">
          {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalItems)} / {totalItems}
        </span>
      </div>
    </div>
  )
} 