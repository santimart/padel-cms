'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trophy } from 'lucide-react'
import { PlayoffPreviewDialog } from '@/components/tournaments/playoff-preview-dialog'

interface GeneratePlayoffsButtonProps {
  tournamentId: string
  onSuccess: () => void
  allMatchesCompleted?: boolean
}

export function GeneratePlayoffsButton({ tournamentId, onSuccess, allMatchesCompleted = true }: GeneratePlayoffsButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button 
        size="lg" 
        className="gap-2" 
        disabled={!allMatchesCompleted}
        onClick={() => setOpen(true)}
      >
        <Trophy className="h-5 w-5" />
        Generar Playoffs
      </Button>

      <PlayoffPreviewDialog
        tournamentId={tournamentId}
        open={open}
        onOpenChange={setOpen}
        onSuccess={onSuccess}
      />
    </>
  )
}
