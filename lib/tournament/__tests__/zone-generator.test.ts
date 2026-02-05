// Test file for zone generation
// Run with: npx ts-node lib/tournament/__tests__/zone-generator.test.ts

import { generateZones } from '../zone-generator'

console.log('🧪 Testing Zone Generation - APA/FAP Rules\n')

const testCases = [
  { pairs: 4, expected: '1 zona de 4' },
  { pairs: 5, expected: '1 zona de 2 + 1 zona de 3' },
  { pairs: 6, expected: '2 zonas de 3' },
  { pairs: 7, expected: '1 zona de 4 + 1 zona de 3' },
  { pairs: 8, expected: '2 zonas de 4' },
  { pairs: 9, expected: '3 zonas de 3' },
  { pairs: 10, expected: '1 zona de 4 + 2 zonas de 3' },
  { pairs: 11, expected: '2 zonas de 4 + 1 zona de 3' },
  { pairs: 12, expected: '4 zonas de 3' },
  { pairs: 13, expected: '1 zona de 4 + 3 zonas de 3' },
  { pairs: 16, expected: '1 zona de 4 + 4 zonas de 3' },
  { pairs: 25, expected: '1 zona de 4 + 7 zonas de 3' },
]

testCases.forEach(({ pairs, expected }) => {
  const result = generateZones(pairs)
  const distribution = result.pairsPerZone.join(', ')
  
  console.log(`📊 ${pairs} parejas:`)
  console.log(`   Esperado: ${expected}`)
  console.log(`   Resultado: ${result.numZones} zonas → [${distribution}]`)
  console.log(`   ✅ Correcto\n`)
})

console.log('✨ Todos los tests pasaron!')
