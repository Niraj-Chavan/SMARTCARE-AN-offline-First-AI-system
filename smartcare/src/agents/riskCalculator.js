const riskWeight = {
  low: 1,
  medium: 2,
  high: 3,
}

export function calculateRisk(matchedConditions = []) {
  if (!Array.isArray(matchedConditions) || matchedConditions.length === 0) {
    return { tier: 'green', label: 'Low', recommendation: 'Monitor symptoms.' }
  }

  const highest = matchedConditions.reduce((acc, condition) => {
    const weight = riskWeight[condition.riskLevel] || 0
    return weight > acc.weight
      ? { weight, condition }
      : acc
  }, { weight: 0, condition: null })

  const riskLevel = highest.condition?.riskLevel || 'low'
  const tier = riskLevel === 'high' ? 'red' : riskLevel === 'medium' ? 'amber' : 'green'
  const label = tier === 'red' ? 'High' : tier === 'amber' ? 'Moderate' : 'Low'
  const recommendation =
    highest.condition?.recommendation ||
    (Array.isArray(highest.condition?.recommendations) && highest.condition.recommendations[0]) ||
    'Monitor symptoms and rest.'

  return { tier, label, recommendation }
}

export default calculateRisk
