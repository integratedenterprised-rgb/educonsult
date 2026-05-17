#!/usr/bin/env bash
# Build + roll out the app. NEVER touches volumes.
#
# Safe sequence:
#   1. Snapshot DB + media (pre-deploy backup, restorable if anything breaks)
#   2. Pull latest code
#   3. docker compose build app
#   4. docker compose up -d  (recreates ONLY changed containers; volumes survive)
#   5. App container runs `prisma migrate deploy` on startup (additive only)
#   6. Health check
#
# If health check fails, the previous DB snapshot is still on disk in
# /var/backups/aeroabroad/ — see deploy/restore.sh.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/aeroabroad}"
cd "$APP_DIR"

if [[ ! -f .env.production ]]; then
  echo "✖ .env.production missing. Copy .env.production.example and fill it in." >&2
  exit 1
fi

# Prisma needs at least one committed migration to bring up the schema in prod.
# Generate locally with `npm run prisma:migrate -- --name init` BEFORE first deploy.
if [[ ! -d prisma/migrations || -z "$(ls -A prisma/migrations 2>/dev/null)" ]]; then
  echo "✖ prisma/migrations is empty. Generate the initial migration locally first:" >&2
  echo "    npm run prisma:migrate -- --name init   # against a dev DB" >&2
  echo "    git add prisma/migrations && git commit && git push" >&2
  echo "  Then re-run this script. See DEPLOY.md → 'First deploy' for details." >&2
  exit 1
fi

echo "==> [1/5] Pre-deploy backup..."
bash deploy/backup.sh --tag pre-deploy

echo "==> [2/5] Pulling latest code (if this is a git checkout)..."
if [[ -d .git ]]; then
  git fetch --all --prune
  git reset --hard "@{upstream}"
fi

echo "==> [3/5] Building app image..."
docker compose --env-file .env.production build app

echo "==> [4/5] Rolling out (volumes preserved)..."
# `up -d` recreates only services whose config/image changed.
# Volumes are named so they are NEVER removed by this command.
docker compose --env-file .env.production up -d --remove-orphans

echo "==> [5/5] Waiting for health..."
for i in {1..30}; do
  if docker compose --env-file .env.production exec -T app \
      curl -fsS http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
    echo "✔ App healthy."
    exit 0
  fi
  sleep 2
done

echo "✖ App did not become healthy in 60s. Recent logs:" >&2
docker compose --env-file .env.production logs --tail=80 app >&2
echo
echo "Data is intact in volumes. To restore the pre-deploy snapshot:" >&2
echo "  bash deploy/restore.sh latest-pre-deploy" >&2
exit 1
