'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { updatePlayerRankings } from '@/lib/actions/rankings'

export async function finishTournament(tournamentId: string) {
  const supabase: any = await createClient()

  // 1. Check if tournament can be finished? 
  // (Optional: check if all matches are completed. For now, we trust the admin)

  // 2. Update status
  const { error } = await supabase
    .from('tournaments')
    .update({ status: 'finished' })
    .eq('id', tournamentId)

  if (error) throw new Error(error.message)

  // 3. Update rankings
  try {
    await updatePlayerRankings(tournamentId)
  } catch (rankingError) {
    console.error('Error updating rankings:', rankingError)
    // We don't rollback status, but we log error. 
    // Maybe we should throw so UI shows error, but status is already 'finished'.
    // Ideally use transaction if possible, but spanning actions is hard.
    // For now, we assume ranking calculation is robust or can be retried.
    throw new Error('Torneo finalizado pero hubo un error actualizando el ranking.')
  }

  revalidatePath(`/tournaments/${tournamentId}`)
  revalidatePath('/rankings')
}

