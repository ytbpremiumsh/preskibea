# Systemd tidak diperlukan

Prestasi Kita sekarang berupa situs statis. Nginx membaca hasil build secara
langsung, sehingga tidak ada proses aplikasi yang harus dijaga oleh systemd atau
PM2. Gunakan panduan `INSTALL-VPS.md`.

Jika service aplikasi lama masih aktif, service tersebut boleh dihentikan karena
nginx tidak lagi terhubung kepadanya:

```bash
sudo systemctl disable --now kejar-prestasi 2>/dev/null || true
sudo systemctl status nginx
```