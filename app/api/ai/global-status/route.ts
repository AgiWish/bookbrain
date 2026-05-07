import { NextResponse } from 'next/server'
import { db } from '@/lib/db/prisma'

// Returns aggregate AI processing progress from DB
export async function GET() {
  const [total, processed] = await Promise.all([
    db.bookmark.count(),
    db.bookmark.count({ where: { aiProcessedAt: { not: null } } }),
  ])

  return NextResponse.json({ total, processed, pending: total - processed })
}
