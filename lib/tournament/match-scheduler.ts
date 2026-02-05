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
  
  for (const match of matches) {
    let scheduled = false
    
    // Try each day
    for (let dayIndex = 0; dayIndex < tournamentDays.length && !scheduled; dayIndex++) {
      const currentDay = tournamentDays[dayIndex]
      
      // Try each time slot
      for (let slotIndex = 0; slotIndex < slotsPerDay.length && !scheduled; slotIndex++) {
        const slotTime = slotsPerDay[slotIndex]
        const matchTime = combineDateAndTime(currentDay, slotTime)
        
        // Check if both pairs have sufficient rest
        const pair1LastTime = pairLastMatchTime.get(match.pair1_id)
        const pair2LastTime = pairLastMatchTime.get(match.pair2_id)
        
        const minimumRestMinutes = 60 // APA/FAP rule
        const canSchedule = 
          (!pair1LastTime || getMinutesDifference(pair1LastTime, matchTime) >= minimumRestMinutes) &&
          (!pair2LastTime || getMinutesDifference(pair2LastTime, matchTime) >= minimumRestMinutes)
        
        if (!canSchedule) continue
        
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
          
          // Update last match time for both pairs
          const matchEndTime = new Date(matchTime.getTime() + config.matchDurationMinutes * 60000)
          pairLastMatchTime.set(match.pair1_id, matchEndTime)
          pairLastMatchTime.set(match.pair2_id, matchEndTime)
          
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
