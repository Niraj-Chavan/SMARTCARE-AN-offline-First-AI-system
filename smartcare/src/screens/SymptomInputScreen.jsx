import { useEffect, useMemo, useRef, useState } from 'react'
import db from '../db'
import { scoreSymptoms } from '../agents/symptomScorer'
import { calculateRisk } from '../agents/riskCalculator'
import { generateOllamaAssessment, getOllamaSettings } from '../agents/ollamaClient'

function normalize(value) {
  return value.trim().toLowerCase()
}

function parseTranscript(text) {
  return text
    .split(/,|and|then|also|plus|\n/gi)
    .map((part) => part.trim())
    .filter(Boolean)
}

function SymptomInputScreen({ onResults }) {
  const [step, setStep] = useState(1)
  const [symptoms, setSymptoms] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [entry, setEntry] = useState('')
  const [micStatus, setMicStatus] = useState('idle')
  const [micError, setMicError] = useState('')
  const [checking, setChecking] = useState(false)
  const [aiStatus, setAiStatus] = useState('')
  const recognitionRef = useRef(null)

  useEffect(() => {
    let isMounted = true

    async function loadSymptoms() {
      try {
        setLoading(true)
        const conditions = await db.conditions.toArray()
        const unique = new Set()
        conditions.forEach((condition) => {
          ;(condition.symptoms || []).forEach((symptom) => unique.add(symptom))
        })
        if (isMounted) {
          setSymptoms(Array.from(unique).sort((a, b) => a.localeCompare(b)))
          setError('')
        }
      } catch {
        if (isMounted) {
          setError('Unable to load symptoms offline.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadSymptoms()

    return () => {
      isMounted = false
    }
  }, [])

  const selectedSet = useMemo(() => new Set(selected), [selected])
  const symptomMap = useMemo(() => {
    const map = new Map()
    symptoms.forEach((symptom) => map.set(normalize(symptom), symptom))
    return map
  }, [symptoms])

  const filteredSymptoms = useMemo(() => {
    const query = normalize(search)
    if (!query) return symptoms
    return symptoms.filter((symptom) => normalize(symptom).includes(query))
  }, [search, symptoms])

  function toggleSymptom(symptom) {
    setSelected((prev) =>
      prev.includes(symptom) ? prev.filter((item) => item !== symptom) : [...prev, symptom],
    )
  }

  function addByText(text) {
    const parts = parseTranscript(text)
    if (parts.length === 0) return

    setSelected((prev) => {
      const next = new Set(prev)
      parts.forEach((part) => {
        const normalized = normalize(part)
        if (!normalized) return

        if (symptomMap.has(normalized)) {
          next.add(symptomMap.get(normalized))
          return
        }

        const partialMatch = symptoms.find((symptom) =>
          normalize(symptom).includes(normalized),
        )
        if (partialMatch) {
          next.add(partialMatch)
        }
      })
      return Array.from(next)
    })
  }

  function handleAddEntry() {
    if (!entry.trim()) return
    addByText(entry)
    setEntry('')
  }

  function handleMicClick() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setMicError('Voice input is not supported in this browser.')
      return
    }

    if (micStatus === 'listening' && recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setMicStatus('listening')
      setMicError('')
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      addByText(transcript)
    }

    recognition.onerror = (event) => {
      setMicError(event.error || 'Microphone error')
    }

    recognition.onend = () => {
      setMicStatus('idle')
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  async function handleCheck() {
    if (checking) return
    setChecking(true)
    setAiStatus('Checking with local rules...')

    try {
      const matches = await scoreSymptoms(selected)
      const risk = calculateRisk(matches)
      let aiAssessment = {
        status: 'unavailable',
        model: getOllamaSettings().model,
        summary: 'Local Ollama review was not available. Rule-based results are shown.',
        nextSteps: [],
        redFlags: [],
        confidence: 'low',
        disclaimer:
          'This is not a diagnosis. Seek professional medical care for urgent or worsening symptoms.',
      }

      try {
        setAiStatus('Asking Ollama on this device...')
        aiAssessment = await generateOllamaAssessment({
          selectedSymptoms: selected,
          matches,
          risk,
        })
      } catch (error) {
        aiAssessment.error =
          error.name === 'AbortError'
            ? 'Ollama took too long to respond.'
            : 'Ollama is not reachable or the selected model is not installed.'
      }

      onResults({
        selectedSymptoms: selected,
        matches,
        risk,
        aiAssessment,
      })
    } finally {
      setChecking(false)
      setAiStatus('')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">SmartCare</p>
          <h1 className="mt-3 text-3xl font-semibold">Symptom checker</h1>
          <p className="mt-2 text-slate-600">
            Select symptoms that match how you feel. Everything runs locally on your
            device.
          </p>
        </header>

        <div className="mb-6 flex items-center gap-3 text-sm font-medium text-slate-600">
          <span className={step === 1 ? 'text-slate-900' : 'text-slate-400'}>Step 1</span>
          <span className="text-slate-300">→</span>
          <span className={step === 2 ? 'text-slate-900' : 'text-slate-400'}>Step 2</span>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">Loading symptoms from device...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            {step === 1 && (
              <div>
                <div className="flex flex-wrap gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Search symptoms
                    </label>
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Type to filter symptoms"
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Add by text or voice
                    </label>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={entry}
                        onChange={(event) => setEntry(event.target.value)}
                        placeholder="e.g. fever, cough"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddEntry}
                        className="rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:border-slate-300"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={handleMicClick}
                        className={`rounded-lg px-3 text-sm font-semibold text-white ${
                          micStatus === 'listening'
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                      >
                        {micStatus === 'listening' ? 'Listening...' : 'Mic'}
                      </button>
                    </div>
                    {micError && (
                      <p className="mt-2 text-xs text-amber-700">{micError}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
                  {filteredSymptoms.map((symptom) => (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => toggleSymptom(symptom)}
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                        selectedSet.has(symptom)
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    Selected: <span className="font-semibold">{selected.length}</span>
                  </p>
                  <button
                    type="button"
                    disabled={selected.length === 0}
                    onClick={() => setStep(2)}
                    className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-lg font-semibold">Review symptoms</h2>
                {selected.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-600">No symptoms selected.</p>
                ) : (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {selected.map((symptom) => (
                      <li
                        key={symptom}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                      >
                        {symptom}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={selected.length === 0 || checking}
                    onClick={handleCheck}
                    className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {checking ? 'Checking...' : 'Check now'}
                  </button>
                </div>
                {aiStatus && (
                  <p className="mt-3 text-sm font-medium text-slate-600">{aiStatus}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

export default SymptomInputScreen
