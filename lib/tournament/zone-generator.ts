import type { Pair, Zone } from '@/lib/types'

/**
 * Generates zones automatically based on APA/FAP rules
 * 
 * REGLAS PRINCIPALES:
 * - Preferencia por zonas de 3 parejas (clasifican 2)
 * - Si la división es exacta de 3, todas las zonas tienen 3 parejas
 * - Sobra 1: se crea una zona de 4 (será Zona A)
 * - Sobran 2: se crean dos zonas de 4 (Zonas A y B)
 * - 5 parejas total: 1 zona de 2 (#1 y #2) + 1 zona de 3
 * - 4 parejas total: 1 zona de 4 (todos contra todos)
 */
export function generateZones(totalPairs: number): {
  numZones: number
  pairsPerZone: number[]
} {
  // Minimum 4 pairs required
  if (totalPairs < 4) {
    throw new Error('Se necesitan al menos 4 parejas para generar zonas')
  }

  let numZones: number
  let pairsPerZone: number[]

  // Caso especial: 4 parejas
  if (totalPairs === 4) {
    numZones = 1
    pairsPerZone = [4]
  }
  // Caso especial: 5 parejas
  else if (totalPairs === 5) {
    numZones = 2
    pairsPerZone = [2, 3] // Zona A: #1 y #2, Zona B: resto
  }
  // Regla general: preferir zonas de 3
  else {
    const basePairs = 3
    numZones = Math.floor(totalPairs / basePairs)
    const remainder = totalPairs % basePairs

    if (remainder === 0) {
      // División exacta: todas las zonas tienen 3 parejas
      pairsPerZone = Array(numZones).fill(3)
    } else if (remainder === 1) {
      // Sobra 1: Zona A tendrá 4 parejas
      pairsPerZone = [4, ...Array(numZones - 1).fill(3)]
    } else {
      // Sobran 2: Zonas A y B tendrán 4 parejas
      pairsPerZone = [4, 4, ...Array(numZones - 2).fill(3)]
    }
  }

  return { numZones, pairsPerZone }
}

/**
 * Distributes pairs into zones using serpentine distribution
 * This ensures balanced zones by category/skill level
 */
export function distributePairsIntoZones(
  pairs: Pair[],
  zoneDistribution: number[]
): { [zoneIndex: number]: Pair[] } {
  // Sort pairs by category (if available) for balanced distribution
  const sortedPairs = [...pairs].sort((a, b) => {
    // If we have category info, use it; otherwise maintain order
    return 0
  })

  const zones: { [zoneIndex: number]: Pair[] } = {}
  let currentPairIndex = 0
  let forward = true

  // Serpentine distribution (snake draft)
  // Zone 1: pairs 1, 8, 9, 16
  // Zone 2: pairs 2, 7, 10, 15
  // Zone 3: pairs 3, 6, 11, 14
  // Zone 4: pairs 4, 5, 12, 13
  
  const maxPairsPerZone = Math.max(...zoneDistribution)
  
  for (let round = 0; round < maxPairsPerZone; round++) {
    const zoneIndices = forward 
      ? Array.from({ length: zoneDistribution.length }, (_, i) => i)
      : Array.from({ length: zoneDistribution.length }, (_, i) => zoneDistribution.length - 1 - i)
    
    for (const zoneIndex of zoneIndices) {
      if (currentPairIndex < sortedPairs.length && round < zoneDistribution[zoneIndex]) {
        if (!zones[zoneIndex]) {
          zones[zoneIndex] = []
        }
        zones[zoneIndex].push(sortedPairs[currentPairIndex])
        currentPairIndex++
      }
    }
    
    forward = !forward
  }

  return zones
}

/**
 * Calculates how many pairs qualify from each zone to playoffs
 * 
 * REGLAS APA/FAP:
 * - Normalmente clasifican 2 parejas por zona
 * - Excepción: si hay 1 sola zona, clasifican 4 parejas (semifinales)
 * - Caso especial zona de 2: ambas clasifican
 */
export function calculateQualifiedPairsPerZone(
  numZones: number,
  pairsInZone: number
): number {
  // Si es zona única (4-6 parejas), clasifican 4 para semifinales
  if (numZones === 1) {
    return Math.min(4, pairsInZone)
  }
  
  // Zona de 2 parejas (caso especial de 5 parejas totales)
  if (pairsInZone === 2) {
    return 2
  }
  
  // Regla general: clasifican 2 por zona
  return 2
}

/**
 * Gets zone names (A, B, C, D)
 */
export function getZoneName(index: number): string {
  const names = ['A', 'B', 'C', 'D', 'E', 'F']
  return names[index] || `Zona ${index + 1}`
}
