import { describe, it, expect } from 'vitest'
import { recommendationEngine } from '../recommendationEngine'

describe('recommendationEngine', () => {
  it('returns base guidance when no matches', () => {
    const result = recommendationEngine('low', [])
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toContain('Monitor')
  })

  it('includes condition recommendations sorted by frequency', () => {
    const matches = [
      { recommendations: ['Hydrate', 'Rest'] },
      { recommendations: ['Hydrate', 'Call a provider'] },
    ]

    const result = recommendationEngine('medium', matches)
    const hydrateIndex = result.indexOf('Hydrate')
    const restIndex = result.indexOf('Rest')

    expect(hydrateIndex).toBeGreaterThan(-1)
    expect(restIndex).toBeGreaterThan(-1)
    expect(hydrateIndex).toBeLessThan(restIndex)
  })
})
