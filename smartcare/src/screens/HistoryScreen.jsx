import { useEffect, useState } from 'react'
import db from '../db'
import { decryptData } from '../utils/crypto'

const tierStyles = {
  Low: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  Moderate: 'border-amber-200 bg-amber-50 text-amber-900',
  High: 'border-red-200 bg-red-50 text-red-900',
}

function HistoryScreen() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadSessions() {
      setLoading(true)
      const data = await db.sessions.orderBy('date').reverse().toArray()

      const hydrated = await Promise.all(
        data.map(async (session) => {
          const decryptedSymptoms = session.symptomsEncrypted
            ? await decryptData(session.symptomsEncrypted)
            : ''
          const decryptedRecommendation = session.recommendationEncrypted
            ? await decryptData(session.recommendationEncrypted)
            : ''
          const decryptedAiAssessment = session.aiAssessmentEncrypted
            ? await decryptData(session.aiAssessmentEncrypted)
            : ''

          return {
            ...session,
            symptoms: decryptedSymptoms ? JSON.parse(decryptedSymptoms) : [],
            recommendation: decryptedRecommendation,
            aiAssessment: decryptedAiAssessment ? JSON.parse(decryptedAiAssessment) : null,
          }
        }),
      )

      if (!cancelled) {
        setSessions(hydrated)
        setLoading(false)
      }
    }

    loadSessions()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleClear() {
    await db.sessions.clear()
    setSessions([])
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">SmartCare</p>
            <h1 className="mt-3 text-3xl font-semibold">History</h1>
            <p className="mt-2 text-slate-600">Past symptom checks stored on this device.</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            disabled={sessions.length === 0}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            Clear history
          </button>
        </header>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">Loading history...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            No sessions saved yet.
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const tierClass = tierStyles[session.riskLevel] || 'border-slate-200 bg-white'
              return (
                <article
                  key={session.id}
                  className={`rounded-2xl border p-5 shadow-sm ${tierClass}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      {new Date(session.date).toLocaleString()}
                    </p>
                    <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold">
                      {session.riskLevel}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">
                    Symptoms: {session.symptoms?.join(', ') || 'None'}
                  </p>
                  {session.recommendation && (
                    <p className="mt-2 text-xs text-slate-500">{session.recommendation}</p>
                  )}
                  {session.aiAssessment?.summary && (
                    <p className="mt-2 text-xs text-slate-600">
                      Ollama: {session.aiAssessment.summary}
                    </p>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

export default HistoryScreen
