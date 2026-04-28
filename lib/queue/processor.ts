import pLimit from 'p-limit'
import { db } from '../db/prisma'
import { generateSummary } from '../ai/summarizer'
import { extractTags, saveTagsForBookmark } from '../ai/tagger'
import { vectorizeBookmark } from '../ai/vectorizer'

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Job {
  id: string
  status: JobStatus
  total: number
  processed: number
  failed: number
  startedAt: Date
  completedAt?: Date
}

const jobs = new Map<string, Job>()

export function getJob(jobId: string): Job | undefined {
  return jobs.get(jobId)
}

export async function processBatch(bookmarkIds: string[]): Promise<string> {
  const jobId = crypto.randomUUID()
  const job: Job = {
    id: jobId,
    status: 'pending',
    total: bookmarkIds.length,
    processed: 0,
    failed: 0,
    startedAt: new Date(),
  }
  jobs.set(jobId, job)

  const limit = pLimit(3)
  job.status = 'processing'

  const tasks = bookmarkIds.map((id) =>
    limit(async () => {
      let retries = 0
      while (retries < 2) {
        try {
          const bookmark = await db.bookmark.findUnique({ where: { id } })
          if (!bookmark) break

          const summary = await generateSummary(bookmark.title, bookmark.url)
          await db.bookmark.update({ where: { id }, data: { description: summary } })

          const tags = await extractTags(bookmark.title, bookmark.url, summary)
          await saveTagsForBookmark(id, tags)

          await vectorizeBookmark(id)

          await db.bookmark.update({
            where: { id },
            data: { aiProcessedAt: new Date() },
          })

          job.processed++
          break
        } catch {
          retries++
          if (retries >= 2) job.failed++
        }
      }
    })
  )

  Promise.all(tasks).then(() => {
    job.status = 'completed'
    job.completedAt = new Date()
  })

  return jobId
}
