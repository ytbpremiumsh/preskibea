# Setup GitHub Webhook Auto-Update (Static SPA)

Aplikasi ini mendukung auto-update via GitHub Webhook. Endpoint tersedia di `/api/public/github-webhook` (dihandle oleh Supabase Edge Function).

## Alur Kerja

```
Push ke GitHub
   ↓
GitHub POST ke https://kejarprestasi.id/api/public/github-webhook
   ↓
Supabase verifikasi signature & flag auto_update_enabled
   ↓
Trigger action ke VPS (via SSH command atau agent) untuk jalankan update.sh
   ↓
git pull → npm install → npm run build → sync dist/ ke webroot
```

## 1. Konfigurasi di VPS

Pastikan script `update.sh` di root repo bisa dijalankan:

```bash
cd /var/www/kejarprestasi
chmod +x update.sh
```

## 2. Generate Webhook Secret

Generate string random di VPS:

```bash
openssl rand -hex 32
```

## 3. Simpan Secret ke Supabase

Jalankan SQL ini di dashboard Supabase:

```sql
INSERT INTO site_settings (key, value)
VALUES ('github_webhook_secret', '{"secret": "PASTE_SECRET_DARI_STEP_2"}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value)
VALUES ('auto_update_enabled', '{"enabled": true}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

## 4. Setup Webhook di GitHub

1. Repo Settings → Webhooks → Add webhook
2. Payload URL: `https://kejarprestasi.id/api/public/github-webhook` (Sesuaikan domain)
3. Content type: `application/json`
4. Secret: Paste secret dari Step 2
5. Events: `Just the push event`

## Troubleshooting

- **500 Error**: Periksa izin folder `/www/wwwroot/kejarprestasi.id`. Script update harus punya izin tulis dan Nginx harus punya izin baca.
- **Webhook Status**: Cek tab "Recent Deliveries" di GitHub.
- **SSR References**: Abaikan referensi PM2 atau Node.js server di dokumentasi lama. App ini murni statis.
