import type { RawBookmark } from '../parser/types'
import type { DeduplicationReport, DuplicatePair } from './types'
import { normalizeUrl } from './url-normalizer'

export function deduplicateBookmarks(bookmarks: RawBookmark[]): {
  unique: RawBookmark[]
  duplicates: DuplicatePair[]
} {
  const seen = new Map<string, RawBookmark>()
  const duplicates: DuplicatePair[] = []

  for (const bookmark of bookmarks) {
    const key = normalizeUrl(bookmark.url)
    if (seen.has(key)) {
      const existing = seen.get(key)!
      // Prefer chrome source
      if (bookmark.source === 'chrome' && existing.source !== 'chrome') {
        duplicates.push({ kept: bookmark, removed: existing })
        seen.set(key, bookmark)
      } else {
        duplicates.push({ kept: existing, removed: bookmark })
      }
    } else {
      seen.set(key, bookmark)
    }
  }

  return {
    unique: Array.from(seen.values()),
    duplicates,
  }
}

export function generateDeduplicationReport(
  bookmarks: RawBookmark[]
): DeduplicationReport {
  const { unique, duplicates } = deduplicateBookmarks(bookmarks)
  return {
    totalInput: bookmarks.length,
    uniqueCount: unique.length,
    duplicateCount: duplicates.length,
    duplicatePairs: duplicates,
  }
}
