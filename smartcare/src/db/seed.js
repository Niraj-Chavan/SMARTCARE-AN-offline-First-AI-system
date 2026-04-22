import db from '../db'

export async function seedKnowledgeBase() {
  const existing = await db.conditions.count()
  if (existing > 0) {
    return { seeded: false, count: existing }
  }

  const response = await fetch('/knowledge-base.json', { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('Failed to load knowledge base')
  }

  const knowledgeBase = await response.json()
  if (!Array.isArray(knowledgeBase) || knowledgeBase.length === 0) {
    return { seeded: false, count: 0 }
  }

  await db.conditions.bulkAdd(knowledgeBase)
  return { seeded: true, count: knowledgeBase.length }
}

export default seedKnowledgeBase
