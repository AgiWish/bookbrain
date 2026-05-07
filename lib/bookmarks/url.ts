/**
 * Normalize a user-provided URL into a canonical form suitable for storage.
 * Adds https:// if missing, validates the protocol, and lets URL canonicalize
 * the rest. Throws if the URL is invalid or uses a non-http(s) scheme.
 */
export function normalizeBookmarkUrl(input: string): string {
  const trimmed = input.trim()
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  const url = new URL(withProtocol)
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only http(s) URLs are supported')
  }
  return url.href
}
