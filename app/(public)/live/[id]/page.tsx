import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { LiveBoard } from '@/components/public/live-board'
import { LiveLayout } from '@/components/public/live-layout'

interface LivePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function LiveTournamentPage({ params }: LivePageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  // Fetch tournament details
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('name') // Only need name for the layout
    .eq('id', id)
    .single()

  if (!tournament) {
    notFound()
  }

  return (
    <LiveLayout tournament={tournament}>
      <LiveBoard tournamentId={id} />
    </LiveLayout>
  )
}
