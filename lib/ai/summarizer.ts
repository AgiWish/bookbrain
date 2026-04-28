import { generateText } from './client'

export async function generateSummary(title: string, url: string): Promise<string> {
  const domain = (() => { try { return new URL(url).hostname } catch { return url } })()
  const prompt = `根据以下书签信息，生成一句话摘要（50字以内，中文）：
标题：${title}
网址：${url}（来自 ${domain}）
只输出摘要文字，不要解释。`

  const result = await generateText(prompt, undefined, { maxTokens: 100, temperature: 0.3 })
  return result.trim().slice(0, 100)
}
