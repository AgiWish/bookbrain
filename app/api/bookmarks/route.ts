import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const tagsParam = searchParams.get('tags')
  const tagIds = tagsParam ? tagsParam.split(',').filter(Boolean) : []

  const where = tagIds.length
    ? { tags: { some: { tagId: { in: tagIds } } } }
    : {}

  const [bookmarks, total] = await Promise.all([
    db.bookmark.findMany({
      where,
      include: { tags: { include: { tag: true } } },
      orderBy: { importedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.bookmark.count({ where }),
  ])

  return NextResponse.json({ bookmarks, total, page, limit })
}
