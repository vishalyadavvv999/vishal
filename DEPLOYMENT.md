# Bhagwati Publications — Production Deployment Guide (Railway & Render)

Custom Domain: **`https://bhagwatipublications.cv`**

---

## 1. Architecture & Security Summary
- **Frontend**: React 19 + Vite + Tailwind CSS v4 (`npm run build` outputs `dist/`)
- **Backend**: Express + TypeScript (`server.ts`, executed with `NODE_ENV=production node server.ts` on Node.js `>=22.14.0`)
- **Database**: SQLite via `better-sqlite3` (`WAL` mode + `busy_timeout=5000` + graceful WAL flush on `SIGTERM`)
- **File Storage (`STORAGE_DIR`)**:
  - `covers/` — Book covers and Director portrait, served strictly via `/api/media/covers/:filename`
  - `sample_pdfs/` — Public sample PDFs, served strictly for published editions via `/api/books/:id/sample-pdf`
  - `private_pdfs/` — Full manuscripts, **never publicly served**; accessible only via authenticated admin route `/api/admin/books/:id/private-pdf`
- **Authentication**: HMAC-SHA256 signed `HttpOnly` + `SameSite=Lax` + proxy-aware `Secure` cookies (`bp_admin_session` / `bp_customer_session`), with per-user salted `crypto.scrypt` password hashes.

---

## 2. Required Environment Variables

Set these in your Railway **Variables** or Render **Environment** tab (never commit `.env` to Git):

| Variable | Required | Production Value / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | `production` | Serves `dist/` bundle with SSR SEO meta injection |
| `PORT` | Auto/Yes | `3000` (Render/Railway may inject automatically) | HTTP port Express binds (`0.0.0.0:$PORT`) |
| `APP_URL` | Yes | `https://bhagwatipublications.cv` | Canonical links, Open Graph URLs, `/sitemap.xml`, `/robots.txt` |
| `ADMIN_EMAIL` | Yes (First Boot) | `owner@bhagwatipublications.cv` | Initial owner email seeded if `admin_users` is empty |
| `ADMIN_PASSWORD` | Yes (First Boot) | `<strong-unique-password>` | Initial owner password (hashed with scrypt; if omitted, a one-time random password is logged once at startup) |
| `SESSION_SECRET` | Yes | `<64-char-random-hex>` | Signs admin & customer session cookies across restarts |
| `DATABASE_PATH` | Yes | `/var/data/bhagwati.db` (or `/app/persistent/bhagwati.db`) | Path to persistent SQLite file on mounted volume |
| `STORAGE_DIR` | Yes | `/var/data/storage` (or `/app/persistent/storage`) | Directory on mounted volume for `covers/`, `sample_pdfs/`, `private_pdfs/` |

Generate a cryptographically random `SESSION_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> **Single-Mount Tip for Railway & Render**: Both platforms work cleanest with **one** Persistent Volume/Disk attached per Web Service. Mount that single disk at `/var/data` (Render) or `/app/persistent` (Railway), then point **both** `DATABASE_PATH` and `STORAGE_DIR` inside that mount directory (e.g. `/var/data/bhagwati.db` and `/var/data/storage`).

---

## 3. Deploying on Railway (`bhagwatipublications.cv`)

1. **Push Source Code**: Push the repository to a private GitHub repo (`.gitignore` already excludes `.env*`, `data/`, `storage/`, `dist/`, `node_modules/`).
2. **Create Project**:
   - In Railway, choose **New Project → Deploy from GitHub repo**.
   - Railway reads `"engines": { "node": ">=22.14.0" }` and runs:
     - **Build Command**: `npm ci && npm run build` (or `npm install && npm run build`)
     - **Start Command**: `npm start`
3. **Attach Persistent Volume**:
   - Click your service → **Add Volume** → Mount Path: `/app/persistent`.
4. **Configure Variables**:
   - Set `NODE_ENV=production`
   - Set `APP_URL=https://bhagwatipublications.cv`
   - Set `DATABASE_PATH=/app/persistent/bhagwati.db`
   - Set `STORAGE_DIR=/app/persistent/storage`
   - Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `SESSION_SECRET`
5. **Health Check**:
   - Under Service **Settings → Healthcheck Path**, set `/api/health`.
