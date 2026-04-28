import { NextRequest, NextResponse } from 'next/server'
import { parseChromeBookmarks, parseTabbitBookmarks } from '@/lib/parser/bookmark-parser'
import { generateDeduplicationReport } from '@/lib/dedup/dedup-engine'
import type { RawBookmark } from '@/lib/parser/types'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const allBookmarks: RawBookmark[] = []

    for (const file of files.slice(0, 2)) {
      const html = await file.text()
      const isTabbit = file.name.toLowerCase().includes('tabbit')
      const bookmarks = isTabbit
        ? parseTabbitBookmarks(html)
        : parseChromeBookmarks(html)
      allBookmarks.push(...bookmarks)
    }

    const report = generateDeduplicationReport(allBookmarks)
    return NextResponse.json(report)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Parse failed' },
      { status: 500 }
    )
  }
}
