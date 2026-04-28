export interface RawBookmark {
  url: string
  title: string
  addDate?: Date
  folder?: string
  source: 'chrome' | 'tabbit'
}

export interface ParsedBookmarkFile {
  source: 'chrome' | 'tabbit'
  bookmarks: RawBookmark[]
  folders: string[]
}

export interface ImportResult {
  total: number
  imported: number
  duplicates: number
  errors: number
}
