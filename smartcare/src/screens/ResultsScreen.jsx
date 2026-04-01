import { useState } from 'react'
import db from '../db'
import { encryptData } from '../utils/crypto'

const tierStyles = {
  green: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  amber: 'border-amber-200 bg-amber-50 text-amber-900',
  red: 'border-red-200 bg-red-50 text-red-900',
}

function ResultsScreen({ results, onCheckAgain, onSaved }) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!results) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="text-2xl font-semibold">No results yet</h1>
          <p className="mt-2 text-slate-600">Run a symptom check to see results.</p>
          <button
            type="button"
            onClick={onCheckAgain}
            className="mt-6 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white"
          >
            Start checking
          </button>
        </div>
      </main>
    )
  }

  const { risk, matches, selectedSymptoms } = results
  const topMatches = matches.slice(0, 3)

  async function handleSave() {
    if (saving || saved) return
    setSaving(true)

    const [symptomsEncrypted, recommendationEncrypted] = await Promise.all([
      encryptData(JSON.stringify(selectedSymptoms)),
      encryptData(risk.recommendation || ''),
    ])

    const entry = {
      date: new Date().toISOString(),
      riskLevel: risk.label,
      symptomsEncrypted,
      recommendationEncrypted,
      resultId: topMatches[0]?.id || null,
    }

    try {
      await db.sessions.add(entry)
      setSaved(true)
      if (onSaved) onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">SmartCare</p>
          <h1 className="mt-3 text-3xl font-semibold">Results</h1>
        </header>

        <section
          className={`rounded-2xl border p-6 shadow-sm ${tierStyles[risk.tier]}`}
        >
          <p className="text-sm font-semibold uppercase">Risk tier</p>
          <h2 className="mt-2 text-2xl font-semibold">{risk.label}</h2>
          <p className="mt-2 text-sm">{risk.recommendation}</p>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Top matches</h3>
          {topMatches.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No matches found.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {topMatches.map((match) => (
                <li
                  key={match.id || match.name}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{match.name}</p>
                    <p className="text-xs text-slate-500">
                      Matched symptoms: {match.matchedSymptoms?.length || 0}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    {match.matchPercent ?? Math.round((match.score || 0) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Recommendations</h3>
          <p className="mt-3 text-sm text-slate-600">{risk.recommendation}</p>
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || saved}
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saved ? 'Saved' : saving ? 'Saving...' : 'Save to history'}
          </button>
          <button
            type="button"
            onClick={onCheckAgain}
            className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700"
          >
            Check again
          </button>
        </div>
      </div>
    </main>
  )
}

export default ResultsScreen
