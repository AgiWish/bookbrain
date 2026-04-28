import { NextResponse } from 'next/server'
import { db } from '@/lib/db/prisma'

export async function GET() {
  const tags = await db.tag.findMany({
    include: { _count: { select: { bookmarks: true } } },
    orderBy: { bookmarks: { _count: 'desc' } },
  })

  return NextResponse.json(
    tags.map((t) => ({ ...t, bookmarkCount: t._count.bookmarks }))
  )
}
