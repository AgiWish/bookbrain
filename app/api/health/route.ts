import { NextResponse } from 'next/server'
import { db } from '@/lib/db/prisma'

type HealthCheck = {
  status: 'ok' | 'error'
  database: 'ok' | 'error'
  authConfigured: boolean
  extensionTokenConfigured: boolean
  aiConfigured: boolean
  timestamp: string
  error?: string
}

export async function GET() {
  const body: HealthCheck = {
    status: 'ok',
    database: 'ok',
    authConfigured: Boolean(
      process.env.BOOKBRAIN_LOGIN_CODE || process.env.BOOKBRAIN_AUTH_PASSWORD,
    ),
    extensionTokenConfigured: Boolean(process.env.BOOKBRAIN_EXTENSION_TOKEN),
    aiConfigured: Boolean(process.env.DEEPSEEK_API_KEY),
    timestamp: new Date().toISOString(),
  }

  try {
    await db.$queryRaw`SELECT 1`
  } catch (error) {
    body.status = 'error'
    body.database = 'error'
    body.error = error instanceof Error ? error.message : 'Database check failed'
  }

  return NextResponse.json(body, {
    status: body.status === 'ok' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
