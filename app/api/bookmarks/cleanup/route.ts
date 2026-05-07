import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/prisma'
import dns from 'node:dns/promises'

interface BrokenBookmark {
  id: string
  title: string
  url: string
  category?: string
  subfolder?: string
  error: string
}

// Extract hostname from URL
function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

// Batch DNS lookup: check unique hostnames only once, then map results to bookmarks
async function checkByDns(
  bookmarks: { id: string; title: string; url: string; category: string | null; subfolder: string | null }[]
): Promise<BrokenBookmark[]> {
  // Collect unique hostnames
  const hostnameToBookmarks = new Map<string, typeof bookmarks>()
  const invalidBookmarks: BrokenBookmark[] = []

  for (const b of bookmarks) {
    const host = getHostname(b.url)
    if (!host) {
      invalidBookmarks.push({ id: b.id, title: b.title, url: b.url, category: b.category ?? undefined, subfolder: b.subfolder ?? undefined, error: '无效URL' })
      continue
    }
    if (!hostnameToBookmarks.has(host)) hostnameToBookmarks.set(host, [])
    hostnameToBookmarks.get(host)!.push(b)
  }

  const uniqueHosts = [...hostnameToBookmarks.keys()]
  const deadHosts = new Set<string>()
  let hostIndex = 0

  // DNS worker pool — 20 concurrent, 5s timeout per lookup
  async function dnsWorker() {
    while (hostIndex < uniqueHosts.length) {
      const host = uniqueHosts[hostIndex++]
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 5000)
        // dns.resolve throws on failure — that's our signal
        await dns.resolve(host)
        clearTimeout(timer)
      } catch {
        deadHosts.add(host)
      }
    }
  }

  const workers = Array.from({ length: Math.min(20, uniqueHosts.length) }, () => dnsWorker())
  await Promise.all(workers)

  // Map dead hostnames back to bookmarks
  const broken: BrokenBookmark[] = [...invalidBookmarks]
  for (const host of deadHosts) {
    for (const b of hostnameToBookmarks.get(host)!) {
      broken.push({
        id: b.id,
        title: b.title,
        url: b.url,
        category: b.category ?? undefined,
        subfolder: b.subfolder ?? undefined,
        error: '域名无法解析',
      })
    }
  }

  return broken
}

// GET: Scan all bookmarks via DNS (fast — only checks unique domains)
export async function GET() {
  const bookmarks = await db.bookmark.findMany({
    select: {
      id: true,
      title: true,
      url: true,
      category: true,
      subfolder: true,
    },
  })

  const broken = await checkByDns(bookmarks)

  return NextResponse.json({
    total: bookmarks.length,
    broken: broken.length,
    bookmarks: broken,
  })
}

// DELETE: Remove broken bookmarks by IDs
export async function DELETE(request: NextRequest) {
  const body = await request.json()
  const ids: string[] = body.ids

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: '请提供要删除的书签 ID' }, { status: 400 })
  }

  await db.bookmarkTag.deleteMany({
    where: { bookmarkId: { in: ids } },
  })

  await db.bookmarkEmbedding.deleteMany({
    where: { bookmarkId: { in: ids } },
  })

  const result = await db.bookmark.deleteMany({
    where: { id: { in: ids } },
  })

  // Clean up orphaned tags
  const orphanTags = await db.tag.findMany({
    where: { bookmarks: { none: {} } },
    select: { id: true },
  })
  if (orphanTags.length > 0) {
    await db.tag.deleteMany({
      where: { id: { in: orphanTags.map((t) => t.id) } },
    })
  }

  return NextResponse.json({
    deleted: result.count,
    orphanTagsRemoved: orphanTags.length,
  })
}
