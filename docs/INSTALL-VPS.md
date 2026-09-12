# Install Kejar Prestasi di VPS (Node SSR + PM2 + Nginx)

Arsitektur: **TanStack Start SSR di Node.js**, di-proxy Nginx. **Bukan** static SPA.

```text
Browser ──HTTPS──▶ Nginx :443
                   ├─ /assets/*  → file disk (cache 1y)
                   └─ /*         → proxy_pass 127.0.0.1:3000 (Node SSR)
```

App Node SSR tetap di `/var/www/kejarprestasi`. Webroot aaPanel/Nginx `/www/wwwroot/kejarprestasi.id` hanya berisi static fallback: `assets/`, `index.html`, `favicon.ico`.

---

## 1. Prasyarat

- Ubuntu/Debian VPS
- Node.js ≥ 20 (installer akan setup otomatis lewat NodeSource jika belum)
- Nginx
- Git, akses ke repo

## 2. Install otomatis

```bash
sudo mkdir -p /var/www && cd /var/www
sudo git clone -b main <REPO_URL> kejarprestasi
cd kejarprestasi

# isi .env dulu (Supabase keys, LOVABLE_API_KEY, dll)
sudo nano .env

# jalankan installer
sudo REPO_URL=<REPO_URL> bash deploy/install-vps.sh
```

Installer akan:
1. Install Node 20 + PM2 (jika belum)
2. `npm ci && npm run build:node`
3. Validasi `dist/server/server.node.js` ada
4. Stage `dist/client` ke `/www/wwwroot/kejarprestasi.id` sehingga muncul `assets/`, `index.html`, `favicon.ico`
5. `pm2 start ecosystem.config.cjs` + `pm2 save` + autostart on boot
6. Salin contoh Nginx config ke `/etc/nginx/conf.d/kejarprestasi.id.conf.example`
7. Smoke test `curl http://127.0.0.1:3000`

## 3. Nginx

Review & aktifkan:

```bash
sudo cp /etc/nginx/conf.d/kejarprestasi.id.conf.example /etc/nginx/conf.d/kejarprestasi.id.conf
sudo nginx -t && sudo systemctl reload nginx
```

HTTPS dengan certbot:

```bash
sudo certbot --nginx -d kejarprestasi.id -d www.kejarprestasi.id
```

## 4. Update / deploy ulang

```bash
cd /var/www/kejarprestasi
sudo bash deploy/update.sh
```

Script: `git pull` → `npm ci` → `npm run build:node` → stage webroot → validasi → `pm2 reload` (zero-downtime). Auto-rollback jika build gagal. Webroot otomatis menjadi `assets/`, `index.html`, `favicon.ico` — bukan `client/` + `server/`.

## 5. Migrasi dari instalasi aaPanel/static lama

Jika `/www/wwwroot/kejarprestasi.id/` berisi `client/` + `server/`, berarti folder `dist/` tersalin mentah ke webroot. Jalankan:

```bash
sudo bash /var/www/kejarprestasi/deploy/migrate-from-static.sh
```

Script: hapus `client/` + `server/`, salin isi `dist/client`, buat fallback `index.html`/`favicon.ico` bila belum ada, install Nginx config, disable vhost aaPanel lama, restart PM2.

## 6. Verifikasi

```bash
ls /var/www/kejarprestasi/dist/server/server.node.js   # harus ada
pm2 status                                              # kejarprestasi: online
curl -I http://127.0.0.1:3000                           # 200
curl -I https://kejarprestasi.id                        # 200 + text/html
curl -I https://kejarprestasi.id/assets/<hash>.js       # 200 + Cache-Control: immutable
ls -lah /www/wwwroot/kejarprestasi.id                   # assets/ index.html favicon.ico
```

## 7. Troubleshooting

| Gejala | Penyebab | Fix |
|---|---|---|
| Webroot berisi `client/` + `server/` | `dist/` tersalin mentah ke webroot | `bash deploy/migrate-from-static.sh` |
| `dist/server/server.node.js` tidak ada setelah build | Build pakai config Worker, bukan Node | Pastikan jalankan `npm run build:node`, bukan `npm run build` |
| PM2 restart loop | `.env` kurang / port 3000 sudah dipakai | `pm2 logs kejarprestasi` |
| 502 Bad Gateway | Node mati | `pm2 status` lalu `pm2 restart kejarprestasi` |

## 8. Catatan: dua jalur build

- `npm run build` → Cloudflare Worker (dipakai Lovable Publish di `*.lovable.app`)
- `npm run build:node` → Node SSR (dipakai VPS ini)

VPS **wajib** pakai `build:node`. Jangan tertukar.

> systemd? Lihat `docs/INSTALL-VPS-SYSTEMD.md` (opsional, PM2 adalah default).
