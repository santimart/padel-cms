import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PublicRankingView } from '@/components/public/public-ranking-view'

interface RankingPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PublicRankingPage({ params }: RankingPageProps) {
  const { id } = await params
  const supabase: any = await createClient()

  // Fetch ranking definition
  const { data: ranking } = await supabase
    .from('ranking_definitions')
    .select(`
      id,
      name,
      category,
      complex_id,
      complexes (
        name,
        logo_url
      )
    `)
    .eq('id', id)
    .single()

  if (!ranking) {
    notFound()
  }

  // Fetch leaderboard
  const { data: leaderboard } = await supabase
    .from('rankings')
    .select(`
      id,
      total_points,
      tournaments_played,
      player:players(
        id,
        first_name,
        last_name,
        photo_url,
        gender
      )
    `)
    .eq('ranking_definition_id', id)
    .order('total_points', { ascending: false })

  return (
    <PublicRankingView 
      ranking={ranking} 
      leaderboard={leaderboard || []} 
    />
  )
}
