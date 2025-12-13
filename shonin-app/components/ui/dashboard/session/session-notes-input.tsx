"use client"

import { memo, RefObject } from "react"
import { Textarea } from "@/components/ui/common/textarea"
import { CharacterCounter } from "@/components/ui/common/character-counter"

interface SessionNotesInputProps {
  notes: string
  setNotes: (notes: string) => void
  notesPlaceholder: string
  maxLength: number
  notesRef?: RefObject<HTMLTextAreaElement>
}

export const SessionNotesInput = memo(function SessionNotesInput({
  notes,
  setNotes,
  notesPlaceholder,
  maxLength,
  notesRef
}: SessionNotesInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end mb-2">
        <CharacterCounter current={notes.length} max={maxLength} />
      </div>
      <Textarea
        ref={notesRef}
        placeholder={notesPlaceholder}
        value={notes}
        onChange={(e) => setNotes(e.target.value.slice(0, maxLength))}
        maxLength={maxLength}
        className="bg-secondary/20 border-white/10 min-h-[120px] focus-visible:ring-primary resize-none text-base"
      />
    </div>
  )
})

