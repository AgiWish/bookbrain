import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/prisma'
import { deduplicateBookmarks } from '@/lib/dedup/dedup-engine'
import type { RawBookmark } from '@/lib/parser/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { bookmarks: RawBookmark[] }
    const { bookmarks } = body

    if (!Array.isArray(bookmarks) || bookmarks.length === 0) {
      return NextResponse.json({ error: 'No bookmarks provided' }, { status: 400 })
    }

    const { unique } = deduplicateBookmarks(bookmarks)

    const result = await db.$transaction(async (tx) => {
      const created = await tx.bookmark.createMany({
        data: unique.map((b) => ({
          url: b.url,
          title: b.title,
          folder: b.folder,
          category: b.category,
          subfolder: b.subfolder,
          source: b.source,
          addDate: b.addDate ? new Date(b.addDate as unknown as string) : undefined,
        })),
        skipDuplicates: true,
      })

      return created
    })

    return NextResponse.json({
      total: bookmarks.length,
      imported: result.count,
      duplicates: bookmarks.length - unique.length,
      errors: 0,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    )
  }
}
