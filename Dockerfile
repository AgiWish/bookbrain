FROM node:22-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_BOOKBRAIN_AUTO_AI_PROCESS=false
ARG DATABASE_URL=postgresql://bookbrain:bookbrain@postgres:5432/bookbrain
ARG DEEPSEEK_API_KEY=build-time-placeholder
ARG DEEPSEEK_BASE_URL=https://api.deepseek.com
ENV NEXT_PUBLIC_BOOKBRAIN_AUTO_AI_PROCESS=$NEXT_PUBLIC_BOOKBRAIN_AUTO_AI_PROCESS
ENV DATABASE_URL=$DATABASE_URL
ENV DEEPSEEK_API_KEY=$DEEPSEEK_API_KEY
ENV DEEPSEEK_BASE_URL=$DEEPSEEK_BASE_URL
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
