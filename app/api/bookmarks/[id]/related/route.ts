import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/prisma'
import { findSimilarBookmarks, getBookmarkEmbedding } from '@/lib/db/vector'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const embedding = await getBookmarkEmbedding(id)

    if (!embedding) {
      return NextResponse.json([])
    }

    const similar = await findSimilarBookmarks(embedding, 5, id)

    if (!similar.length) {
      return NextResponse.json([])
    }

    const bookmarks = await db.bookmark.findMany({
      where: { id: { in: similar.map((s) => s.bookmarkId) } },
      include: { tags: { include: { tag: true } } },
    })

    return NextResponse.json(
      bookmarks.map((b) => ({
        id: b.id,
        title: b.title,
        url: b.url,
        tags: b.tags.map((bt) => bt.tag.name),
      }))
    )
  } catch {
    return NextResponse.json([])
  }
}
