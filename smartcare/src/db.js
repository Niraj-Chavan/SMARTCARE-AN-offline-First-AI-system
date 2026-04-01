import Dexie from 'dexie'

export const db = new Dexie('smartcare')

db.version(1).stores({
  conditions: '++id, name, *symptoms, riskLevel, recommendations',
  sessions: '++id, date, symptoms, result, riskLevel',
  syncQueue: '++id, type, payload, synced, createdAt',
})

db.version(2).stores({
  conditions: '++id, name, *symptoms, riskLevel, recommendations',
  sessions: '++id, date, symptoms, result, riskLevel',
  syncQueue: '++id, type, payload, synced, createdAt',
  meta: 'key',
})

export default db
