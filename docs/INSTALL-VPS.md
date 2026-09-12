# Install Kejar Prestasi di VPS (Static SPA)

Arsitektur: **Static SPA (Vite + React Router)**. 
Deployment cukup dengan menaruh hasil build (`dist/`) ke webroot Nginx. Tidak perlu Node.js runtime/PM2 di production.

## 1. Prasyarat

- VPS (Ubuntu/Debian direkomendasikan)
- Node.js ≥ 20 & npm/bun (untuk proses build di server)
- Nginx
- Git

## 2. Persiapan Folder & Izin

```bash
sudo mkdir -p /www/wwwroot/kejarprestasi.id
sudo chown -R $USER:$USER /www/wwwroot/kejarprestasi.id
```

## 3. Clone & Initial Build

```bash
cd /var/www
git clone https://github.com/USERNAME/REPO.git kejarprestasi
cd kejarprestasi
npm install
npm run build
# Sync hasil build ke webroot
rsync -a --delete dist/ /www/wwwroot/kejarprestasi.id/
```

## 4. Konfigurasi Nginx

Salin konfigurasi dari `deploy/nginx-kejarprestasi.id.conf`:

```bash
sudo cp deploy/nginx-kejarprestasi.id.conf /etc/nginx/conf.d/kejarprestasi.id.conf
# Edit path 'root' di config jika folder Anda berbeda
sudo nano /etc/nginx/conf.d/kejarprestasi.id.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 5. SSL dengan Certbot

```bash
sudo certbot --nginx -d kejarprestasi.id -d www.kejarprestasi.id
```

## 6. Update Rutin

Gunakan script `update.sh` di root folder:

```bash
bash update.sh
```

Script ini akan melakukan: `git pull` -> `npm install` -> `npm run build` -> `rsync` ke webroot dengan pengecekan keamanan.

---

## Catatan Penting
- **SSR**: Jika Anda melihat referensi SSR atau `build:node` di dokumen lama, abaikan. App ini sudah migrasi ke Static SPA untuk performa dan kemudahan maintenance.
- **Webroot**: Pastikan path Nginx `root` sama dengan target `rsync` di `update.sh`.
