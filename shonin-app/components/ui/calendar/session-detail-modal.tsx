"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/common/dialog"
import { Button } from "@/components/ui/common/button"
import { formatDuration } from "@/lib/format-duration"
import type { CalendarSession } from "@/lib/calendar-utils"

interface SessionDetailModalProps {
  isOpen: boolean
  onClose: () => void
  date: string
  sessions: CalendarSession[]
}

export function SessionDetailModal({ 
  isOpen, 
  onClose, 
  date, 
  sessions 
}: SessionDetailModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90%] sm:max-w-[500px] bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">{date}の行動</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-4 max-h-[60vh] overflow-y-auto">
          {sessions.map((session) => (
            <div 
              key={session.id} 
              className={`p-3 rounded-lg ${session.color} bg-opacity-20 border-opacity-30`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{session.icon}</span>
                <span className="text-white font-medium">{session.activity}</span>
              </div>
              <div className="mt-1 text-gray-400 text-sm">
                {formatDuration(session.duration)}
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              この日はアクティビティがありません
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white"
          >
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 