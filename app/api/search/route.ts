import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/prisma'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { findSimilarBookmarks } from '@/lib/db/vector'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  const mode = searchParams.get('mode') ?? 'keyword'
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')

  if (!q) return NextResponse.json({ results: [], total: 0 })

  if (mode === 'semantic') {
    const embedding = await generateEmbedding(q)
    const similar = await findSimilarBookmarks(embedding, limit)
    const bookmarks = await db.bookmark.findMany({
      where: { id: { in: similar.map((s) => s.bookmarkId) } },
      include: { tags: { include: { tag: true } } },
    })
    return NextResponse.json({ results: bookmarks, total: bookmarks.length })
  }

  // keyword search
  const where = {
    OR: [
      { title: { contains: q, mode: 'insensitive' as const } },
      { description: { contains: q, mode: 'insensitive' as const } },
      { url: { contains: q, mode: 'insensitive' as const } },
    ],
  }

  const [results, total] = await Promise.all([
    db.bookmark.findMany({
      where,
      include: { tags: { include: { tag: true } } },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.bookmark.count({ where }),
  ])

  return NextResponse.json({ results, total, page, limit })
}
