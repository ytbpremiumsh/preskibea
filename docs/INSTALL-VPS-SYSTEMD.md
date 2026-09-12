# Install di VPS dengan Systemd (Alternatif PM2)

Panduan ini untuk yang lebih suka **systemd** native ketimbang PM2. Cocok untuk VPS dengan resource terbatas (systemd zero overhead, sudah jalan di OS).

> Untuk panduan PM2 (recommended untuk pemula), lihat `INSTALL-VPS.md`.

## 1. Buat User Khusus

```bash
sudo useradd -m -s /bin/bash kejarprestasi
sudo usermod -aG www-data kejarprestasi
```

## 2. Clone + Build (Sebagai User `kejarprestasi`)

```bash
sudo -iu kejarprestasi
cd /var/www
git clone https://github.com/USERNAME/REPO.git kejarprestasi
cd kejarprestasi
npm ci
nano .env   # isi konfigurasi
mkdir -p logs
npm run build:node
bash deploy/stage-webroot.sh
chmod +x deploy/update.sh deploy/stage-webroot.sh update.sh
exit  # balik ke user normal
```

## 3. Install Systemd Service

```bash
sudo cp /var/www/kejarprestasi/deploy/kejar-prestasi.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable kejar-prestasi
sudo systemctl start kejar-prestasi
```

Cek status:

```bash
sudo systemctl status kejar-prestasi
```

Output harus `Active: active (running)`.

## 4. Lihat Log

```bash
# Real-time log
sudo journalctl -u kejar-prestasi -f

# Log file
tail -f /var/www/kejarprestasi/logs/app.log
tail -f /var/www/kejarprestasi/logs/app-err.log
```

## 5. Setup Sudoers untuk Auto-Restart dari update.sh

`update.sh` butuh `systemctl restart` tanpa password:

```bash
sudo tee /etc/sudoers.d/kejarprestasi-restart > /dev/null <<EOF
kejarprestasi ALL=(ALL) NOPASSWD: /bin/systemctl restart kejar-prestasi
EOF
sudo chmod 440 /etc/sudoers.d/kejarprestasi-restart
```

`update.sh` sudah otomatis detect systemd dan jalankan `sudo systemctl restart kejar-prestasi` kalau PM2 tidak ada.

## 6. Nginx + SSL

Sama persis dengan `INSTALL-VPS.md` step 6 & 7. Reverse proxy ke `http://127.0.0.1:3000`.

## Perintah Sehari-hari

```bash
sudo systemctl status kejar-prestasi      # cek status
sudo systemctl restart kejar-prestasi     # restart manual
sudo systemctl stop kejar-prestasi        # stop
sudo systemctl start kejar-prestasi       # start
sudo journalctl -u kejar-prestasi -n 100  # 100 log terakhir
sudo journalctl -u kejar-prestasi --since "10 minutes ago"
```

## Update Manual

```bash
sudo -iu kejarprestasi
cd /var/www/kejarprestasi
bash deploy/update.sh
```

Atau via GitHub webhook (lihat `SETUP-GITHUB-WEBHOOK.md`).

## Perbandingan: Systemd vs PM2

| Aspek | Systemd | PM2 |
|---|---|---|
| Sudah ada di OS | ✅ Built-in | ❌ Install npm global |
| Resource overhead | ~0 MB | ~30 MB (PM2 daemon) |
| Auto-start saat reboot | Native | Perlu `pm2 startup` |
| Log management | journalctl | `pm2 logs` |
| Cluster mode | Manual | Built-in |
| Hot reload | Restart penuh | Graceful reload |
| Monitoring UI | systemctl status | `pm2 monit` |

**Saran**: Systemd kalau Anda nyaman dengan Linux. PM2 kalau ingin UI monitoring & cluster mode mudah.
