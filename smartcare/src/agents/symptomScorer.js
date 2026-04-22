import db from '../db'

function normalize(value) {
  return value.trim().toLowerCase()
}

export async function scoreSymptoms(selectedSymptoms = []) {
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
        matchPercent: Math.round(score * 100),
        matchedSymptoms,
      }
    })
    .filter((condition) => condition.score > 0)
    .sort((a, b) => b.score - a.score)
}

export default scoreSymptoms
