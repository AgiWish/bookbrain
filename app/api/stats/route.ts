import { NextResponse } from 'next/server'
import { db } from '@/lib/db/prisma'

export async function GET() {
  const [total, processed, tagCount, topTags] = await Promise.all([
    db.bookmark.count(),
    db.bookmark.count({ where: { aiProcessedAt: { not: null } } }),
    db.tag.count(),
    db.tag.findMany({
      include: { _count: { select: { bookmarks: true } } },
      orderBy: { bookmarks: { _count: 'desc' } },
      take: 20,
    }),
  ])

  return NextResponse.json({
    total,
    processed,
    pending: total - processed,
    tagCount,
    topTags: topTags.map((t) => ({ name: t.name, count: t._count.bookmarks })),
  })
}
