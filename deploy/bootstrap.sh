#!/usr/bin/env bash
# First-time setup on a fresh Ubuntu/Debian VPS.
# Idempotent: re-running is safe. Run as root or with sudo.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/aeroabroad}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/aeroabroad}"

echo "==> Installing Docker (skip if present)..."
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

echo "==> Enabling docker service..."
systemctl enable --now docker

echo "==> Creating directories..."
mkdir -p "$APP_DIR" "$BACKUP_DIR"
chmod 750 "$BACKUP_DIR"

echo "==> Configuring UFW firewall (ports 22, 80, 443)..."
if command -v ufw >/dev/null 2>&1; then
  ufw allow 22/tcp || true
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
  yes | ufw enable || true
  ufw status
fi

echo "==> Installing crontab entry for nightly backup..."
CRON_LINE="15 3 * * * cd $APP_DIR && /usr/bin/env bash deploy/backup.sh >> /var/log/aeroabroad-backup.log 2>&1"
# Append only if not already present.
( crontab -l 2>/dev/null | grep -F "deploy/backup.sh" >/dev/null ) || \
  ( crontab -l 2>/dev/null; echo "$CRON_LINE" ) | crontab -

echo "==> Bootstrap complete."
echo
echo "Next steps:"
echo "  1. git clone <repo> $APP_DIR  (or rsync the project)"
echo "  2. cp $APP_DIR/.env.production.example $APP_DIR/.env.production"
echo "  3. Edit $APP_DIR/.env.production — replace all REPLACE_WITH_* values"
echo "  4. Point aeroabroad.com.np A record at this server's public IP"
echo "  5. cd $APP_DIR && bash deploy/deploy.sh"
