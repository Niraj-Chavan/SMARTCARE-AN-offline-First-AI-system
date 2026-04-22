import { useEffect, useState } from 'react'
import { flushQueue } from '../sync/syncManager'
import { updateKnowledgeBaseIfNeeded } from '../sync/kbUpdater'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      flushQueue()
      updateKnowledgeBaseIfNeeded()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

export default useOnlineStatus
