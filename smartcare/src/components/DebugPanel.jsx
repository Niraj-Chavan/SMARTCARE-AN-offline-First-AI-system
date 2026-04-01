import { useEffect, useMemo, useState } from 'react'
import db from '../db'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

function DebugPanel() {
  const isOnline = useOnlineStatus()
  const [counts, setCounts] = useState({ synced: 0, unsynced: 0 })
  const [kbVersion, setKbVersion] = useState('0')
  const [lastSyncAt, setLastSyncAt] = useState('—')

  const isVisible = useMemo(() => {
    if (typeof window === 'undefined') return false
    const params = new URLSearchParams(window.location.search)
    return params.get('debug') === '1'
  }, [])

  useEffect(() => {
    if (!isVisible) return

    let mounted = true

    const load = async () => {
      const [synced, unsynced, kbMeta, syncMeta] = await Promise.all([
        db.syncQueue.where('synced').equals(1).count(),
        db.syncQueue.where('synced').equals(0).count(),
        db.meta.get('kbVersion'),
        db.meta.get('lastSyncAt'),
      ])

      if (!mounted) return
      setCounts({ synced, unsynced })
      setKbVersion(kbMeta?.value?.toString() || '0')
      setLastSyncAt(syncMeta?.value || '—')
    }

    load()
    const interval = setInterval(load, 2000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 rounded-xl border border-slate-200 bg-white/95 p-4 text-xs text-slate-700 shadow-lg backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Debug</p>
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span>Status</span>
          <span className={isOnline ? 'text-emerald-600' : 'text-amber-600'}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Sync queue</span>
          <span>
            {counts.unsynced} unsynced / {counts.synced} synced
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>KB version</span>
          <span>{kbVersion}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Last sync</span>
          <span>{lastSyncAt}</span>
        </div>
      </div>
    </div>
  )
}

export default DebugPanel
