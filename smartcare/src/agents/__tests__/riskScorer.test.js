import { describe, it, expect } from 'vitest'
import { riskScorer } from '../riskScorer'

describe('riskScorer', () => {
  it('returns low risk and zero confidence with no matches', () => {
    expect(riskScorer([])).toEqual({ riskLevel: 'low', confidence: 0 })
  })

  it('returns highest risk from matched conditions', () => {
    const matches = [
      { name: 'A', riskLevel: 'low', score: 0.4 },
      { name: 'B', riskLevel: 'high', score: 0.6 },
    ]

    const result = riskScorer(matches)
    expect(result.riskLevel).toBe('high')
    expect(result.confidence).toBeGreaterThan(0)
  })
})
