// src/utils/crypto.js
// AES-GCM encryption using Web Crypto API with PBKDF2 key derivation.
// Everything happens locally — the password never leaves the browser.

const ENCODER = new TextEncoder()
const DECODER = new TextDecoder()

function bufToBase64(buf) {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function base64ToBuf(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

async function deriveKey(password, salt, iterations = 150000) {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    ENCODER.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptText(plainText, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt)

  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    ENCODER.encode(plainText)
  )

  return {
    cipher: bufToBase64(cipherBuf),
    salt: bufToBase64(salt),
    iv: bufToBase64(iv),
    v: 1,
  }
}

export async function decryptText(payload, password) {
  const salt = new Uint8Array(base64ToBuf(payload.salt))
  const iv = new Uint8Array(base64ToBuf(payload.iv))
  const cipher = base64ToBuf(payload.cipher)
  const key = await deriveKey(password, salt)

  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    cipher
  )

  return DECODER.decode(plainBuf)
}

export async function encryptNote(note, password) {
  const payload = {
    title: note.title || '',
    body: note.body || '',
    category: note.category || '',
    folder: note.folder || '',
    tags: note.tags || [],
    color: note.color || 'plain',
    favorite: !!note.favorite,
    pinned: !!note.pinned,
    items: note.items || [],
    type: note.type || 'text',
  }
  return encryptText(JSON.stringify(payload), password)
}

export async function decryptNote(encrypted, password) {
  const json = await decryptText(encrypted, password)
  return JSON.parse(json)
}