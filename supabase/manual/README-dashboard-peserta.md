# Aktivasi dashboard peserta

Dashboard memerlukan setup backend sebelum fitur laporan dinyalakan di situs produksi. Proyek Lovable Prestasi Kita memakai ref `ltmfvbcazebowndigkyi`.

1. **Selesai:** skrip `dashboard-peserta.sql` telah diterapkan melalui database Lovable pada proyek tersebut. Tabel laporan, pembatas permintaan, dan bucket privat telah diverifikasi. SQL dijalankan langsung dan belum tercatat sebagai migration. Jangan jalankan ulang seluruh skrip: beberapa policy telah ada. Autentikasi peserta tetap memakai token melalui Edge Function.
2. Deploy `supabase/functions/peserta-kendala/index.ts` sebagai fungsi `peserta-kendala` pada proyek yang sama, dengan `verify_jwt=false` sesuai konfigurasi. Fungsi memverifikasi token di server; jangan mengekspos service role key di klien.
3. Verifikasi RLS serta bahwa pengguna tanpa hak admin tidak dapat membaca tabel laporan atau mengakses bucket langsung. Verifikasi token salah ditolak, token A tidak dapat membaca laporan/lampiran token B, admin dapat melihat dan membalas, tab nonaktif menolak laporan baru, tipe/ukuran gambar ditolak, dan rate limit berfungsi. Jangan gunakan data peserta nyata untuk percobaan tanpa otorisasi.
4. Setelah backend tervalidasi, gabungkan dan deploy frontend. Isi informasi benefit yang benar dan aktifkan tab lewat Admin > Dashboard Peserta.

SQL telah diterapkan langsung di proyek yang dicocokkan, tetapi belum tercatat dalam riwayat migrasi. Penerbitan dan uji Edge Function masih diperlukan sebelum frontend digabungkan.
