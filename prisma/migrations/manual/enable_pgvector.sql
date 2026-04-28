CREATE EXTENSION IF NOT EXISTS vector;

CREATE INDEX IF NOT EXISTS bookmark_embeddings_hnsw_idx
  ON bookmark_embeddings
  USING hnsw (embedding vector_cosine_ops);
