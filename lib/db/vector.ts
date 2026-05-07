import { Prisma } from '@prisma/client'
import { db } from './prisma'

interface SimilarBookmark {
  bookmarkId: string
  similarity: number
}

export async function findSimilarBookmarks(
  embedding: number[],
  topK: number = 5,
  excludeId?: string
): Promise<SimilarBookmark[]> {
  const vectorStr = `[${embedding.join(',')}]`
  const excludeClause = excludeId
    ? Prisma.sql`AND be."bookmarkId" != ${excludeId}`
    : Prisma.empty

  try {
    // Use explicit snake_case aliases to avoid driver adapter camelCase issues
    const results = await db.$queryRaw<Array<{ bid: string; similarity: number }>>`
      SELECT
        be."bookmarkId" AS bid,
        1 - (be.embedding <=> ${vectorStr}::vector) AS similarity
      FROM bookmark_embeddings be
      WHERE be.embedding IS NOT NULL
        ${excludeClause}
      ORDER BY be.embedding <=> ${vectorStr}::vector
      LIMIT ${topK}
    `

    return results
      .filter((r) => r.similarity > 0.3)
      .map((r) => ({ bookmarkId: r.bid, similarity: r.similarity }))
  } catch {
    return []
  }
}

export async function getBookmarkEmbedding(bookmarkId: string): Promise<number[] | null> {
  try {
    const rows = await db.$queryRaw<Array<{ emb: string | null }>>`
      SELECT embedding::text AS emb
      FROM bookmark_embeddings
      WHERE "bookmarkId" = ${bookmarkId}
      LIMIT 1
    `

    const embedding = rows[0]?.emb
    if (!embedding) return null

    return embedding
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value))
  } catch {
    return null
  }
}
