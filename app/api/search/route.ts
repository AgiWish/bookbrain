import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/prisma'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { findSimilarBookmarks } from '@/lib/db/vector'
import { Prisma } from '@prisma/client'

type BookmarkWithTags = Prisma.BookmarkGetPayload<{
  include: { tags: { include: { tag: true } } }
}>

function normalize(b: BookmarkWithTags) {
  return {
    id: b.id,
    title: b.title,
    url: b.url,
    summary: b.description ?? undefined,
    favicon: b.faviconUrl ?? undefined,
    folder: b.folder ?? undefined,
    category: b.category ?? undefined,
    subfolder: b.subfolder ?? undefined,
    source: b.source,
    processed: b.aiProcessedAt !== null,
    importedAt: b.importedAt,
    tags: b.tags.map((bt) => bt.tag.name),
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  const mode = searchParams.get('mode') ?? 'keyword'
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')

  if (!q) return NextResponse.json({ results: [], total: 0 })

  // --- Keyword search helper ---
  const keywordWhere = {
    OR: [
      { title: { contains: q, mode: 'insensitive' as const } },
      { description: { contains: q, mode: 'insensitive' as const } },
      { url: { contains: q, mode: 'insensitive' as const } },
      { tags: { some: { tag: { name: { contains: q, mode: 'insensitive' as const } } } } },
    ],
  }

  if (mode === 'semantic') {
    try {
      const embedding = await generateEmbedding(q)
      const similar = await findSimilarBookmarks(embedding, limit)
      if (similar.length === 0) {
        return NextResponse.json({ results: [], total: 0 })
      }
      const bookmarks = await db.bookmark.findMany({
        where: { id: { in: similar.map((s) => s.bookmarkId) } },
        include: { tags: { include: { tag: true } } },
      })
      return NextResponse.json({ results: bookmarks.map(normalize), total: bookmarks.length })
    } catch {
      return NextResponse.json({ results: [], total: 0 })
    }
  }

  if (mode === 'hybrid') {
    // Run keyword + semantic in parallel, merge and deduplicate
    try {
      const [keywordResults, embedding] = await Promise.all([
        db.bookmark.findMany({
          where: keywordWhere,
          include: { tags: { include: { tag: true } } },
          take: limit,
        }),
        generateEmbedding(q).catch(() => null),
      ])

      const seen = new Set<string>(keywordResults.map((b) => b.id))
      let merged = [...keywordResults]

      if (embedding) {
        const similar = await findSimilarBookmarks(embedding, limit).catch(() => [])
        const semanticIds = similar.map((s) => s.bookmarkId).filter((id) => !seen.has(id))
        if (semanticIds.length > 0) {
          const semanticResults = await db.bookmark.findMany({
            where: { id: { in: semanticIds } },
            include: { tags: { include: { tag: true } } },
          })
          merged = [...merged, ...semanticResults]
        }
      }

      return NextResponse.json({ results: merged.map(normalize), total: merged.length })
    } catch {
      // Fallback to keyword only
    }
  }

  // Default: keyword search with pagination
  const [results, total] = await Promise.all([
    db.bookmark.findMany({
      where: keywordWhere,
      include: { tags: { include: { tag: true } } },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.bookmark.count({ where: keywordWhere }),
  ])

  return NextResponse.json({ results: results.map(normalize), total, page, limit })
}
