import type { Pair } from '@/lib/types'

interface Match {
  id: string
  pair1_id: string
  pair2_id: string
  zone_id: string | null
}

interface SchedulingConfig {
  startDate: Date
  endDate: Date
  dailyStartTime: string // "09:00"
  dailyEndTime: string // "21:00"
  matchDurationMinutes: number
  availableCourts: number // Number of courts available
}

interface ScheduledMatch {
  matchId: string
  scheduledTime: Date
  courtNumber: number
}

/**
 * Schedules matches across tournament days and courts
 * Respects APA/FAP rule: minimum 1 hour rest between matches for same pair
 */
export function scheduleMatches(
  matches: Match[],
  pairs: Pair[],
  config: SchedulingConfig
): ScheduledMatch[] {
  const scheduledMatches: ScheduledMatch[] = []
  const pairLastMatchTime = new Map<string, Date>()
  
  // Calculate available slots per day
  const slotsPerDay = calculateDailySlotsAvailable(
    config.dailyStartTime,
    config.dailyEndTime,
    config.matchDurationMinutes
  )
  
  // Get all tournament days
  const tournamentDays = getTournamentDays(config.startDate, config.endDate)
  
  // Track court usage: Map<"YYYY-MM-DD HH:MM", Set<courtNumber>>
  const courtUsage = new Map<string, Set<number>>()
  
  // Sort matches by round priority (R32 -> R16 -> QF -> SF -> F)
  const roundPriority: Record<string, number> = {
    'R32': 1,
    'R16': 2,
    'QF': 3,
    'SF': 4,
    'F': 5
  }

  const sortedMatches = [...matches].sort((a, b) => {
    // If running from API, 'round' might be present in the match object even if not in type definition yet
    // because we cast 'matchesToSchedule as any' in the route
    const roundA = (a as any).round
    const roundB = (b as any).round
    
    if (roundA && roundB) {
      return (roundPriority[roundA] || 0) - (roundPriority[roundB] || 0)
    }
    return 0
  })
  
  // Keep track of the latest scheduled time for each round to ensure
  // next round starts AFTER previous round finishes
  const roundLastScheduledTime = new Map<string, Date>()

  for (const match of sortedMatches) {
    let scheduled = false
    const matchRound = (match as any).round
    
    // Determine minimum start time based on previous round
    let minStartTime: Date | null = null
    if (matchRound) {
      const prevRoundPriority = (roundPriority[matchRound] || 0) - 1
      const prevRound = Object.keys(roundPriority).find(key => roundPriority[key] === prevRoundPriority)
      
      if (prevRound) {
        // Find the latest time scheduled for the previous round
        // We want to start next round at least after that (or next day)
        // Ideally we'd look at specifically the feeding matches, but global round layering is safer/easier
         const prevRoundTime = roundLastScheduledTime.get(prevRound)
         if (prevRoundTime) {
            // Start at least 2 hours after the LAST match of the previous round 
            // This is a loose heuristic to avoid "Round 2 starts before Round 1 ends"
            minStartTime = new Date(prevRoundTime.getTime() + 120 * 60000) 
         }
      }
    }
    
    // Try each day
    for (let dayIndex = 0; dayIndex < tournamentDays.length && !scheduled; dayIndex++) {
      const currentDay = tournamentDays[dayIndex]
      
      // If we have a min start time (e.g. from previous round), skip days before that
      if (minStartTime && currentDay < new Date(minStartTime.setHours(0,0,0,0))) {
        continue
      }

      // Try each time slot
      for (let slotIndex = 0; slotIndex < slotsPerDay.length && !scheduled; slotIndex++) {
        const slotTime = slotsPerDay[slotIndex]
        const matchTime = combineDateAndTime(currentDay, slotTime)
        
        // Check if this time matches our minimum start time requirement
        if (minStartTime && matchTime < minStartTime) {
             continue
        }

        // Check if both pairs have sufficient rest (only if pairs are known)
        let restCheckPassed = true
        if (match.pair1_id && pairLastMatchTime.has(match.pair1_id)) {
             const lastTime = pairLastMatchTime.get(match.pair1_id)!
             if (getMinutesDifference(lastTime, matchTime) < 60) restCheckPassed = false
        }
        if (match.pair2_id && pairLastMatchTime.has(match.pair2_id)) {
             const lastTime = pairLastMatchTime.get(match.pair2_id)!
             if (getMinutesDifference(lastTime, matchTime) < 60) restCheckPassed = false
        }
        
        if (!restCheckPassed) continue
        
        // Find available court for this time slot
        const timeKey = matchTime.toISOString()
        const usedCourts = courtUsage.get(timeKey) || new Set()
        
        // Find first available court
        let assignedCourt = 0
        for (let court = 1; court <= config.availableCourts; court++) {
          if (!usedCourts.has(court)) {
            assignedCourt = court
            break
          }
        }
        
        if (assignedCourt > 0) {
          // Schedule the match
          scheduledMatches.push({
            matchId: match.id,
            scheduledTime: matchTime,
            courtNumber: assignedCourt
          })
          
          // Mark court as used for this time slot
          usedCourts.add(assignedCourt)
          courtUsage.set(timeKey, usedCourts)
          
          // Update last match time for pairs (if known)
          const matchEndTime = new Date(matchTime.getTime() + config.matchDurationMinutes * 60000)
          
          if (match.pair1_id) pairLastMatchTime.set(match.pair1_id, matchEndTime)
          if (match.pair2_id) pairLastMatchTime.set(match.pair2_id, matchEndTime)
          
          // Update round tracking
          if (matchRound) {
            const currentLast = roundLastScheduledTime.get(matchRound)
            if (!currentLast || matchTime > currentLast) {
                roundLastScheduledTime.set(matchRound, matchTime)
            }
          }

          scheduled = true
        }
      }
    }
    
    if (!scheduled) {
      console.warn(`Could not schedule match ${match.id} - insufficient time slots or courts`)
    }
  }
  
  return scheduledMatches
}

/**
 * Calculate available time slots for a single day
 */
function calculateDailySlotsAvailable(
  startTime: string,
  endTime: string,
  matchDurationMinutes: number
): string[] {
  const slots: string[] = []
  
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute
  
  let currentMinutes = startMinutes
  
  while (currentMinutes + matchDurationMinutes <= endMinutes) {
    const hour = Math.floor(currentMinutes / 60)
    const minute = currentMinutes % 60
    slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
    currentMinutes += matchDurationMinutes
  }
  
  return slots
}

/**
 * Get all days between start and end date (inclusive)
 */
function getTournamentDays(startDate: Date, endDate: Date): Date[] {
  const days: Date[] = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  
  return days
}

/**
 * Combine a date and time string into a Date object
 */
function combineDateAndTime(date: Date, time: string): Date {
  const [hour, minute] = time.split(':').map(Number)
  const combined = new Date(date)
  combined.setHours(hour, minute, 0, 0)
  return combined
}

/**
 * Get difference between two dates in minutes
 */
function getMinutesDifference(earlier: Date, later: Date): number {
  return (later.getTime() - earlier.getTime()) / 60000
}

/**
 * Format scheduled time for display
 */
export function formatMatchTime(date: Date): string {
  const dayName = date.toLocaleDateString('es-AR', { weekday: 'short' })
  const dayNum = date.getDate()
  const month = date.toLocaleDateString('es-AR', { month: 'short' })
  const time = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  
  return `${dayName} ${dayNum} ${month} - ${time}`
}
