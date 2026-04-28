import { db } from '../db/prisma'
import { generateText } from './client'

export async function extractTags(
  title: string,
  url: string,
  description?: string
): Promise<string[]> {
  const prompt = `根据以下书签信息提取标签（最多5个，中英文均可，JSON数组格式）：
标题：${title}
网址：${url}
${description ? `描述：${description}` : ''}
只输出JSON数组，例如：["Java", "Spring Boot", "后端开发"]`

  const result = await generateText(prompt, undefined, { maxTokens: 150, temperature: 0.1 })

  try {
    const match = result.match(/\[.*?\]/s)
    if (match) {
      const tags = JSON.parse(match[0]) as string[]
      return tags.slice(0, 5).map((t) => t.trim()).filter(Boolean)
    }
  } catch {
    // fallback: split by common delimiters
  }

  return []
}

export async function saveTagsForBookmark(
  bookmarkId: string,
  tagNames: string[]
): Promise<void> {
  for (const name of tagNames) {
    const tag = await db.tag.upsert({
      where: { name },
      create: { name, createdBy: 'ai' },
      update: {},
    })

    await db.bookmarkTag.upsert({
      where: { bookmarkId_tagId: { bookmarkId, tagId: tag.id } },
      create: { bookmarkId, tagId: tag.id },
      update: {},
    })
  }
}
