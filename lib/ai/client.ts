import OpenAI from 'openai'

export class AIError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message)
    this.name = 'AIError'
  }
}

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com',
})

export async function generateText(
  prompt: string,
  systemPrompt?: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
          { role: 'user' as const, content: prompt },
        ],
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 500,
      })

      return response.choices[0]?.message?.content ?? ''
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }
  }

  throw new AIError(`AI request failed after ${maxRetries} attempts: ${lastError?.message}`)
}

export { client }
