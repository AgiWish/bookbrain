import { NextRequest, NextResponse } from 'next/server'
import { getJob } from '@/lib/queue/processor'

export async function GET(
  _request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const job = getJob(params.jobId)

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const percentage = job.total > 0 ? Math.round((job.processed / job.total) * 100) : 0

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    total: job.total,
    processed: job.processed,
    failed: job.failed,
    percentage,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
  })
}
