const TRACKING_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'ref', 'source', 'fbclid', 'gclid', 'msclkid', 'mc_cid', 'mc_eid',
])

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)

    // Normalize protocol
    if (parsed.protocol === 'http:') {
      parsed.protocol = 'https:'
    }

    // Remove www prefix
    parsed.hostname = parsed.hostname.replace(/^www\./, '')

    // Remove tracking params
    for (const key of [...parsed.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(key.toLowerCase())) {
        parsed.searchParams.delete(key)
      }
    }

    // Remove trailing slash from pathname
    if (parsed.pathname.endsWith('/') && parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.slice(0, -1)
    }

    // Remove hash
    parsed.hash = ''

    return parsed.toString().toLowerCase()
  } catch {
    return url.toLowerCase().trim()
  }
}
