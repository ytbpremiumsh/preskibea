# Rencana Implementasi Notifikasi Telegram Pembayaran

Saya akan mengimplementasikan sistem notifikasi Telegram untuk admin agar mendapatkan pemberitahuan instan ketika ada pembayaran (Doku/Mayar/Aulaa) yang berhasil masuk.

## Perubahan yang akan dilakukan:

### Backend (Edge Functions)
1.  **Integrasi Telegram di Webhook**: Memperbarui Edge Function `mayar-webhook` agar mengirim notifikasi ke bot Telegram admin ketika status pembayaran berubah menjadi "paid" atau "success".
2.  **Keamanan**: Menggunakan API Telegram resmi melalui `https://api.telegram.org/bot<TOKEN>/sendMessage`.

### Dashboard Admin (`/admin/integrasi`)
1.  **Tab Pengaturan Telegram**: Menambahkan tab baru khusus "Telegram" di halaman Integrasi.
2.  **Konfigurasi**:
    *   **Bot Token**: Input untuk token bot dari BotFather.
    *   **Chat ID**: Input untuk ID chat admin atau grup admin.
    *   **Template Pesan**: Input untuk menyesuaikan isi pesan notifikasi (mendukung variabel seperti {nama}, {nominal}, {token}, dll).
    *   **Switch Aktif/Nonaktif**: Opsi untuk mematikan notifikasi sementara.

## Detail Teknis:
*   Data konfigurasi Telegram akan disimpan di tabel `site_settings` dengan key `telegram_config`.
*   Pesan akan diformat menggunakan Markdown agar terlihat profesional di Telegram.
*   Webhook akan mendeteksi provider (Doku/Mayar/Aulaa) dan menyertakan informasi tersebut dalam notifikasi.

---

### Apakah Anda ingin saya melanjutkan dengan implementasi ini?
