export const AUTH_COOKIE = 'bookbrain_session'
export const ATTEMPT_COOKIE = 'bookbrain_attempts'
export const LOCK_COOKIE = 'bookbrain_locked'

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14
const encoder = new TextEncoder()

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function getSecret() {
  const password = process.env.BOOKBRAIN_LOGIN_CODE || process.env.BOOKBRAIN_AUTH_PASSWORD
  if (!password) return null
  return `${password}:${process.env.DATABASE_URL ?? 'bookbrain'}`
}

async function sign(payload: string) {
  const secret = getSecret()
  if (!secret) return null

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return bytesToBase64Url(new Uint8Array(signature))
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

export function getLoginCode() {
  return process.env.BOOKBRAIN_LOGIN_CODE || process.env.BOOKBRAIN_AUTH_PASSWORD || null
}

export async function createSessionToken() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  const payload = `v1.${expiresAt}`
  const signature = await sign(payload)
  if (!signature) return null
  return `${payload}.${signature}`
}

export async function verifySessionToken(token: string | undefined) {
  if (!token) return false

  const parts = token.split('.')
  if (parts.length !== 3 || parts[0] !== 'v1') return false

  const expiresAt = Number(parts[1])
  if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
    return false
  }

  const expected = await sign(`${parts[0]}.${parts[1]}`)
  if (!expected) return false
  return timingSafeEqual(parts[2], expected)
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
}

export const attemptCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}
