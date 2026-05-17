#!/usr/bin/env bash
# Restore the DB and MinIO data from a backup directory.
#
# DANGER: This REPLACES the current database and media volume contents.
# A safety backup of the current state is taken first.
#
# Usage:
#   bash deploy/restore.sh                       # uses $BACKUP_DIR/latest
#   bash deploy/restore.sh latest-pre-deploy     # named symlink
#   bash deploy/restore.sh 2026-05-17T03-15-00Z  # explicit folder
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/aeroabroad}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/aeroabroad}"
cd "$APP_DIR"

TARGET="${1:-latest}"
SRC="$BACKUP_DIR/$TARGET"
if [[ ! -d "$SRC" ]]; then
  echo "✖ Backup not found: $SRC" >&2
  echo "Available:" >&2
  ls -1 "$BACKUP_DIR" >&2
  exit 1
fi

set -a; . ./.env.production; set +a

echo "==> About to restore from: $SRC"
cat "$SRC/manifest.txt" 2>/dev/null | sed 's/^/    /'
read -r -p "Type 'RESTORE' to proceed: " CONFIRM
[[ "$CONFIRM" == "RESTORE" ]] || { echo "Aborted."; exit 1; }

echo "==> Safety snapshot of current state first..."
bash deploy/backup.sh --tag pre-restore

echo "==> Stopping app (db & minio stay up for restore)..."
docker compose --env-file .env.production stop app

echo "==> Restoring Postgres..."
gunzip -c "$SRC/db.sql.gz" \
  | docker compose --env-file .env.production exec -T db \
      psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "==> Restoring MinIO data..."
# Stop minio, wipe the volume contents, untar the snapshot, start minio.
docker compose --env-file .env.production stop minio
docker run --rm \
  -v aeroabroad_minio_data:/data \
  -v "$SRC":/backup:ro \
  alpine:3 \
  sh -c "rm -rf /data/* /data/..?* /data/.[!.]* 2>/dev/null; tar -xzf /backup/media.tar.gz -C /data"
docker compose --env-file .env.production start minio

echo "==> Restarting app..."
docker compose --env-file .env.production start app

echo "✔ Restore complete. Verify the site, then re-take a fresh backup:"
echo "    bash deploy/backup.sh"
