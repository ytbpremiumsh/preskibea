# Install Prestasi Kita di VPS (Static SPA + Nginx)

Aplikasi berupa file statis yang langsung dilayani nginx. Tidak diperlukan PM2,
Node.js runtime, reverse proxy, atau service systemd aplikasi.

## Prasyarat

- Ubuntu/Debian, nginx, Git, rsync, dan curl
- Node.js 20 atau lebih baru dan npm
- Repo berada di `/var/www/prestasikita` (atau lokasi lain yang tetap)

## Instalasi atau perbaikan

```bash
cd /var/www/prestasikita
sudo bash deploy/install-vps.sh
```

Installer akan membangun aplikasi, memvalidasi hasilnya, membuat rilis atomik,
memasang konfigurasi nginx, dan memeriksa halaman `/admin`. Konfigurasi lama
dicadangkan. Jika ada dua konfigurasi untuk domain yang sama, installer berhenti
dan menampilkan file lama yang harus dinonaktifkan.

## SSL

```bash
sudo certbot --nginx -d prestasikita.com -d www.prestasikita.com
```

## Update rutin

```bash
cd /var/www/prestasikita
sudo bash deploy/update.sh
```

Script menjalankan pull, pemasangan dependensi, build, validasi, lalu mengganti
rilis secara atomik. Situs lama tetap aktif jika build atau pemeriksaan gagal.
Lima rilis terakhir disimpan untuk pemulihan.

## Verifikasi

```bash
sudo nginx -t
readlink -f /www/wwwroot/prestasikita.com/current
curl -I https://prestasikita.com/
curl -I https://prestasikita.com/admin
```

## Jika masih error

| Status | Penyebab paling mungkin | Tindakan |
|---|---|---|
| 500 pada `/admin` | vhost lama atau fallback nginx berulang | Jalankan installer; nonaktifkan konfigurasi ganda yang dilaporkan |
| 502 | nginx lama masih memakai `proxy_pass` | Ganti dengan konfigurasi installer; PM2 tidak dipakai |
| 503 | `current/index.html` tidak tersedia | Jalankan `sudo bash deploy/update.sh` |
| Update terkunci | Dua deploy berjalan bersamaan | Tunggu proses pertama selesai |

Domain atau webroot lain:

```bash
sudo DOMAIN=contoh.id WEBROOT=/www/wwwroot/contoh.id bash deploy/install-vps.sh
```