import db from '../db'

const riskWeight = {
  low: 1,
  medium: 2,
  high: 3,
}

function normalize(value) {
  return value.trim().toLowerCase()
}

export async function symptomMapper(selectedSymptoms = []) {
  if (!Array.isArray(selectedSymptoms) || selectedSymptoms.length === 0) {
    return []
  }

  const normalized = new Set(selectedSymptoms.map(normalize))
  const conditions = await db.conditions.toArray()

  return conditions
    .map((condition) => {
      const conditionSymptoms = (condition.symptoms || []).map(normalize)
      const matchedSymptoms = conditionSymptoms.filter((symptom) =>
        normalized.has(symptom),
      )
      const score =
        conditionSymptoms.length === 0
          ? 0
          : matchedSymptoms.length / conditionSymptoms.length

      return {
        ...condition,
        score,
        matchedSymptoms,
      }
    })
    .filter((condition) => condition.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      const riskDiff = (riskWeight[b.riskLevel] || 0) - (riskWeight[a.riskLevel] || 0)
      if (riskDiff !== 0) return riskDiff
      return a.name.localeCompare(b.name)
    })
}

export default symptomMapper
