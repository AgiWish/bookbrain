# BookBrain

BookBrain is an AI-assisted bookmark manager built with Next.js, Prisma, PostgreSQL, and pgvector.

## Features

- Import browser bookmark HTML files with duplicate detection.
- Browse bookmarks by category, subfolder, tags, and pinned items.
- Add a single website bookmark from the bookmark library.
- Search by keyword, with semantic-search plumbing backed by pgvector.
- Optional DeepSeek-based summary and tag processing.
- App login protection for production deployments.

## Local Development

1. Copy the environment template:

```bash
cp .env.example .env.local
```

2. Start PostgreSQL with pgvector:

```bash
docker compose up -d postgres
```

3. Apply migrations and start the app:

```bash
npx prisma migrate deploy
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

```bash
DATABASE_URL="postgresql://bookbrain:bookbrain@localhost:5433/bookbrain"
DEEPSEEK_API_KEY="your-deepseek-api-key-here"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
BOOKBRAIN_AUTH_USER="admin"
BOOKBRAIN_AUTH_PASSWORD="change-this-before-production"
BOOKBRAIN_LOGIN_CODE="123456"
BOOKBRAIN_EXTENSION_TOKEN="change-this-extension-token"
BOOKBRAIN_APP_PORT="3200"
BOOKBRAIN_DB_BIND="127.0.0.1:5433"
NEXT_PUBLIC_BOOKBRAIN_AUTO_AI_PROCESS="false"
```

`NEXT_PUBLIC_BOOKBRAIN_AUTO_AI_PROCESS` defaults to `false`. Keep it disabled for the low-cost MVP: large imports will not automatically call the chat model for every bookmark. Trigger deep AI processing manually through `/api/ai/process-batch` when needed.

## Production Deployment

The bundled Docker Compose file is set up to avoid common server port conflicts:

- App: `${BOOKBRAIN_APP_PORT:-3200}:3000`
- PostgreSQL: `${BOOKBRAIN_DB_BIND:-127.0.0.1:5433}:5432`

Deploy:

```bash
docker compose up -d --build
```

The app container runs Prisma migrations before starting Next.js:

```bash
npx prisma migrate deploy && node server.js
```

For production, `BOOKBRAIN_LOGIN_CODE` must be a 6 digit code. If it is missing or not exactly 6 digits, the app returns `503` instead of exposing the service without authentication. The login page locks the current browser session after 10 failed attempts.

Chrome extension API access uses `BOOKBRAIN_EXTENSION_TOKEN`. The extension sends it in `X-BookBrain-Extension-Token`; it does not use browser login cookies.

## Common Workflows

### Add One Bookmark

Open `/bookmarks`, click `添加收藏`, then enter a URL, title, category, and subfolder. The app saves it through `POST /api/bookmarks`.

### Import Bookmarks

Open `/import` and upload a browser bookmark HTML file. Importing does not automatically trigger deep AI processing unless `NEXT_PUBLIC_BOOKBRAIN_AUTO_AI_PROCESS=true` is set at build time.

### Manually Trigger AI Processing

```bash
curl -X POST http://localhost:3000/api/ai/process-batch
```

When already logged in through the browser session:

```bash
curl -X POST http://localhost:3000/api/ai/process-batch
```
