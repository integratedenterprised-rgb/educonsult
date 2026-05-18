#!/usr/bin/env bash
# One-shot first deploy from a fresh login to the VPS.
#
# Run this AS THE USER YOU SSH'd IN AS. The user needs sudo or root.
#
# Usage on the VPS (after `ssh -p 41447 <user>@202.51.0.85`):
#   curl -fsSL https://raw.githubusercontent.com/integratedenterprised-rgb/educonsult/main/deploy/_first-deploy.sh | sudo bash
# OR (after `scp .env.production` is uploaded to /tmp/aeroabroad.env):
#   sudo APP_DIR=/opt/aeroabroad ENV_FILE=/tmp/aeroabroad.env bash deploy/_first-deploy.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/aeroabroad}"
ENV_FILE="${ENV_FILE:-/tmp/aeroabroad.env}"
REPO_URL="${REPO_URL:-git@github.com:integratedenterprised-rgb/educonsult.git}"

if [[ $EUID -ne 0 ]]; then
  echo "Re-running with sudo..." >&2
  exec sudo APP_DIR="$APP_DIR" ENV_FILE="$ENV_FILE" REPO_URL="$REPO_URL" bash "$0" "$@"
fi

echo "==> [1/6] Checking port 80/443 availability..."
if ss -tlnp 2>/dev/null | grep -qE ':(80|443)\s'; then
  echo "✖ Ports 80 and/or 443 are already in use:" >&2
  ss -tlnp | grep -E ':(80|443)\s' >&2
  echo
  echo "  Aeroabroad's compose Caddy needs 80+443. Resolve the conflict BEFORE rerunning:" >&2
  echo "    - Stop whatever is using them (e.g. k3s/Traefik), OR" >&2
  echo "    - Edit docker-compose.yml to bind Caddy to alt ports and proxy via the" >&2
  echo "      existing reverse proxy." >&2
  exit 1
fi

echo "==> [2/6] Cloning or updating repo at $APP_DIR..."
if [[ ! -d "$APP_DIR/.git" ]]; then
  git clone "$REPO_URL" "$APP_DIR"
else
  cd "$APP_DIR" && git fetch --all --prune && git reset --hard origin/main
fi

echo "==> [3/6] Running bootstrap (Docker + UFW + nightly backup cron)..."
cd "$APP_DIR"
bash deploy/bootstrap.sh

echo "==> [4/6] Installing .env.production..."
if [[ ! -f "$ENV_FILE" ]]; then
  echo "✖ Expected env file at $ENV_FILE — did you scp it up?" >&2
  exit 1
fi
install -m 600 "$ENV_FILE" "$APP_DIR/.env.production"

echo "==> [5/6] Reminder: DNS"
echo "  Make sure A records for aeroabroad.com.np + www.aeroabroad.com.np point at this host's public IP."
echo "  Caddy will retry ACME automatically until DNS resolves."

echo "==> [6/6] Rolling out..."
bash deploy/deploy.sh

echo
echo "✔ First deploy complete. Tail logs with:"
echo "  docker compose --env-file .env.production logs -f app"
