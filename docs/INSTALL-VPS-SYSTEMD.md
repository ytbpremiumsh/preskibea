# Deployment VPS (Static SPA)

Aplikasi ini adalah **Static SPA**. Tidak memerlukan service systemd atau PM2 untuk berjalan, karena hanya berupa file statis yang dilayani langsung oleh Nginx.

Jika sebelumnya Anda menggunakan systemd untuk menjalankan Node.js server (SSR), Anda bisa menghapusnya:

```bash
sudo systemctl stop kejar-prestasi
sudo systemctl disable kejar-prestasi
sudo rm /etc/systemd/system/kejar-prestasi.service
sudo systemctl daemon-reload
```

Cukup ikuti panduan di `docs/INSTALL-VPS.md` untuk setup Nginx statis.
