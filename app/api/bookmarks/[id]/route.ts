import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const bookmark = await db.bookmark.findUnique({
    where: { id: params.id },
    include: { tags: { include: { tag: true } } },
  })

  if (!bookmark) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(bookmark)
}
