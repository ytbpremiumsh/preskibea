# Pembaruan otomatis untuk situs statis

Situs statis tidak memiliki endpoint server `/api/public/github-webhook`.
Webhook lama jangan diarahkan ke domain situs karena tidak dapat menjalankan
perintah di VPS.

Gunakan SSH atau GitHub Actions untuk menjalankan satu perintah berikut:

```bash
cd /var/www/prestasikita && sudo bash deploy/update.sh
```

Script pembaruan mengunci proses agar dua deploy tidak berjalan bersamaan,
memvalidasi build sebelum aktivasi, dan otomatis mempertahankan versi lama jika
pemeriksaan gagal. Jangan memakai PM2, `build:node`, atau `proxy_pass` karena
semuanya berasal dari arsitektur lama.