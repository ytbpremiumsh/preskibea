# Integrasi Aulaa.co Iframe & Redirect Otomatis

User ingin agar pembayaran menggunakan Aulaa.co menggunakan iframe pop-up (bukan redirect halaman penuh) dan jika sudah lunas otomatis redirect ke halaman sukses dengan kode unik.

## Langkah-langkah:

1.  **Frontend: Update RegistrationForm.tsx**
    *   Tambahkan state untuk `showAulaaIframe` dan `aulaaPaymentId`.
    *   Jika provider adalah `aulaa`, saat pendaftaran berhasil, jangan `window.location.assign`, melainkan tampilkan modal iframe.
    *   Gunakan event listener `window.addEventListener("message", ...)` untuk mendeteksi event dari Aulaa (jika ada) atau lakukan polling status pembayaran secara periodik saat modal terbuka.

2.  **Frontend: Update pendaftaran.sukses.tsx**
    *   Pastikan halaman sukses dapat menerima `token` dan data lainnya untuk menampilkan kode unik secara akurat.

3.  **Backend: Update mayar-webhook (Edge Function)**
    *   Pastikan webhook memproses status `paid` dari Aulaa dengan benar dan mengupdate status pendaftaran menjadi `paid` di database.
    *   Polling frontend akan mendeteksi perubahan status `payment_status` di database untuk memicu redirect otomatis.

4.  **Backend: Update submit-registration (Edge Function)**
    *   Pastikan Aulaa payment creation tetap berfungsi dan mengembalikan data yang diperlukan (payment ID).

## Detail Teknis:

*   **Aulaa Iframe**: Menggunakan `https://payment.aulaa.co/pay/[payment_id]` di dalam iframe.
*   **Polling Status**: Komponen `RegistrationForm` akan melakukan polling ke database (tabel `registrations`) setiap 3 detik untuk mengecek status `payment_status`. Jika status berubah menjadi `paid`, tutup modal dan redirect ke `/pendaftaran/sukses`.

## User-facing changes:
*   Pengalaman pembayaran yang lebih mulus tanpa meninggalkan website (Iframe).
*   Redirect otomatis ke halaman sukses setelah pembayaran tervalidasi.
