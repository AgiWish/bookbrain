import { db } from '../db/prisma'
import { generateEmbedding } from './embeddings'

export async function vectorizeBookmark(bookmarkId: string): Promise<void> {
  const bookmark = await db.bookmark.findUnique({
    where: { id: bookmarkId },
    include: { tags: { include: { tag: true } } },
  })

  if (!bookmark) throw new Error(`Bookmark ${bookmarkId} not found`)

  const text = [
    bookmark.title,
    bookmark.description ?? '',
    bookmark.tags.map((bt) => bt.tag.name).join(' '),
  ]
    .filter(Boolean)
    .join(' ')

  const embedding = await generateEmbedding(text)
  const vectorStr = `[${embedding.join(',')}]`

  await db.$executeRaw`
    INSERT INTO bookmark_embeddings (id, "bookmarkId", embedding, "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, ${bookmarkId}, ${vectorStr}::vector, NOW(), NOW())
    ON CONFLICT ("bookmarkId")
    DO UPDATE SET embedding = EXCLUDED.embedding, "updatedAt" = NOW()
  `
}
