import { parse } from 'node-html-parser'
import type { RawBookmark } from './types'

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function parseBookmarksFromHtml(html: string, source: 'chrome' | 'tabbit'): RawBookmark[] {
  const root = parse(html)
  const bookmarks: RawBookmark[] = []
  const folderStack: string[] = []

  function traverse(node: ReturnType<typeof parse>) {
    for (const child of node.childNodes) {
      const tag = (child as { tagName?: string }).tagName?.toUpperCase()

      if (tag === 'H3') {
        folderStack.push(child.text.trim())
      } else if (tag === 'A') {
        const el = child as unknown as { getAttribute: (k: string) => string | null; text: string }
        const href = el.getAttribute('href') ?? ''
        if (!href || href.startsWith('javascript:') || href.startsWith('place:')) continue

        const addDateStr = el.getAttribute('add_date') ?? el.getAttribute('ADD_DATE')
        const addDate = addDateStr ? new Date(parseInt(addDateStr) * 1000) : undefined
        const title = child.text.trim() || extractDomain(href)

        bookmarks.push({
          url: href,
          title,
          addDate,
          folder: folderStack[folderStack.length - 1],
          source,
        })
      } else if ('childNodes' in child) {
        traverse(child as ReturnType<typeof parse>)
        if (tag === 'DL') {
          folderStack.pop()
        }
      }
    }
  }

  traverse(root)
  return bookmarks
}

export function parseChromeBookmarks(html: string): RawBookmark[] {
  return parseBookmarksFromHtml(html, 'chrome')
}

export function parseTabbitBookmarks(html: string): RawBookmark[] {
  return parseBookmarksFromHtml(html, 'tabbit')
}
