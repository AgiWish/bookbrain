import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') ?? '100')

  const bookmarks = await db.bookmark.findMany({
    take: limit,
    include: { tags: { include: { tag: true } } },
    orderBy: { importedAt: 'desc' },
  })

  const nodes = bookmarks.map((b) => ({
    id: b.id,
    title: b.title,
    url: b.url,
    tag: b.tags[0]?.tag.name ?? 'other',
    val: Math.max(1, b.tags.length),
  }))

  // Simple edges: connect bookmarks sharing same tags
  const links: Array<{ source: string; target: string; similarity: number }> = []
  const tagToBookmarks = new Map<string, string[]>()

  for (const b of bookmarks) {
    for (const bt of b.tags) {
      const list = tagToBookmarks.get(bt.tag.name) ?? []
      list.push(b.id)
      tagToBookmarks.set(bt.tag.name, list)
    }
  }

  for (const [, ids] of tagToBookmarks) {
    for (let i = 0; i < ids.length - 1 && links.length < 500; i++) {
      for (let j = i + 1; j < ids.length && links.length < 500; j++) {
        links.push({ source: ids[i], target: ids[j], similarity: 0.8 })
      }
    }
  }

  return NextResponse.json({ nodes, links })
}
