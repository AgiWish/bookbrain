import { createHash } from 'crypto'

const EMBEDDING_DIM = 1536

// TODO: Replace with real embedding API when DeepSeek supports it.
// Currently DeepSeek does not offer a public embedding endpoint.
// This generates a deterministic pseudo-vector from text for development.
export async function generateEmbedding(text: string): Promise<number[]> {
  const normalized = text.toLowerCase().trim().slice(0, 8192)
  const vector: number[] = []

  for (let i = 0; i < EMBEDDING_DIM; i++) {
    const hash = createHash('sha256')
      .update(normalized + i.toString())
      .digest('hex')
    const val = (parseInt(hash.slice(0, 8), 16) / 0xffffffff) * 2 - 1
    vector.push(val)
  }

  // L2 normalize
  const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0))
  return vector.map((v) => v / norm)
}
