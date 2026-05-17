#!/usr/bin/env bash
# Snapshot Postgres + MinIO to $BACKUP_DIR.
#
# Output layout:
#   /var/backups/aeroabroad/2026-05-17T03-15-00Z/
#     ├── db.sql.gz       (pg_dump --format=custom is also fine; we use plain
#     │                    + gzip for grep-ability)
#     ├── media.tar.gz    (raw MinIO data dir snapshot)
#     └── manifest.txt    (versions, sha256s)
#
# Retention:
#   - Hourly tagged backups (--tag pre-deploy) kept 7 days
#   - Nightly untagged backups kept 30 days
#
# Usage:
#   bash deploy/backup.sh                # nightly snapshot
#   bash deploy/backup.sh --tag pre-deploy
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/aeroabroad}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/aeroabroad}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
PRE_DEPLOY_RETENTION_DAYS="${PRE_DEPLOY_RETENTION_DAYS:-7}"
cd "$APP_DIR"

TAG=""
if [[ "${1:-}" == "--tag" ]]; then
  TAG="$2"
fi

STAMP="$(date -u +%FT%H-%M-%SZ)"
NAME="$STAMP${TAG:+__$TAG}"
OUT="$BACKUP_DIR/$NAME"
mkdir -p "$OUT"

# Load env so we know POSTGRES_* values.
set -a; . ./.env.production; set +a

echo "==> Dumping Postgres → $OUT/db.sql.gz"
docker compose --env-file .env.production exec -T db \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --clean --if-exists \
  | gzip -9 > "$OUT/db.sql.gz"

echo "==> Snapshotting MinIO data → $OUT/media.tar.gz"
# Tar the MinIO data volume from a temporary helper container so we don't need
# to know its host path. Read-only mount.
docker run --rm \
  -v aeroabroad_minio_data:/data:ro \
  -v "$OUT":/backup \
  alpine:3 \
  sh -c "cd /data && tar -czf /backup/media.tar.gz ."

echo "==> Writing manifest"
{
  echo "created_at_utc: $STAMP"
  echo "tag: ${TAG:-none}"
  echo "host: $(hostname)"
  echo "git_sha: $(git -C "$APP_DIR" rev-parse HEAD 2>/dev/null || echo n/a)"
  echo "postgres_image: $(docker compose --env-file .env.production images db --format json 2>/dev/null | head -c 400 || true)"
  echo
  echo "sha256:"
  ( cd "$OUT" && sha256sum db.sql.gz media.tar.gz )
} > "$OUT/manifest.txt"

# Update "latest" symlinks for quick restore.
ln -sfn "$OUT" "$BACKUP_DIR/latest"
if [[ -n "$TAG" ]]; then
  ln -sfn "$OUT" "$BACKUP_DIR/latest-$TAG"
fi

echo "==> Pruning old backups"
# Untagged nightly snapshots
find "$BACKUP_DIR" -maxdepth 1 -type d -name '????-??-??T*Z' \
  -mtime +"$RETENTION_DAYS" -exec rm -rf {} +
# Tagged snapshots (e.g. pre-deploy)
find "$BACKUP_DIR" -maxdepth 1 -type d -name '????-??-??T*Z__*' \
  -mtime +"$PRE_DEPLOY_RETENTION_DAYS" -exec rm -rf {} +

SIZE="$(du -sh "$OUT" | cut -f1)"
echo "✔ Backup complete: $OUT ($SIZE)"
