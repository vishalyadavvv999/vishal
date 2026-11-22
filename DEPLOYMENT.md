# Bhagwati Publications — Independent Deployment & Custom Domain Guide

## 1. Architecture Overview
- **Frontend**: React 19 + Vite + Tailwind CSS (`dist/` produced by `npm run build`)
- **Backend**: Express + TypeScript (`server.ts`, started in production with `NODE_ENV=production npm start`)
- **Database**: SQLite via `better-sqlite3` (`data/bhagwati.db`)
- **File Storage**:
  - `storage/covers/` — Public book cover images served via `/api/media/covers/*`
  - `storage/sample_pdfs/` — Public sample PDFs served via `/api/books/:id/sample-pdf`
  - `storage/private_pdfs/` — Private full manuscripts (never exposed publicly; admin-only download)

Because this application runs a Node.js backend, SQLite database, and local file uploads, deploy it to a **Node.js hosting platform with persistent disk storage** (such as a Linux VPS with Nginx, Railway, Render, Fly.io, or DigitalOcean App Platform). Pure static hosts (like GitHub Pages or static-only Netlify) cannot execute `server.ts` or persist SQLite/uploads.

---

## 2. Environment Variables (`.env`)
Copy `.env.example` to `.env` on your server and set production values:

```env
NODE_ENV="production"
PORT="3000"
APP_URL="https://bhagwatipublications.in"
ADMIN_EMAIL="owner@bhagwatipublications.in"
ADMIN_PASSWORD="SetAStrongUniquePassword!"
SESSION_SECRET="generate-a-64-character-random-hex-string"
DATABASE_PATH="./data/bhagwati.db"
STORAGE_DIR="./storage"
```

Generate a strong `SESSION_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> **Important**: Mount persistent storage to `./data` and `./storage` (or set `DATABASE_PATH` and `STORAGE_DIR` to your mounted volume path) so uploaded books, covers, PDFs, orders, and reviews survive server restarts and redeployments.

---

## 3. Build & Start Commands
```bash
npm ci
npm run build
NODE_ENV=production npm start
```
The Express server builds dynamic SEO tags, `/sitemap.xml`, and `/robots.txt` using `APP_URL` (e.g., `https://bhagwatipublications.in`) and serves the compiled frontend from `dist/`.

---

## 4. Connecting Your Custom Domain (`bhagwatipublications.in`)

### Option A: Managed Node Hosting (Railway / Render / Fly.io)
1. Push your project repository to GitHub (keeping `data/` and `storage/` ignored in `.gitignore`).
2. Create a new Web Service connected to your repository:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Persistent Volume**: Mount a disk at `/app/data` and `/app/storage` (or `/data` and `/storage` and update `DATABASE_PATH` / `STORAGE_DIR`).
3. Add all environment variables from Section 2, including `APP_URL=https://bhagwatipublications.in`.
4. In your host's **Custom Domains** settings, add `bhagwatipublications.in` and `www.bhagwatipublications.in`.
5. In your domain registrar's DNS panel (GoDaddy, Namecheap, Cloudflare, BigRock, etc.), add the `A` / `ALIAS` / `CNAME` records provided by your host.
6. Wait for automatic Let's Encrypt SSL provisioning to finish, then verify HTTPS at `https://bhagwatipublications.in`.

### Option B: Ubuntu / Linux VPS + PM2 + Nginx + SSL
1. Install Node.js 22+, Nginx, and PM2:
   ```bash
   npm ci
   npm run build
   pm2 start "NODE_ENV=production node server.ts" --name bhagwati-publications
   pm2 save
   ```
2. Point your domain DNS records at your registrar:
   - `A` record for `@` (`bhagwatipublications.in`) -> `<YOUR_SERVER_IP>`
   - `CNAME` record for `www` -> `bhagwatipublications.in`
3. Configure Nginx (`/etc/nginx/sites-available/bhagwatipublications.in`):
   ```nginx
   server {
     listen 80;
     server_name bhagwatipublications.in www.bhagwatipublications.in;

     client_max_body_size 60M;

     location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
     }
   }
   ```
4. Enable the site and issue a free SSL certificate with Certbot:
   ```bash
   sudo ln -s /etc/nginx/sites-available/bhagwatipublications.in /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d bhagwatipublications.in -d www.bhagwatipublications.in
   ```

---

## 5. Post-Launch Verification Checklist
1. Open `https://bhagwatipublications.in` and verify the page title (`Bhagwati Publications`) and Navy/Gold `BP` favicon.
2. Check `https://bhagwatipublications.in/sitemap.xml` and `https://bhagwatipublications.in/robots.txt` to confirm your custom domain URL appears in all links.
3. Log in to `/admin` using your production `ADMIN_EMAIL` and `ADMIN_PASSWORD`, update **Store Settings** (Support Email, Phone, WhatsApp Number, Business Address, UPI / Payment Gateway keys), and confirm book uploads and sample PDF previews work.
