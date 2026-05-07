import { parse } from 'node-html-parser'
import type { RawBookmark } from './types'
import { resolveCategory } from './category-map'

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

const ROOT_FOLDERS = ['书签栏', 'Bookmarks Bar', 'Bookmarks', '谷歌浏览器书签', '其他书签', 'Other Bookmarks']

function resolveHierarchy(folderStack: string[]): { category?: string; subfolder?: string; folder?: string } {
  const filtered = folderStack.filter(f => !ROOT_FOLDERS.includes(f))
  if (filtered.length >= 2) {
    const rawCategory = filtered[filtered.length - 2]
    const subfolder = filtered[filtered.length - 1]
    // Map raw folder name to 4-char category, or keep raw if unmapped
    const category = resolveCategory(rawCategory) ?? rawCategory
    return { category, subfolder, folder: subfolder }
  } else if (filtered.length === 1) {
    const name = filtered[0]
    const category = resolveCategory(name) ?? undefined
    return { category, subfolder: name, folder: name }
  }
  return {}
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
        const hierarchy = resolveHierarchy(folderStack)

        bookmarks.push({
          url: href,
          title,
          addDate,
          ...hierarchy,
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
