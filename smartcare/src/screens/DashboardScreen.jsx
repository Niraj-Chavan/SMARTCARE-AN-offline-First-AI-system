import { useEffect, useMemo, useState } from 'react'
import db from '../db'
import {
  checkOllamaHealth,
  getOllamaSettings,
  saveOllamaSettings,
} from '../agents/ollamaClient'

const riskStyles = {
  Low: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  Moderate: 'border-amber-200 bg-amber-50 text-amber-900',
  High: 'border-red-200 bg-red-50 text-red-900',
}

function DashboardScreen({ onStartCheck, onOpenHistory }) {
  const [sessions, setSessions] = useState([])
  const [settings, setSettings] = useState(getOllamaSettings)
  const [status, setStatus] = useState({
    checking: true,
    ok: false,
    hasSelectedModel: false,
    message: 'Checking Ollama...',
    models: [],
  })

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      const storedSessions = await db.sessions.orderBy('date').reverse().toArray()
      if (!cancelled) {
        setSessions(storedSessions)
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function refreshStatus() {
      setStatus((current) => ({
        ...current,
        checking: true,
        message: 'Checking Ollama...',
      }))

      const nextStatus = await checkOllamaHealth(settings)
      if (!cancelled) {
        setStatus({ ...nextStatus, checking: false })
      }
    }

    refreshStatus()

    return () => {
      cancelled = true
    }
  }, [settings])

  const stats = useMemo(() => {
    const counts = sessions.reduce(
      (acc, session) => {
        acc[session.riskLevel] = (acc[session.riskLevel] || 0) + 1
        return acc
      },
      { Low: 0, Moderate: 0, High: 0 },
    )
    const ollamaCount = sessions.filter((session) => session.aiStatus === 'ready').length

    return {
      total: sessions.length,
      counts,
      ollamaCount,
      latest: sessions[0]?.date ? new Date(sessions[0].date).toLocaleString() : 'None',
    }
  }, [sessions])

  function handleSettingsChange(event) {
    const { name, value } = event.target
    const nextSettings = { ...settings, [name]: value }
    setSettings(nextSettings)
    saveOllamaSettings(nextSettings)
  }

  async function handleRefresh() {
    setStatus((current) => ({
      ...current,
      checking: true,
      message: 'Checking Ollama...',
    }))
    const nextStatus = await checkOllamaHealth(settings)
    setStatus({ ...nextStatus, checking: false })
  }

  const recentSessions = sessions.slice(0, 4)

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">SmartCare</p>
            <h1 className="mt-3 text-3xl font-semibold">Dashboard</h1>
            <p className="mt-2 text-slate-600">
              Offline checks, local history, and Ollama readiness on this device.
            </p>
          </div>
          <button
            type="button"
            onClick={onStartCheck}
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white"
          >
            New check
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
              Sessions
            </p>
            <p className="mt-3 text-3xl font-semibold">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
              Ollama used
            </p>
            <p className="mt-3 text-3xl font-semibold">{stats.ollamaCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
              Latest check
            </p>
            <p className="mt-3 text-lg font-semibold">{stats.latest}</p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Ollama</h2>
                <p className="mt-2 text-sm text-slate-600">{status.message}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  status.ok && status.hasSelectedModel
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {status.checking
                  ? 'Checking'
                  : status.ok && status.hasSelectedModel
                    ? 'Ready'
                    : 'Needs setup'}
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                  Endpoint
                </span>
                <input
                  name="baseUrl"
                  value={settings.baseUrl}
                  onChange={handleSettingsChange}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                  Model
                </span>
                <input
                  name="model"
                  value={settings.model}
                  onChange={handleSettingsChange}
                  list="ollama-models"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                />
                <datalist id="ollama-models">
                  {status.models.map((model) => (
                    <option key={model.name} value={model.name} />
                  ))}
                </datalist>
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={status.checking}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                {status.checking ? 'Checking...' : 'Refresh status'}
              </button>
              <button
                type="button"
                onClick={onStartCheck}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Run symptom check
              </button>
            </div>

            {status.models.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                  Local models
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {status.models.map((model) => (
                    <button
                      key={model.name}
                      type="button"
                      onClick={() =>
                        handleSettingsChange({
                          target: { name: 'model', value: model.name },
                        })
                      }
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      {model.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Risk mix</h2>
            <div className="mt-5 space-y-3">
              {Object.entries(stats.counts).map(([riskLevel, count]) => (
                <div
                  key={riskLevel}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                    riskStyles[riskLevel]
                  }`}
                >
                  <span className="text-sm font-semibold">{riskLevel}</span>
                  <span className="text-lg font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Recent checks</h2>
            <button
              type="button"
              onClick={onOpenHistory}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Open history
            </button>
          </div>

          {recentSessions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No saved checks yet.</p>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {recentSessions.map((session) => (
                <article
                  key={session.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">
                      {new Date(session.date).toLocaleString()}
                    </p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      {session.riskLevel}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {session.aiStatus === 'ready'
                      ? `Ollama model: ${session.aiModel}`
                      : 'Rule-based fallback saved'}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default DashboardScreen
