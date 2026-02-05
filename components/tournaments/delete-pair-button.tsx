'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface DeletePairButtonProps {
  pairId: string
  onSuccess?: () => void
}

export function DeletePairButton({ pairId, onSuccess }: DeletePairButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta pareja del torneo?')) {
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('pairs')
        .delete()
        .eq('id', pairId)

      if (error) throw error

      // Success! Reload tournament data
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      console.error('Error deleting pair:', err)
      alert('Error al eliminar la pareja: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
    >
      {loading ? (
        <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )}
    </Button>
  )
}
