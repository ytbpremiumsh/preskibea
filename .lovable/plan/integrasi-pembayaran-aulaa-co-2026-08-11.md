# Integrasi Pembayaran Aulaa.co

Integrasi ini menambahkan Aulaa.co sebagai opsi payment gateway untuk pendaftaran Fast Track, berdampingan dengan Mayar. Admin dapat memilih provider aktif melalui dashboard.

## User-Facing Changes
- **Admin Dashboard**: Menu "Integrasi Pembayaran" akan memiliki toggle untuk memilih antara Mayar atau Aulaa.co, serta input konfigurasi untuk Aulaa.co (Project ID, API Key, Webhook Secret).
- **Pendaftaran Fast Track**: Pendaftar akan langsung diarahkan ke halaman pembayaran Aulaa.co jika dipilih oleh admin.

## Technical Details
### Database
- Memperluas penggunaan tabel `site_settings` untuk menyimpan:
  - `payment_provider`: 'mayar' | 'aulaa'
  - `aulaa_config`: `{ project_id: string, api_key: string, webhook_secret: string }`

### Edge Functions
- **submit-registration**: 
  - Logika percabangan berdasarkan `payment_provider`.
  - Implementasi **Opsi 2** (Buat via API lalu redirect) untuk Aulaa.co karena lebih dinamis.
- **mayar-webhook**:
  - Menambah dukungan verifikasi signature Aulaa.co (HMAC-SHA256).
  - Menangani payload status dari Aulaa.co (`paid`).

### Frontend
- **admin.integrasi.tsx**: 
  - Redesain UI untuk mendukung multi-provider dengan Tabs atau Toggle.
  - Form input untuk kredensial Aulaa.co.
- **RegistrationForm.tsx**:
  - Memastikan `invoice_url` dari response Edge Function diprioritaskan untuk redirect.

## Implementation Steps
1. **Database Update**: Inisialisasi default settings untuk Aulaa.co.
2. **Admin UI**: Modifikasi halaman integrasi agar mendukung tab Mayar dan Aulaa.co.
3. **submit-registration**: Tambahkan modul integrasi Aulaa.co (fetch ke `api.aulaa.co/v1/payments`).
4. **webhook**: Tambahkan logika verifikasi dan mapping status untuk Aulaa.co.
