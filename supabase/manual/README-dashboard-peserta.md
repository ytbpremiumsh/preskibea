# Aktivasi dashboard peserta

Dashboard memerlukan setup backend sebelum fitur laporan dinyalakan di situs produksi. Proyek Lovable Prestasi Kita memakai ref `ltmfvbcazebowndigkyi`.

1. Tinjau dan terapkan `dashboard-peserta.sql` di database tersebut menggunakan proses migrasi yang disetujui. Skrip membuat tabel laporan, pembatas permintaan dan bucket lampiran privat. Tidak membuat role peserta Supabase; autentikasi peserta memakai token pendaftaran melalui Edge Function.
2. Deploy `supabase/functions/peserta-kendala/index.ts` sebagai fungsi `peserta-kendala` pada proyek yang sama, dengan `verify_jwt=false` sesuai konfigurasi. Fungsi memverifikasi token di server; jangan mengekspos service role key di klien.
3. Verifikasi RLS serta bahwa pengguna tanpa hak admin tidak dapat membaca tabel laporan atau mengakses bucket langsung. Verifikasi token salah ditolak, token A tidak dapat membaca laporan/lampiran token B, admin dapat melihat dan membalas, tab nonaktif menolak laporan baru, tipe/ukuran gambar ditolak, dan rate limit berfungsi. Jangan gunakan data peserta nyata untuk percobaan tanpa otorisasi.
4. Setelah backend tervalidasi, gabungkan dan deploy frontend. Isi informasi benefit yang benar dan aktifkan tab lewat Admin > Dashboard Peserta.

CLI Supabase tidak dapat dipasang di lingkungan ini sehingga SQL disiapkan sebagai skrip manual, bukan dicatat sebagai migration yang telah diterapkan. Jangan anggap langkah ini telah dilakukan hanya karena kode tersedia di GitHub.
