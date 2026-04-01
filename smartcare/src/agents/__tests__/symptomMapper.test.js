import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import db from '../../db'
import { symptomMapper } from '../symptomMapper'

const seedConditions = [
  {
    id: 1,
    name: 'Condition A',
    symptoms: ['fever', 'cough'],
    riskLevel: 'medium',
    recommendations: [],
  },
  {
    id: 2,
    name: 'Condition B',
    symptoms: ['cough'],
    riskLevel: 'low',
    recommendations: [],
  },
  {
    id: 3,
    name: 'Condition C',
    symptoms: ['rash'],
    riskLevel: 'high',
    recommendations: [],
  },
]

describe('symptomMapper', () => {
  beforeEach(async () => {
    await db.conditions.clear()
    await db.conditions.bulkAdd(seedConditions)
  })

  it('returns empty array when no symptoms provided', async () => {
    const results = await symptomMapper([])
    expect(results).toEqual([])
  })

  it('returns empty array when symptoms are unknown', async () => {
    const results = await symptomMapper(['unknown symptom'])
    expect(results).toEqual([])
  })

  it('ranks conditions by symptom overlap score', async () => {
    const results = await symptomMapper(['cough', 'fever'])
    expect(results[0].name).toBe('Condition A')
    expect(results.map((item) => item.name)).toContain('Condition B')
  })
})
