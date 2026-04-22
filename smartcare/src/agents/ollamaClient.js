const OLLAMA_URL_KEY = 'smartcare_ollama_url'
const OLLAMA_MODEL_KEY = 'smartcare_ollama_model'
const DEFAULT_OLLAMA_URL = 'http://localhost:11434'
const DEFAULT_OLLAMA_MODEL = 'llama3.2'

function readSetting(key, fallback) {
  if (typeof localStorage === 'undefined') return fallback
  return localStorage.getItem(key) || fallback
}

function withTimeout(ms = 30000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), ms)
  return { controller, timeoutId }
}

function normalizeBaseUrl(value) {
  return (value || DEFAULT_OLLAMA_URL).replace(/\/+$/, '')
}

function extractJson(text) {
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  }
}

export function getOllamaSettings() {
  return {
    baseUrl: readSetting(OLLAMA_URL_KEY, DEFAULT_OLLAMA_URL),
    model: readSetting(OLLAMA_MODEL_KEY, DEFAULT_OLLAMA_MODEL),
  }
}

export function saveOllamaSettings({ baseUrl, model }) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(OLLAMA_URL_KEY, normalizeBaseUrl(baseUrl))
  localStorage.setItem(OLLAMA_MODEL_KEY, model || DEFAULT_OLLAMA_MODEL)
}

export async function listOllamaModels(settings = getOllamaSettings()) {
  const { controller, timeoutId } = withTimeout(8000)

  try {
    const response = await fetch(`${normalizeBaseUrl(settings.baseUrl)}/api/tags`, {
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error('Ollama is not responding')
    }
    const data = await response.json()
    return Array.isArray(data.models) ? data.models : []
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function checkOllamaHealth(settings = getOllamaSettings()) {
  try {
    const models = await listOllamaModels(settings)
    const selectedModel = settings.model || DEFAULT_OLLAMA_MODEL
    const hasSelectedModel = models.some((model) => model.name === selectedModel)

    return {
      ok: true,
      models,
      hasSelectedModel,
      message: hasSelectedModel
        ? `${selectedModel} is ready`
        : `Ollama is running, but ${selectedModel} is not installed`,
    }
  } catch (error) {
    return {
      ok: false,
      models: [],
      hasSelectedModel: false,
      message:
        error.name === 'AbortError'
          ? 'Ollama timed out'
          : 'Ollama is not reachable on this device',
    }
  }
}

export async function generateOllamaAssessment({
  selectedSymptoms = [],
  matches = [],
  risk,
  settings = getOllamaSettings(),
}) {
  const model = settings.model || DEFAULT_OLLAMA_MODEL
  const baseUrl = normalizeBaseUrl(settings.baseUrl)
  const topMatches = matches.slice(0, 5).map((match) => ({
    name: match.name,
    riskLevel: match.riskLevel,
    matchPercent: match.matchPercent,
    matchedSymptoms: match.matchedSymptoms,
    recommendations: match.recommendations,
  }))

  const prompt = `You are SmartCare's local offline assistant. Do not diagnose. Use only the provided symptoms and condition matches. Return strict JSON with keys summary, nextSteps, redFlags, confidence, disclaimer.

Symptoms: ${selectedSymptoms.join(', ') || 'none'}
Rule based risk: ${risk?.label || 'Unknown'} - ${risk?.recommendation || ''}
Condition matches: ${JSON.stringify(topMatches)}

Keep summary under 35 words. nextSteps and redFlags must be arrays of short strings. confidence must be low, medium, or high.`

  const { controller, timeoutId } = withTimeout(45000)

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.2,
        },
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error('Ollama generation failed')
    }

    const data = await response.json()
    const parsed = extractJson(data.response)

    if (!parsed) {
      throw new Error('Ollama returned an unreadable response')
    }

    return {
      status: 'ready',
      model,
      summary: parsed.summary || 'Local AI review completed.',
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
      redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
      confidence: parsed.confidence || 'low',
      disclaimer:
        parsed.disclaimer ||
        'This is not a diagnosis. Seek professional medical care for urgent or worsening symptoms.',
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

export const ollamaStorageKeys = {
  url: OLLAMA_URL_KEY,
  model: OLLAMA_MODEL_KEY,
}
