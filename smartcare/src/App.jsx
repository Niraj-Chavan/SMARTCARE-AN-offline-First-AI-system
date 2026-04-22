import { useEffect, useState } from 'react'
import OfflineBanner from './components/OfflineBanner'
import DebugPanel from './components/DebugPanel'
import OnboardingScreen from './screens/OnboardingScreen'
import DashboardScreen from './screens/DashboardScreen'
import SymptomInputScreen from './screens/SymptomInputScreen'
import ResultsScreen from './screens/ResultsScreen'
import HistoryScreen from './screens/HistoryScreen'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { seedKnowledgeBase } from './db/seed'

const ONBOARDING_KEY = 'smartcare_onboarded'

function App() {
  const isOnline = useOnlineStatus()
  const [screen, setScreen] = useState('dashboard')
  const [results, setResults] = useState(null)
  const [hasOnboarded, setHasOnboarded] = useState(() => {
    return localStorage.getItem(ONBOARDING_KEY) === 'true'
  })

  useEffect(() => {
    if (!isOnline) return
    seedKnowledgeBase().catch((error) => {
      console.error('Failed to seed knowledge base', error)
    })
  }, [isOnline])

  function handleResults(data) {
    setResults(data)
    setScreen('results')
  }

  function handleCheckAgain() {
    setScreen('symptoms')
  }

  function handleGetStarted() {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setHasOnboarded(true)
    setScreen('dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <OfflineBanner />
      <DebugPanel />
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={() => setScreen('dashboard')}
            className="text-base font-semibold text-slate-900"
          >
            SmartCare
          </button>
          <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setScreen('dashboard')}
              className={
                screen === 'dashboard'
                  ? 'text-emerald-600'
                  : 'hover:text-slate-900'
              }
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setScreen('symptoms')}
              className={
                screen === 'symptoms'
                  ? 'text-emerald-600'
                  : 'hover:text-slate-900'
              }
            >
              Check
            </button>
            <button
              type="button"
              onClick={() => setScreen('history')}
              className={
                screen === 'history'
                  ? 'text-emerald-600'
                  : 'hover:text-slate-900'
              }
            >
              History
            </button>
          </div>
        </div>
      </nav>

      {!hasOnboarded && <OnboardingScreen onGetStarted={handleGetStarted} />}
      {hasOnboarded && screen === 'dashboard' && (
        <DashboardScreen
          onStartCheck={() => setScreen('symptoms')}
          onOpenHistory={() => setScreen('history')}
        />
      )}
      {hasOnboarded && screen === 'symptoms' && (
        <SymptomInputScreen onResults={handleResults} />
      )}
      {hasOnboarded && screen === 'results' && (
        <ResultsScreen
          results={results}
          onCheckAgain={handleCheckAgain}
          onSaved={() => setScreen('history')}
        />
      )}
      {hasOnboarded && screen === 'history' && <HistoryScreen />}
    </div>
  )
}

export default App
