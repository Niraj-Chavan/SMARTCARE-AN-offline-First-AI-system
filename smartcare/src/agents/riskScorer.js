const riskWeight = {
  low: 1,
  medium: 2,
  high: 3,
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function riskScorer(matchedConditions = []) {
  if (!Array.isArray(matchedConditions) || matchedConditions.length === 0) {
    return { riskLevel: 'low', confidence: 0 }
  }

  const overallRisk = matchedConditions.reduce((highest, condition) => {
    return riskWeight[condition.riskLevel] > riskWeight[highest]
      ? condition.riskLevel
      : highest
  }, 'low')

  const averageScore =
    matchedConditions.reduce((sum, condition) => sum + (condition.score || 0), 0) /
    matchedConditions.length

  const baseConfidence = Math.round(averageScore * 100)
  const adjusted = baseConfidence + (riskWeight[overallRisk] - 1) * 10

  return {
    riskLevel: overallRisk,
    confidence: clamp(adjusted, 5, 100),
  }
}

export default riskScorer
