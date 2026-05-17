# Deploy & Persistence Runbook

Target: `aeroabroad.com.np` on `202.51.0.85` via Docker Compose.

## Persistence guarantee at a glance

| What | Where it lives | Survives… |
| --- | --- | --- |
| All DB rows (pages, users, leads, settings) | Named volume `aeroabroad_postgres_data` | container restart, image rebuild, `compose down`, server reboot |
| All uploaded images / files | Named volume `aeroabroad_minio_data` | same |
| Let's Encrypt certs | Named volume `aeroabroad_caddy_data` | same |
| Nightly + pre-deploy snapshots | `/var/backups/aeroabroad/` | container loss, accidental volume wipe |

> **What it does NOT survive:** total disk failure on `202.51.0.85`. Local
> backups are step one — once the site is live, copy `/var/backups/aeroabroad/`
> to another host on a schedule (rsync / rclone). See "Off-site backups" below.

## First deploy (fresh server)

```bash
# 1. SSH in as root or a sudoer
ssh root@202.51.0.85

# 2. Get the code
git clone <repo-url> /opt/aeroabroad
cd /opt/aeroabroad

# 3. One-time server setup (installs Docker, firewall, cron)
bash deploy/bootstrap.sh

# 4. (Local, BEFORE pushing to the server) generate the initial Prisma migration
#    On your dev machine, with a local Postgres running:
#      npm run prisma:migrate -- --name init
#      git add prisma/migrations && git commit -m "init migration" && git push
#    The production app applies migrations via `prisma migrate deploy` on every
#    start — it will NOT auto-create the schema if `prisma/migrations/` is empty.

# 5. Configure secrets
cp .env.production.example .env.production
nano .env.production   # replace every REPLACE_WITH_* value

# Generate strong values:
#   openssl rand -base64 24    → POSTGRES_PASSWORD
#   openssl rand -hex 16       → MINIO_ROOT_USER
#   openssl rand -base64 32    → MINIO_ROOT_PASSWORD
#   openssl rand -base64 32    → AUTH_SECRET

# 6. Point DNS at this server BEFORE the next step (Caddy needs a real
#    A record for aeroabroad.com.np to issue a Let's Encrypt cert).
#       A    aeroabroad.com.np        → 202.51.0.85
#       A    www.aeroabroad.com.np    → 202.51.0.85

# 7. Roll out
bash deploy/deploy.sh
```

The first run builds the image, starts Postgres + MinIO + the app + Caddy,
applies migrations, and provisions the SSL cert. Expect ~2 min for the cert.

## Redeploy (every subsequent change)

```bash
cd /opt/aeroabroad
bash deploy/deploy.sh
```

What this does:

1. **Snapshots the DB and media first** (`deploy/backup.sh --tag pre-deploy`).
2. `git pull` (if the project is a git checkout).
3. Rebuilds the `app` image only.
4. `docker compose up -d` — recreates only the `app` container. **Volumes are
   untouched.**
5. The app runs `prisma migrate deploy` on startup. Migrations are additive
   per `docker/MIGRATION-STRATEGY.md` — no destructive changes apply
   automatically.
6. Health-checks `/api/health`. On failure, you can roll back instantly:
   ```bash
   bash deploy/restore.sh latest-pre-deploy
   ```

## Backups

Nightly cron at 03:15 UTC (installed by `bootstrap.sh`):

```
15 3 * * * cd /opt/aeroabroad && bash deploy/backup.sh
```

Layout:

```
/var/backups/aeroabroad/
├── 2026-05-17T03-15-00Z/
│   ├── db.sql.gz
│   ├── media.tar.gz
│   └── manifest.txt
├── 2026-05-18T03-15-00Z/
├── 2026-05-19T03-15-00Z__pre-deploy/
├── latest          → symlink to most recent
└── latest-pre-deploy → symlink to most recent pre-deploy snapshot
```

Retention: 30 days for nightly, 7 days for tagged (pre-deploy / pre-restore).

### Verify a backup actually restores

Do this once before going live, and again quarterly:

```bash
# On a staging VM with the same compose file:
bash deploy/restore.sh latest
# Then sanity-check pages and the media library at /admin/media.
```

A backup you've never restored from is not a backup.

### Off-site backups (do this before serious traffic)

Local snapshots survive container loss but not disk loss. Pick one:

```bash
# Option A — rsync to a second box you own
rsync -avz --delete /var/backups/aeroabroad/ \
  user@backup-host:/srv/aeroabroad-backups/

# Option B — rclone to Cloudflare R2 / Backblaze B2 / Google Drive
rclone copy /var/backups/aeroabroad/ r2:aeroabroad-backups/ --transfers=4
```

Add either to root's crontab right after the nightly backup line.

## Restore (full)

```bash
cd /opt/aeroabroad
bash deploy/restore.sh latest        # or latest-pre-deploy, or a folder name
```

The script:
1. Takes a `pre-restore` snapshot of the current state.
2. Stops the app.
3. `psql < db.sql.gz` into Postgres.
4. Wipes `aeroabroad_minio_data` and untars the snapshot back in.
5. Restarts everything.

## What NOT to do

| Command | Why |
| --- | --- |
| `docker compose down -v` | The `-v` flag **deletes all named volumes**. Everything is gone. |
| `docker volume rm aeroabroad_postgres_data` | Same — wipes the DB. |
| `docker volume rm aeroabroad_minio_data` | Wipes every uploaded image. |
| `prisma migrate reset` | Drops and recreates the schema. Dev-only. |
| Hand-edit a migration that's already applied in prod | Use a new additive migration instead — see `docs/MIGRATION-STRATEGY.md`. |
| Run `prisma migrate dev` against production | Generates **and** applies in one go without review. Use `prisma migrate deploy` (already wired into the app container's startup command). |

## Common operations

```bash
# Tail logs
docker compose --env-file .env.production logs -f app

# Open Postgres shell
docker compose --env-file .env.production exec db \
  psql -U aeroabroad -d aeroabroad

# List media bucket
docker compose --env-file .env.production exec minio \
  mc ls local/media   # after `mc alias set local http://127.0.0.1:9000 …`

# Force a manual backup right now
bash deploy/backup.sh

# Show disk usage of all volumes
docker system df -v | grep aeroabroad_
```

## Monitoring (minimum)

- The app exposes `GET /api/health` — it returns 200 only when Postgres
  responds. Hook a free uptime monitor (UptimeRobot, BetterStack free tier)
  to `https://aeroabroad.com.np/api/health` with email + SMS alerts.
- Disk space matters: a full disk on `/var/lib/docker` corrupts Postgres.
  Add `df -h /var` to your monitoring or a simple cron-mail alert at >80%.

## Disaster scenarios → recovery

| Scenario | Recovery |
| --- | --- |
| App container crashed | `restart: unless-stopped` brings it back. Check `docker compose logs app`. |
| App image rebuild produced a broken build | `bash deploy/restore.sh latest-pre-deploy` then fix and redeploy. |
| Bad migration corrupted data | Restore latest pre-deploy snapshot. Roll forward with a corrected migration. |
| MinIO bucket emptied by mistake | Bucket versioning is on (`minio-init` enables it); use `mc undo` or restore from snapshot. |
| Whole server lost | Provision a new host, install Docker, copy off-site backup into `/var/backups/aeroabroad/`, `bash deploy/restore.sh latest`. |
| Cert renewal failed | Caddy retries automatically. Check `docker compose logs caddy`. Volumes mean you don't redo the ACME dance on restart. |
