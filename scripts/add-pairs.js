#!/usr/bin/env node

/**
 * Script to add 12 pairs to a tournament
 * Usage: node scripts/add-pairs.js <tournament-id>
 * Example: node scripts/add-pairs.js 33c6be12-c45c-4eda-aac7-2ad542846588
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const fs = require('fs')

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      process.env[key] = value
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found in environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addPairsToTournament(tournamentId) {
  try {
    console.log(`\n🎾 Adding 12 pairs to tournament: ${tournamentId}\n`)

    // 1. Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, name, complex_id, category, gender')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      throw new Error(`Tournament not found: ${tournamentId}`)
    }

    console.log(`✅ Tournament: ${tournament.name}`)
    console.log(`   Category: ${tournament.category}, Gender: ${tournament.gender}`)

    // 2. Get available players from global database
    // Players are global (shared across all complexes)
    // Filter by gender and category
    let query = supabase
      .from('players')
      .select('id, first_name, last_name, gender, current_category')
      .gte('current_category', tournament.category - 1)
      .lte('current_category', tournament.category + 1)

    // Filter by gender (unless tournament is Mixto)
    if (tournament.gender !== 'Mixto') {
      query = query.eq('gender', tournament.gender)
    }

    const { data: players, error: playersError } = await query.limit(24)

    if (playersError) throw playersError

    if (!players || players.length < 24) {
      throw new Error(`Not enough players found. Need 24, found ${players?.length || 0}`)
    }

    console.log(`✅ Found ${players.length} eligible players`)

    // 3. Shuffle players for random pairing
    const shuffled = players.sort(() => Math.random() - 0.5)

    // 4. Create 12 pairs
    const pairsToCreate = []
    for (let i = 0; i < 12; i++) {
      pairsToCreate.push({
        tournament_id: tournamentId,
        player1_id: shuffled[i * 2].id,
        player2_id: shuffled[i * 2 + 1].id,
      })
    }

    const { data: createdPairs, error: pairsError } = await supabase
      .from('pairs')
      .insert(pairsToCreate)
      .select(`
        id,
        player1:players!pairs_player1_id_fkey(first_name, last_name, current_category),
        player2:players!pairs_player2_id_fkey(first_name, last_name, current_category)
      `)

    if (pairsError) throw pairsError

    console.log(`\n✅ Successfully created ${createdPairs.length} pairs:\n`)

    createdPairs.forEach((pair, index) => {
      console.log(`${index + 1}. ${pair.player1.first_name} ${pair.player1.last_name} (Cat ${pair.player1.current_category}) / ${pair.player2.first_name} ${pair.player2.last_name} (Cat ${pair.player2.current_category})`)
    })

    console.log(`\n🎉 Done! Tournament now has ${createdPairs.length} pairs ready.`)
    console.log(`   You can now generate zones at: http://localhost:3000/tournaments/${tournamentId}\n`)

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

// Get tournament ID from command line
const tournamentId = process.argv[2]

if (!tournamentId) {
  console.error('❌ Error: Tournament ID is required')
  console.error('Usage: node scripts/add-pairs.js <tournament-id>')
  console.error('Example: node scripts/add-pairs.js 33c6be12-c45c-4eda-aac7-2ad542846588')
  process.exit(1)
}

// Run the script
addPairsToTournament(tournamentId)
