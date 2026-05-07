import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/prisma'
import { classifyBookmark } from '@/lib/bookmarks/auto-classifier'
import { saveTagsForBookmark } from '@/lib/ai/tagger'
import { normalizeBookmarkUrl } from '@/lib/bookmarks/url'

function fallbackTitle(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

type BookmarkWithTags = Awaited<ReturnType<typeof db.bookmark.findMany>>[number] & {
  tags: { tag: { name: string } }[]
}

function normalizeBookmark(b: BookmarkWithTags) {
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const tagsParam = searchParams.get('tags')
  const folderParam = searchParams.get('folder')
  const categoryParam = searchParams.get('category')
  const subfolderParam = searchParams.get('subfolder')
  const tagNames = tagsParam ? tagsParam.split(',').filter(Boolean) : []

  const searchQuery = searchParams.get('q')
  const pinnedParam = searchParams.get('pinned')

  const where: Record<string, unknown> = {}

  if (pinnedParam === 'true') {
    where.pinned = true
  }

  // Server-side text search across title, description, url
  if (searchQuery?.trim()) {
    const q = searchQuery.trim()
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { url: { contains: q, mode: 'insensitive' } },
    ]
  }

  if (tagNames.length) {
    where.tags = { some: { tag: { name: { in: tagNames } } } }
  }
  if (categoryParam) {
    where.category = categoryParam === '__uncat__' ? null : categoryParam
  }
  if (subfolderParam) {
    where.subfolder = subfolderParam === '__uncat__' ? null : subfolderParam
  }
  // Legacy folder param maps to subfolder
  if (!subfolderParam && folderParam) {
    if (folderParam === '__uncat__') {
      where.subfolder = null
    } else {
      where.subfolder = folderParam
    }
  }

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

  const normalized = bookmarks.map(normalizeBookmark)

  return NextResponse.json({ bookmarks: normalized, total, page, limit })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as {
      url?: string
      title?: string
      folder?: string
      category?: string
      subfolder?: string
      description?: string
      faviconUrl?: string
      pinned?: boolean
      autoClassify?: boolean
    }

    if (!body.url?.trim()) {
      return NextResponse.json({ error: '请填写网址' }, { status: 400 })
    }

    let url: string
    try {
      url = normalizeBookmarkUrl(body.url)
    } catch {
      return NextResponse.json({ error: '网址格式不正确' }, { status: 400 })
    }

    const existing = await db.bookmark.findUnique({
      where: { url },
      include: { tags: { include: { tag: true } } },
    })
    if (existing) {
      return NextResponse.json(
        { error: '这个网址已经收藏过了', bookmark: normalizeBookmark(existing) },
        { status: 409 }
      )
    }

    const shouldAutoClassify = body.autoClassify !== false
    const auto = shouldAutoClassify
      ? classifyBookmark({
          title: body.title?.trim() || fallbackTitle(url),
          url,
          description: body.description?.trim(),
        })
      : null
    const category = body.category?.trim() || auto?.category || undefined
    const subfolder = body.subfolder?.trim() || auto?.subfolder || undefined
    const bookmark = await db.bookmark.create({
      data: {
        url,
        title: body.title?.trim() || fallbackTitle(url),
        description: body.description?.trim() || undefined,
        faviconUrl: body.faviconUrl?.trim() || undefined,
        folder: body.folder?.trim() || subfolder,
        category,
        subfolder,
        pinned: Boolean(body.pinned),
        source: 'manual',
      },
      include: { tags: { include: { tag: true } } },
    })

    if (auto?.tags.length) {
      await saveTagsForBookmark(bookmark.id, auto.tags)
    }

    const saved = auto?.tags.length
      ? await db.bookmark.findUnique({
          where: { id: bookmark.id },
          include: { tags: { include: { tag: true } } },
        })
      : bookmark

    return NextResponse.json({ bookmark: normalizeBookmark(saved ?? bookmark) }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '保存失败' },
      { status: 500 }
    )
  }
}
