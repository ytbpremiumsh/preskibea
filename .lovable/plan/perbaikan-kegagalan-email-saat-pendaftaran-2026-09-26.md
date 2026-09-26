# Perbaikan kegagalan email saat pendaftaran

## Hasil yang diinginkan
- Pendaftaran tetap berhasil dan halaman sukses tetap tampil meskipun domain email belum selesai diverifikasi.
- Satu pendaftaran hanya memicu satu email konfirmasi.
- Setelah DNS aktif, email kembali terkirim otomatis tanpa perubahan alur peserta.

## Perubahan
1. Hapus pemanggilan email kedua dari halaman formulir; pengiriman tetap dilakukan dari sistem setelah data tersimpan.
2. Perlakukan status `domain_not_verified` sebagai email tertunda, bukan kegagalan pendaftaran atau layar kosong.
3. Rapikan penanganan kesalahan agar pemeriksaan kode lolos.
4. Terapkan fungsi email yang diperbarui dan uji halaman sukses pendaftaran.

## Catatan
DNS `notify.prestasikita.com` masih berstatus **Setting up / Verifying**. Email aktual baru dapat dikirim setelah verifikasi selesai, tetapi peserta tidak lagi terkena error 500 selama masa tunggu.
