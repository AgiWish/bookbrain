#!/usr/bin/env bash
# BookBrain — one-shot deploy on the production server.
#
# What it does:
#   1. Stash any local edits on the server (defensive — there shouldn't be any).
#   2. git pull origin master.
#   3. Verify required .env vars exist; abort early with a clear message if not.
#   4. docker compose build && up -d (Dockerfile runs `prisma migrate deploy`
#      on container start, so migrations apply automatically).
#   5. Tail logs until the app reports it's listening, or 60s, whichever first.
#
# Usage (on the server, inside the project root):
#   bash scripts/deploy.sh
#
# Re-running is safe; it's idempotent.

set -euo pipefail

cd "$(dirname "$0")/.."

REQUIRED_ENV=(
  DEEPSEEK_API_KEY
  BOOKBRAIN_AUTH_PASSWORD
  BOOKBRAIN_LOGIN_CODE
  BOOKBRAIN_EXTENSION_TOKEN
)

log()  { printf '\033[1;34m[deploy]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[deploy]\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m[deploy]\033[0m %s\n' "$*" >&2; exit 1; }

# 1. Sanity: must be inside the repo.
[[ -f docker-compose.yml ]] || fail "找不到 docker-compose.yml — 请在项目根目录运行此脚本"

# 2. .env check.
if [[ ! -f .env ]]; then
  fail ".env 不存在 — 请先复制 .env.example 并填好以下变量：${REQUIRED_ENV[*]}"
fi
# shellcheck disable=SC1091
set -a; source .env; set +a
for k in "${REQUIRED_ENV[@]}"; do
  if [[ -z "${!k:-}" ]]; then
    fail ".env 缺少变量：$k"
  fi
done
log ".env 校验通过"

# 3. Pull latest.
if [[ -n "$(git status --porcelain)" ]]; then
  warn "工作区有未提交改动，先 stash..."
  git stash push -u -m "deploy.sh autostash $(date -Iseconds)"
fi
log "拉取最新代码..."
git fetch origin
git checkout master
git pull --ff-only origin master
log "已更新到 $(git rev-parse --short HEAD): $(git log -1 --pretty=%s)"

# 4. Rebuild and restart.
log "构建镜像（首次会比较慢，5–10 分钟）..."
docker compose build --pull
log "启动新容器..."
docker compose up -d

# 5. Wait for health.
APP="${COMPOSE_PROJECT_NAME:-bookbrain}-app"
# fallback: scan for any container with bookbrain-app suffix
CONTAINER="$(docker ps --format '{{.Names}}' | grep -E 'bookbrain.app' | head -n1 || true)"
[[ -n "$CONTAINER" ]] || CONTAINER="bookbrain-app"

log "等待应用启动（最多 60s）..."
for i in $(seq 1 30); do
  if docker logs --tail 100 "$CONTAINER" 2>&1 | grep -qE 'Ready in|started server on|Listening on'; then
    log "✅ 应用已就绪"
    break
  fi
  sleep 2
done

PORT="${BOOKBRAIN_APP_PORT:-3200}"
log "完成。访问： http://$(hostname -I | awk '{print $1}'):${PORT}"
log "查看日志： docker compose logs -f app"