6. **Connect `bhagwatipublications.cv`**:
   - Under Service **Settings → Networking → Custom Domain**, add `bhagwatipublications.cv` and `www.bhagwatipublications.cv`.
   - At your `.cv` domain registrar, add the `CNAME` / `ALIAS` / `A` records shown by Railway.
   - Wait for TLS/HTTPS certificate issuance to show active.

---

## 4. Deploying on Render (`bhagwatipublications.cv`)

> **Important**: Render Persistent Disks require a paid Web Service plan (e.g., **Starter** or above); free instances have ephemeral filesystems and lose SQLite data/uploads on sleep or redeploy.

1. **Create Web Service**:
   - Connect your private GitHub repository in Render (**New → Web Service**).
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
2. **Add Persistent Disk**:
   - In the Web Service **Disks** tab, add 1 Persistent Disk:
     - **Name**: `bhagwati-storage`
     - **Mount Path**: `/var/data`
     - **Size**: `5 GB` (or more as your PDF library grows)
3. **Configure Environment Variables**:
   - `NODE_ENV=production`
   - `APP_URL=https://bhagwatipublications.cv`
   - `DATABASE_PATH=/var/data/bhagwati.db`
   - `STORAGE_DIR=/var/data/storage`
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET`
4. **Connect `bhagwatipublications.cv`**:
   - In Render **Settings → Custom Domains**, add `bhagwatipublications.cv` and `www.bhagwatipublications.cv`.
   - Add the `A` / `CNAME` records shown by Render at your `.cv` registrar and wait for automatic Let's Encrypt SSL.

---

## 5. Migrating Existing SQLite Database & Uploaded Files

If you already populated books, covers, PDFs, orders, reviews, or the leadership portrait locally/in preview and want to preserve them on Railway or Render:

### Step 1: Create a Clean Local Archive
Stop the source app (or run SQLite's online backup command so WAL journals are cleanly merged) before archiving:

```bash
# Optional safe WAL-consistent copy if SQLite CLI is installed:
sqlite3 data/bhagwati.db ".backup 'data/bhagwati_backup.db'"

# Bundle database + storage directories:
tar -czf bhagwati_migration.tar.gz -C . data/bhagwati.db storage/
```
*(If using `bhagwati_backup.db`, rename it to `bhagwati.db` inside the archive.)*

### Step 2: Restore onto the Production Volume
- **On Render**: Open your Web Service **Shell** (or upload via SSH/SCP if enabled, or temporary signed download URL fetched with `curl` from inside the Render Shell):
  ```bash
  mkdir -p /var/data/storage
  # After transferring bhagwati_migration.tar.gz into /tmp/:
  tar -xzf /tmp/bhagwati_migration.tar.gz -C /tmp/
  cp /tmp/data/bhagwati.db /var/data/bhagwati.db
  cp -r /tmp/storage/* /var/data/storage/
  rm -rf /tmp/bhagwati_migration.tar.gz /tmp/data /tmp/storage
  ```
  Then **Manual Deploy / Restart Service** in Render so Node opens the restored `bhagwati.db`.
- **On Railway**: Connect via `railway ssh` (with volume mounted at `/app/persistent`):
  ```bash
  mkdir -p /app/persistent/storage
  # Extract uploaded archive so files live at:
  #   /app/persistent/bhagwati.db
  #   /app/persistent/storage/{covers,sample_pdfs,private_pdfs}
  ```
  Restart the Railway deployment afterward so SQLite loads the restored database cleanly.

---

## 6. Post-Deployment Verification Checklist
1. `GET https://bhagwatipublications.cv/api/health` returns `{"status":"ok","database":"connected","storage_ready":true}`.
2. `https://bhagwatipublications.cv/` renders the full storefront, Leadership section, New Releases, Authors, News & Updates, and bilingual toggle (`EN` / `हिन्दी`).
3. `https://bhagwatipublications.cv/sitemap.xml` and `/robots.txt` list `https://bhagwatipublications.cv/...` URLs.
4. Direct unauthenticated access to `/api/admin/books/1/private-pdf` returns `401 Authentication required`.
5. Sign in at `https://bhagwatipublications.cv/admin`, upload your Director portrait under **Store & Payment**, and verify sample PDF preview & order tracking on `/track-order`.
