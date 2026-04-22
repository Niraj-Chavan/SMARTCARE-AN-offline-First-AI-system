import db from '../db'

export async function updateKnowledgeBaseIfNeeded() {
  try {
    if (!navigator.onLine) return { updated: false, reason: 'offline' }

    const versionResponse = await fetch('/api/kb-version')
    if (!versionResponse.ok) return { updated: false, reason: 'version-unavailable' }

    const { version } = await versionResponse.json()
    if (typeof version !== 'number') {
      return { updated: false, reason: 'invalid-version' }
    }

    const current = await db.meta.get('kbVersion')
    const currentVersion = Number(current?.value || 0)

    if (version <= currentVersion) {
      return { updated: false, reason: 'up-to-date' }
    }

    const kbResponse = await fetch('/knowledge-base.json', { cache: 'no-store' })
    if (!kbResponse.ok) return { updated: false, reason: 'kb-fetch-failed' }

    const knowledgeBase = await kbResponse.json()
    if (!Array.isArray(knowledgeBase)) {
      return { updated: false, reason: 'invalid-kb' }
    }

    await db.transaction('rw', db.conditions, db.meta, async () => {
      await db.conditions.clear()
      await db.conditions.bulkAdd(knowledgeBase)
      await db.meta.put({ key: 'kbVersion', value: version })
      await db.meta.put({ key: 'kbUpdatedAt', value: new Date().toISOString() })
    })

    return { updated: true, version }
  } catch {
    return { updated: false, reason: 'error' }
  }
}

export default updateKnowledgeBaseIfNeeded
