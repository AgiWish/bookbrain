import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/prisma'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const bookmark = await db.bookmark.findUnique({
    where: { id },
    select: { pinned: true },
  })

  if (!bookmark) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await db.bookmark.update({
    where: { id },
    data: { pinned: !bookmark.pinned },
    select: { id: true, pinned: true },
  })

  return NextResponse.json(updated)
}
