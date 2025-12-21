"use client"

import { memo, RefObject } from "react"
import { Camera, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/common/button"
import { Label } from "@/components/ui/common/label"
import { useTranslations } from 'next-intl'

interface SessionPhotoUploadProps {
  photos: File[]
  showPhotoAccordion: boolean
  setShowPhotoAccordion: (show: boolean) => void
  onPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onPhotoRemove: (index: number) => void
  onPhotoButtonClick: () => void
  fileInputRef: RefObject<HTMLInputElement>
}

export const SessionPhotoUpload = memo(function SessionPhotoUpload({
  photos,
  showPhotoAccordion,
  setShowPhotoAccordion,
  onPhotoUpload,
  onPhotoRemove,
  onPhotoButtonClick,
  fileInputRef
}: SessionPhotoUploadProps) {
  const t = useTranslations()

  return (
    <div className="border-t border-white/5">
      {/* 隠しファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,image/heic,image/heif"
        capture="environment"
        multiple
        onChange={onPhotoUpload}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => setShowPhotoAccordion(!showPhotoAccordion)}
        className="flex items-center space-x-2 text-left group w-full"
      >
        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
          <Plus className={`w-4 h-4 text-gray-400 group-hover:text-white transition-all duration-200 ${showPhotoAccordion ? 'rotate-45' : ''}`} />
        </div>
        <Label className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
          {t('active_session.photos_label')}
        </Label>
        {photos.length > 0 && (
          <span className="ml-2 bg-emerald-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
            {photos.length}
          </span>
        )}
      </button>

      {/* 写真アップロードエリア */}
      {showPhotoAccordion && (
        <div className="mt-4 space-y-4 animate-in fade-in duration-300">
          {/* アップロードされた写真のプレビュー */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <div key={`pending-${index}`} className="relative group rounded-lg overflow-hidden shadow-md">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={t('active_session.photo_alt', { number: index + 1 })}
                    className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <Button
                    onClick={() => onPhotoRemove(index)}
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={onPhotoButtonClick}
            variant="outline"
            className="w-full h-12 border-dashed border-2 hover:bg-secondary"
          >
            <Camera className="w-5 h-5 mr-2" />
            {photos.length > 0 ? t('active_session.add_photos') : t('active_session.select_photos')}
          </Button>
        </div>
      )}
    </div>
  )
})

