import { NextRequest, NextResponse } from 'next/server'

function normalizeBookmarkUrl(input: string): string {
  const trimmed = input.trim()
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  const url = new URL(withProtocol)
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only http(s) URLs are supported')
  }
  return url.href
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function extractMeta(html: string, name: string): string | undefined {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${escaped}["'][^>]*>`, 'i'),
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)?.[1]?.trim()
    if (match) return decodeEntities(match)
  }
  return undefined
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim()
  return match ? decodeEntities(match.replace(/\s+/g, ' ')) : undefined
}

function extractFavicon(html: string, pageUrl: string): string | undefined {
  const match = html.match(/<link[^>]+rel=["'][^"']*(?:icon|shortcut icon|apple-touch-icon)[^"']*["'][^>]*>/i)?.[0]
  const href = match?.match(/href=["']([^"']+)["']/i)?.[1]
  try {
    return href ? new URL(href, pageUrl).href : new URL('/favicon.ico', pageUrl).href
  } catch {
    return undefined
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const input = searchParams.get('url')

  if (!input?.trim()) {
    return NextResponse.json({ error: '请提供网址' }, { status: 400 })
  }

  let url: string
  try {
    url = normalizeBookmarkUrl(input)
  } catch {
    return NextResponse.json({ error: '网址格式不正确' }, { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'BookBrainBot/0.1 (+https://book.agiwish.com)',
        Accept: 'text/html,application/xhtml+xml',
      },
    })
    clearTimeout(timer)

    const contentType = res.headers.get('content-type') ?? ''
    if (!res.ok || !contentType.includes('text/html')) {
      return NextResponse.json({ url })
    }

    const html = (await res.text()).slice(0, 300_000)
    const title = extractMeta(html, 'og:title') ?? extractTitle(html)
    const description = extractMeta(html, 'description') ?? extractMeta(html, 'og:description')
    const faviconUrl = extractFavicon(html, url)

    return NextResponse.json({
      url,
      title,
      description,
      faviconUrl,
    })
  } catch {
    return NextResponse.json({ url })
  }
}
