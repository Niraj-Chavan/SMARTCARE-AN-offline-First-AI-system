const baseGuidance = {
  low: [
    'Monitor symptoms for changes',
    'Rest and stay hydrated',
    'Consider over-the-counter relief if needed',
  ],
  medium: [
    'Monitor symptoms closely',
    'Rest and stay hydrated',
    'Consider contacting a healthcare provider',
  ],
  high: [
    'Seek urgent medical care if symptoms worsen',
    'Have someone stay with you if possible',
    'Avoid strenuous activity',
  ],
}

export function recommendationEngine(riskLevel = 'low', matchedConditions = []) {
  const recommendations = new Map()

  matchedConditions.forEach((condition) => {
    ;(condition.recommendations || []).forEach((recommendation) => {
      const count = recommendations.get(recommendation) || 0
      recommendations.set(recommendation, count + 1)
    })
  })

  const sortedConditionRecs = [...recommendations.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]
      return a[0].localeCompare(b[0])
    })
    .map(([recommendation]) => recommendation)

  const base = baseGuidance[riskLevel] || baseGuidance.low
  const merged = [...base]

  sortedConditionRecs.forEach((rec) => {
    if (!merged.includes(rec)) {
      merged.push(rec)
    }
  })

  return merged
}

export default recommendationEngine
