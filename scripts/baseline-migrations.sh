#!/usr/bin/env bash
# BookBrain — one-time baseline for the migrations table.
#
# Why you might need this:
#   The earliest deploy of BookBrain created tables manually via
#   prisma/migrations/manual/enable_pgvector.sql instead of `prisma migrate`.
#   When a fresh `prisma migrate deploy` runs against that DB, it tries to
#   re-apply the 20260429132042_init migration and fails with
#   "relation already exists".
#
#   This script tells Prisma "the init migration is already applied, don't
#   re-run it" — so subsequent migrations (add_category_subfolder, add_pinned)
#   can apply normally.
#
# When to run:
#   - ONCE, on the production server, before the first `deploy.sh` after
#     pulling the new schema.
#   - DO NOT run on a brand-new empty database — the deploy will handle it
#     correctly without baselining.
#
# Usage (on the server, inside the project root):
#   bash scripts/baseline-migrations.sh
#
# The script is safe to re-run: Prisma will say "migration is already in the
# applied state" and exit cleanly.

set -euo pipefail

cd "$(dirname "$0")/.."

log()  { printf '\033[1;34m[baseline]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[baseline]\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m[baseline]\033[0m %s\n' "$*" >&2; exit 1; }

[[ -f .env ]] || fail "缺少 .env"
# shellcheck disable=SC1091
set -a; source .env; set +a

if ! docker ps --format '{{.Names}}' | grep -q 'bookbrain-db'; then
  warn "数据库容器未运行，先启动..."
  docker compose up -d postgres
  sleep 5
fi

# Detect whether 'bookmarks' table already exists. If not, this is a fresh DB
# and baselining is unnecessary (and harmful — would skip real schema creation).
EXISTS=$(docker exec -i bookbrain-db psql -U bookbrain -d bookbrain -tAc \
  "SELECT to_regclass('public.bookmarks');" 2>/dev/null || true)

if [[ -z "${EXISTS// /}" || "$EXISTS" == "" ]]; then
  log "未检测到 bookmarks 表 — 这是干净的数据库，无需 baseline。直接跑 deploy.sh 即可。"
  exit 0
fi

log "检测到现有数据 — 将 init 迁移标记为「已应用」..."

# Run prisma in a one-shot container that has node_modules.
docker compose run --rm app sh -c '
  npx prisma migrate resolve --applied 20260429132042_init || true
  npx prisma migrate deploy
'

log "✅ Baseline 完成。后续请用 scripts/deploy.sh 部署。"
