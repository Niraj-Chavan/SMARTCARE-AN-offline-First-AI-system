function toBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function fromBase64(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function deriveKey() {
  const fingerprint = `${navigator.userAgent}|${screen.width}x${screen.height}`
  const encoder = new TextEncoder()
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(fingerprint),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('smartcare-device-salt'),
      iterations: 120000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptData(plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey()
  const encoder = new TextEncoder()

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext),
  )

  return {
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertext),
  }
}

export async function decryptData({ iv, ciphertext }) {
  if (!iv || !ciphertext) return ''
  const key = await deriveKey()
  const decoder = new TextDecoder()

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(iv) },
    key,
    fromBase64(ciphertext),
  )

  return decoder.decode(plaintext)
}

export default { encryptData, decryptData }
