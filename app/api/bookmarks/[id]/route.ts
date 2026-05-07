import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/prisma'
import { normalizeBookmarkUrl } from '@/lib/bookmarks/url'

function serializeBookmark(b: {
  id: string
  title: string
  url: string
  description: string | null
  faviconUrl: string | null
  folder: string | null
  category: string | null
  subfolder: string | null
  source: string
  pinned: boolean
  aiProcessedAt: Date | null
  importedAt: Date
  tags: { tag: { name: string } }[]
}) {
  return {
    id: b.id,
    title: b.title,
    url: b.url,
    summary: b.description ?? undefined,
    favicon: b.faviconUrl ?? undefined,
    folder: b.folder ?? undefined,
    category: b.category ?? undefined,
    subfolder: b.subfolder ?? undefined,
    source: b.source,
    pinned: b.pinned,
    processed: b.aiProcessedAt !== null,
    importedAt: b.importedAt,
    tags: b.tags.map((bt) => bt.tag.name),
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const bookmark = await db.bookmark.findUnique({
    where: { id },
    include: { tags: { include: { tag: true } } },
  })

  if (!bookmark) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(serializeBookmark(bookmark))
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let body: { url?: string; title?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '请求体格式错误' }, { status: 400 })
  }

  const updates: { url?: string; title?: string } = {}

  if (typeof body.url === 'string' && body.url.trim()) {
    let normalized: string
    try {
      normalized = normalizeBookmarkUrl(body.url)
    } catch {
      return NextResponse.json({ error: '网址格式不正确' }, { status: 400 })
    }
    // Block clashes with another bookmark (allow no-op self-update).
    const conflict = await db.bookmark.findFirst({
      where: { url: normalized, NOT: { id } },
      select: { id: true },
    })
    if (conflict) {
      return NextResponse.json(
        { error: '该网址已被其他书签使用' },
        { status: 409 }
      )
    }
    updates.url = normalized
  }

  if (typeof body.title === 'string' && body.title.trim()) {
    updates.title = body.title.trim().slice(0, 500)
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: '没有要更新的字段' }, { status: 400 })
  }

  try {
    const bookmark = await db.bookmark.update({
      where: { id },
      data: updates,
      include: { tags: { include: { tag: true } } },
    })
    return NextResponse.json({ bookmark: serializeBookmark(bookmark) })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const bookmark = await db.bookmark.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!bookmark) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db.bookmarkTag.deleteMany({
    where: { bookmarkId: id },
  })

  await db.bookmarkEmbedding.deleteMany({
    where: { bookmarkId: id },
  })

  await db.bookmark.delete({
    where: { id },
  })

  const orphanTags = await db.tag.findMany({
    where: { bookmarks: { none: {} } },
    select: { id: true },
  })

  if (orphanTags.length > 0) {
    await db.tag.deleteMany({
      where: { id: { in: orphanTags.map((tag) => tag.id) } },
    })
  }

  return NextResponse.json({
    deleted: 1,
    orphanTagsRemoved: orphanTags.length,
  })
}
