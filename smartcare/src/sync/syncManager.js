import db from '../db'

export async function queueAction(type, payload) {
  const entry = {
    type,
    payload,
    synced: 0,
    createdAt: new Date().toISOString(),
  }

  return db.syncQueue.add(entry)
}

export async function flushQueue() {
  try {
    const pending = await db.syncQueue.where('synced').equals(0).toArray()
    if (pending.length === 0) {
      return { success: true, processed: 0 }
    }

    let syncedCount = 0

    for (const item of pending) {
      try {
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: item.type,
            payload: item.payload,
            createdAt: item.createdAt,
          }),
        })

        if (response.ok) {
          await db.syncQueue.update(item.id, { synced: 1 })
          syncedCount += 1
        }
      } catch (error) {
        // Swallow errors and retry next time we're online.
      }
    }

    if (syncedCount > 0) {
      await db.meta.put({ key: 'lastSyncAt', value: new Date().toISOString() })
    }

    return { success: true, processed: syncedCount }
  } catch (error) {
    return { success: false, processed: 0 }
  }
}

export default { queueAction, flushQueue }
