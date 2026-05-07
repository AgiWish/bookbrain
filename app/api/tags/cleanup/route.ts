import { NextResponse } from 'next/server'
import { db } from '@/lib/db/prisma'

// DELETE /api/tags/cleanup?minCount=2
// Removes tags that appear on fewer than minCount bookmarks
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const minCount = parseInt(searchParams.get('minCount') ?? '2')

  // Find tags with very few bookmarks, including orphaned tags.
  const allTags = await db.tag.findMany({
    include: { _count: { select: { bookmarks: true } } },
  })

  const toDelete = allTags
    .filter((t) => t._count.bookmarks < minCount)
    .map((t) => t.id)

  if (toDelete.length === 0) {
    return NextResponse.json({ deleted: 0, message: 'Nothing to clean up' })
  }

  // Delete bookmark_tag associations first, then tags
  await db.bookmarkTag.deleteMany({ where: { tagId: { in: toDelete } } })
  const { count } = await db.tag.deleteMany({ where: { id: { in: toDelete } } })

  return NextResponse.json({
    deleted: count,
    message: `Removed ${count} noise tags (< ${minCount} bookmarks)`,
  })
}

export async function GET() {
  const allTags = await db.tag.findMany({
    include: { _count: { select: { bookmarks: true } } },
  })
  const stats = {
    total: allTags.length,
    singleton: allTags.filter((t) => t._count.bookmarks === 1).length,
    empty: allTags.filter((t) => t._count.bookmarks === 0).length,
    meaningful: allTags.filter((t) => t._count.bookmarks >= 3).length,
  }
  return NextResponse.json(stats)
}
