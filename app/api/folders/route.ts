import { NextResponse } from 'next/server'
import { db } from '@/lib/db/prisma'

interface CategoryNode {
  name: string
  totalCount: number
  subfolders: { name: string; count: number }[]
}

export async function GET() {
  const bookmarks = await db.bookmark.findMany({
    select: { category: true, subfolder: true, folder: true },
  })

  const catMap = new Map<string, Map<string, number>>()

  for (const b of bookmarks) {
    const catName = b.category?.trim() || '未分类'
    const subName = b.subfolder?.trim() || b.folder?.trim() || '未分类'

    if (!catMap.has(catName)) catMap.set(catName, new Map())
    const subMap = catMap.get(catName)!
    subMap.set(subName, (subMap.get(subName) ?? 0) + 1)
  }

  const categories: CategoryNode[] = Array.from(catMap.entries())
    .map(([catName, subMap]) => {
      const subfolders = Array.from(subMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
      const totalCount = subfolders.reduce((s, f) => s + f.count, 0)
      return { name: catName, totalCount, subfolders }
    })
    .sort((a, b) => b.totalCount - a.totalCount)

  return NextResponse.json(categories)
}
