import { useEffect, useMemo, useState } from 'react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

function OnboardingScreen({ onGetStarted }) {
  const isOnline = useOnlineStatus()
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const handleBeforeInstall = (event) => {
      event.preventDefault()
      setDeferredPrompt(event)
    }

    const handleInstalled = () => setInstalled(true)

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const installHint = useMemo(() => {
    if (installed) return 'App installed on this device.'
    if (deferredPrompt) return 'Install SmartCare to use it like a native app.'
    return 'Use your browser menu to add SmartCare to your home screen.'
  }, [deferredPrompt, installed])

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-14">
        <header>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">SmartCare</p>
          <h1 className="mt-4 text-4xl font-semibold">Offline symptom checking</h1>
          <p className="mt-4 text-base text-slate-600">
            SmartCare works 100% offline once loaded. Your data stays on your
            device, and the AI runs entirely in the browser.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Works offline</p>
            <p className="mt-2 text-sm text-slate-600">
              No network required after first visit.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Private by design</p>
            <p className="mt-2 text-sm text-slate-600">
              All health data stays on-device.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Fast results</p>
            <p className="mt-2 text-sm text-slate-600">
              AI scoring runs locally in JavaScript.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold">Offline ready</p>
          <p className="mt-1">{installHint}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onGetStarted}
            className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white"
          >
            Get started
          </button>
          <button
            type="button"
            disabled={!deferredPrompt}
            onClick={handleInstall}
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            Install app
          </button>
          {!isOnline && (
            <span className="self-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              Offline
            </span>
          )}
        </div>
      </div>
    </main>
  )
}

export default OnboardingScreen
