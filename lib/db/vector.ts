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

  const results = await db.$queryRaw<Array<{ bookmark_id: string; similarity: number }>>`
    SELECT
      be.bookmark_id,
      1 - (be.embedding <=> ${vectorStr}::vector) AS similarity
    FROM bookmark_embeddings be
    WHERE be.embedding IS NOT NULL
      ${excludeId ? db.$queryRaw`AND be.bookmark_id != ${excludeId}` : db.$queryRaw``}
    ORDER BY be.embedding <=> ${vectorStr}::vector
    LIMIT ${topK}
  `

  return results
    .filter((r) => r.similarity > 0.3)
    .map((r) => ({ bookmarkId: r.bookmark_id, similarity: r.similarity }))
}
