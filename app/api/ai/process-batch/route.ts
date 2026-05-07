import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/prisma'
import { processBatch } from '@/lib/queue/processor'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as { bookmarkIds?: string[] }
    let ids = body.bookmarkIds

    if (!ids?.length) {
      const unprocessed: Array<{ id: string }> = await db.bookmark.findMany({
        where: { aiProcessedAt: null },
        select: { id: true },
      })
      ids = unprocessed.map((b) => b.id)
    }

    if (!ids.length) {
      return NextResponse.json({ message: 'Nothing to process', jobId: null })
    }

    const jobId = await processBatch(ids)
    return NextResponse.json({ jobId, total: ids.length })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    )
  }
}
