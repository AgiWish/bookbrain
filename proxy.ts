import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE, verifySessionToken } from '@/lib/auth/session'

const PUBLIC_PATHS = new Set(['/api/auth/login', '/api/health'])
const EXTENSION_API_PATHS = ['/api/bookmarks', '/api/search', '/api/stats', '/api/tags', '/api/folders']

function loginRedirect(request: NextRequest) {
  const loginUrl = new URL('/login', request.url)
  const next = `${request.nextUrl.pathname}${request.nextUrl.search}`
  if (next !== '/') loginUrl.searchParams.set('next', next)
  return NextResponse.redirect(loginUrl)
}

export async function proxy(request: NextRequest) {
  const loginCode = process.env.BOOKBRAIN_LOGIN_CODE || process.env.BOOKBRAIN_AUTH_PASSWORD

  if (!loginCode || !/^\d{6}$/.test(loginCode)) {
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse('BOOKBRAIN_LOGIN_CODE must be a 6 digit code in production', {
        status: 503,
      })
    }
  }

  const pathname = request.nextUrl.pathname
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next()

  const extensionToken = process.env.BOOKBRAIN_EXTENSION_TOKEN
  const requestToken = request.headers.get('x-bookbrain-extension-token')
  if (
    extensionToken &&
    requestToken === extensionToken &&
    EXTENSION_API_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  ) {
    return NextResponse.next()
  }

  const isAuthed = await verifySessionToken(request.cookies.get(AUTH_COOKIE)?.value)
  if (pathname === '/login') {
    return isAuthed ? NextResponse.redirect(new URL('/', request.url)) : NextResponse.next()
  }

  return isAuthed ? NextResponse.next() : loginRedirect(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)',
  ],
}
