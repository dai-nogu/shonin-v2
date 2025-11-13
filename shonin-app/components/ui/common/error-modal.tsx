"use client"

import { AlertCircle } from "lucide-react"
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/common/dialog"

interface ErrorModalProps {
  isOpen: boolean
  onClose: () => void
  message: string
}

export function ErrorModal({ isOpen, onClose, message }: ErrorModalProps) {
  const t = useTranslations()
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="bg-white border-gray-300 text-gray-900 max-w-md [&>button]:focus-visible:outline-none [&>button]:focus:outline-none [&>button]:active:bg-transparent"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          {/* エラーメッセージを赤文字で表示（DialogTitleとして） */}
          <DialogTitle className="text-center text-xl text-red-600 font-semibold">
            {message}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-700 mt-6">
            {t('common.reload_and_retry')}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

