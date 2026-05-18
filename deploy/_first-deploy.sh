#!/usr/bin/env bash
# One-shot first deploy on the shared VPS (k3s host).
#
# Architecture: docker-compose for app+db+minio (loopback only), k3s ingress-nginx
# fronts the public traffic via an Ingress in the `aeroabroad` namespace. Ports
# 80/443 belong to ingress-nginx — we do NOT bind them.
#
# Usage on the VPS (after `ssh -p 41447 hmsadmin@202.51.0.85`):
#   # First, scp the prepared .env.production into /tmp:
#   scp -P 41447 .env.production hmsadmin@202.51.0.85:/tmp/aeroabroad.env
#   # Then on the VPS:
#   sudo APP_DIR=/opt/aeroabroad ENV_FILE=/tmp/aeroabroad.env bash deploy/_first-deploy.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/aeroabroad}"
ENV_FILE="${ENV_FILE:-/tmp/aeroabroad.env}"
REPO_URL="${REPO_URL:-https://github.com/integratedenterprised-rgb/educonsult.git}"

if [[ $EUID -ne 0 ]]; then
  echo "Re-running with sudo..." >&2
  exec sudo APP_DIR="$APP_DIR" ENV_FILE="$ENV_FILE" REPO_URL="$REPO_URL" bash "$0" "$@"
fi

echo "==> [1/7] Verifying coexistence requirements..."
# k3s must be present
if ! command -v kubectl >/dev/null 2>&1 && [[ ! -f /etc/rancher/k3s/k3s.yaml ]]; then
  echo "✖ k3s not detected. This script expects to run on the shared VPS where" >&2
  echo "  HMS's k3s + ingress-nginx own ports 80/443. Aborting." >&2
  exit 1
fi
export KUBECONFIG="${KUBECONFIG:-/etc/rancher/k3s/k3s.yaml}"

# ingress-nginx must own 80/443
if ! ss -tlnp 2>/dev/null | grep -qE ':(80|443)\s.*nginx'; then
  echo "⚠  ingress-nginx not detected listening on 80/443. Continuing anyway —" >&2
  echo "   double-check that the Ingress will route after deploy." >&2
fi

# cert-manager ClusterIssuer
if ! kubectl get clusterissuer letsencrypt-prod >/dev/null 2>&1; then
  echo "✖ ClusterIssuer 'letsencrypt-prod' not found. The Ingress references it" >&2
  echo "  for TLS. Either install it, or edit deploy/k3s/20-ingress.yaml." >&2
  exit 1
fi

# Port 3001 (our loopback target) must be free
if ss -tlnp 2>/dev/null | grep -qE '127\.0\.0\.1:3001\s'; then
  echo "✖ 127.0.0.1:3001 is already in use. Free it or change the compose port." >&2
  exit 1
fi

echo "==> [2/7] Cloning or updating repo at $APP_DIR..."
if [[ ! -d "$APP_DIR/.git" ]]; then
  install -d -o "$SUDO_USER" -g "$SUDO_USER" -m 755 "$APP_DIR"
  sudo -u "$SUDO_USER" git clone "$REPO_URL" "$APP_DIR"
else
  sudo -u "$SUDO_USER" -H bash -c "cd '$APP_DIR' && git fetch --all --prune && git reset --hard origin/main"
fi

cd "$APP_DIR"

echo "==> [3/7] Installing Docker (skip if present)..."
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

echo "==> [4/7] Installing .env.production..."
if [[ ! -f "$ENV_FILE" ]]; then
  echo "✖ Expected env file at $ENV_FILE — scp it up before running this." >&2
  exit 1
fi
install -m 600 -o "$SUDO_USER" -g "$SUDO_USER" "$ENV_FILE" "$APP_DIR/.env.production"

echo "==> [5/7] Backup directory + nightly cron..."
BACKUP_DIR="/var/backups/aeroabroad"
mkdir -p "$BACKUP_DIR"
chmod 750 "$BACKUP_DIR"
CRON_LINE="15 3 * * * cd $APP_DIR && /usr/bin/env bash deploy/backup.sh >> /var/log/aeroabroad-backup.log 2>&1"
( crontab -l 2>/dev/null | grep -F "deploy/backup.sh" >/dev/null ) || \
  ( crontab -l 2>/dev/null; echo "$CRON_LINE" ) | crontab -

echo "==> [6/7] Building + bringing up docker-compose stack..."
cd "$APP_DIR"
docker compose --env-file .env.production build app
docker compose --env-file .env.production up -d --remove-orphans

echo "==> Waiting for app health on 127.0.0.1:3001..."
for i in {1..30}; do
  if curl -fsS http://127.0.0.1:3001/api/health >/dev/null 2>&1; then
    echo "✔ App healthy on 127.0.0.1:3001"
    break
  fi
  sleep 2
  if [[ $i -eq 30 ]]; then
    echo "✖ App didn't become healthy in 60s. Recent logs:" >&2
    docker compose --env-file .env.production logs --tail=80 app >&2
    exit 1
  fi
done

echo "==> [7/7] Applying k3s manifests (namespace, service, endpointslice, ingress)..."
bash deploy/k3s/apply.sh

echo
echo "✔ First deploy complete."
echo
echo "Next:"
echo "  1. In Cloudflare for aeroabroad.com.np, create:"
echo "       A  @     -> 202.51.0.85   (proxied)"
echo "       A  www   -> 202.51.0.85   (proxied)"
echo "     SSL/TLS: Full (strict). Always Use HTTPS: on."
echo "  2. cert-manager will issue the Let's Encrypt cert once DNS resolves."
echo "  3. Verify:  curl -I https://aeroabroad.com.np"
echo
echo "Tail logs:  docker compose --env-file .env.production logs -f app"
