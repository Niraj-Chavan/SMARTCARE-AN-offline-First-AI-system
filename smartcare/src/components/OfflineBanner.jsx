import { useOnlineStatus } from '../hooks/useOnlineStatus'

function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="sticky top-0 z-50 w-full border-b border-amber-200 bg-amber-100 text-amber-900 shadow-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 text-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1" aria-hidden>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="h-2 w-2 rounded-full bg-red-500" />
          </div>
          <div>
            <span className="font-semibold">Offline mode</span>
            <span className="ml-2 text-amber-800">
              All features still work without internet.
            </span>
          </div>
        </div>
        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900">
          Offline
        </span>
      </div>
    </div>
  )
}

export default OfflineBanner
