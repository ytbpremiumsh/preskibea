# Rencana: Stabilkan instalasi VPS dan cegah error 500

## Tujuan
Membuat proses instalasi dan pembaruan Prestasi Kita konsisten sebagai situs statis, sehingga halaman seperti `/admin` tetap dapat dibuka dan kegagalan build tidak merusak versi yang sedang aktif.

## Perubahan
1. Buat ulang installer VPS untuk konfigurasi situs statis Prestasi Kita, termasuk pengecekan Node, pemasangan dependensi, build, konfigurasi nginx, izin folder, dan pemeriksaan hasil instalasi.
2. Perkuat script pembaruan dengan penguncian proses, validasi hasil build, pemasangan secara atomik, cadangan versi aktif, dan pemulihan otomatis jika validasi gagal.
3. Perbaiki konfigurasi nginx agar semua alamat halaman diarahkan ke `index.html`, tanpa proxy Node/PM2, serta mencegah redirect internal berulang ketika file utama tidak tersedia.
4. Samakan nama domain dan lokasi webroot bawaan menjadi `prestasikita.com`, tetapi tetap izinkan penyesuaian melalui parameter saat menjalankan script.
5. Perbarui panduan VPS yang masih bertentangan antara SSR/PM2 dan situs statis agar hanya ada satu prosedur yang benar.

## Detail teknis
- Build harus memiliki `dist/index.html` dan aset hasil build sebelum versi aktif disentuh.
- File baru disiapkan di direktori sementara lalu ditukar dengan webroot aktif; versi lama dipertahankan sampai pengecekan berhasil.
- Konfigurasi nginx diuji dengan `nginx -t` sebelum dimuat ulang.
- Installer mendeteksi lokasi konfigurasi nginx standar atau aaPanel dan mencadangkan konfigurasi lama.
- Script berhenti dengan pesan yang jelas jika build, izin, konfigurasi nginx, atau pemeriksaan halaman gagal.

## Verifikasi
- Jalankan pemeriksaan sintaks semua script shell.
- Jalankan build aplikasi.
- Pastikan konfigurasi nginx yang dihasilkan memiliki fallback untuk `/admin` dan halaman langsung lainnya.
