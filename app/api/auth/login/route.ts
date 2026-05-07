import { NextRequest, NextResponse } from 'next/server'
import {
  ATTEMPT_COOKIE,
  AUTH_COOKIE,
  LOCK_COOKIE,
  attemptCookieOptions,
  createSessionToken,
  getLoginCode,
  sessionCookieOptions,
} from '@/lib/auth/session'

const MAX_ATTEMPTS = 10

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status })
}

export async function POST(request: NextRequest) {
  const expectedCode = getLoginCode()
  if (!expectedCode || !/^\d{6}$/.test(expectedCode)) {
    return json({ ok: false, error: 'LOGIN_CODE_NOT_CONFIGURED' }, 503)
  }

  if (request.cookies.get(LOCK_COOKIE)?.value === '1') {
    return json({ ok: false, locked: true, attemptsRemaining: 0 }, 423)
  }

  let body: { code?: unknown } = {}
  try {
    body = await request.json()
  } catch {
    return json({ ok: false, error: 'INVALID_REQUEST' }, 400)
  }

  const code = typeof body.code === 'string' ? body.code : ''
  const attempts = Number(request.cookies.get(ATTEMPT_COOKIE)?.value ?? '0')
  const normalizedAttempts = Number.isFinite(attempts) ? Math.max(0, attempts) : 0

  if (code === expectedCode) {
    const token = await createSessionToken()
    if (!token) return json({ ok: false, error: 'SESSION_UNAVAILABLE' }, 503)

    const response = json({ ok: true, redirectTo: '/' })
    response.cookies.set(AUTH_COOKIE, token, sessionCookieOptions)
    response.cookies.delete(ATTEMPT_COOKIE)
    response.cookies.delete(LOCK_COOKIE)
    return response
  }

  const nextAttempts = normalizedAttempts + 1
  const locked = nextAttempts >= MAX_ATTEMPTS
  const response = json(
    {
      ok: false,
      locked,
      attemptsRemaining: Math.max(0, MAX_ATTEMPTS - nextAttempts),
      error: 'INVALID_CODE',
    },
    locked ? 423 : 401,
  )

  response.cookies.set(ATTEMPT_COOKIE, String(nextAttempts), attemptCookieOptions)
  if (locked) {
    response.cookies.set(LOCK_COOKIE, '1', attemptCookieOptions)
  }

  return response
}
