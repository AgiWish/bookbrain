import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/prisma'
import { findSimilarBookmarks } from '@/lib/db/vector'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const embedding = await db.bookmarkEmbedding.findUnique({
    where: { bookmarkId: params.id },
  })

  if (!embedding || !embedding.embedding) {
    return NextResponse.json([])
  }

  const similar = await findSimilarBookmarks(
    embedding.embedding as unknown as number[],
    5,
    params.id
  )

  const bookmarks = await db.bookmark.findMany({
    where: { id: { in: similar.map((s) => s.bookmarkId) } },
    include: { tags: { include: { tag: true } } },
  })

  return NextResponse.json(bookmarks)
}
