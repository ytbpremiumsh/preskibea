INSERT INTO public.site_settings (key, value) 
VALUES ('mayar_fast_track_link', '"https://mayar.id/link/pembayaran-fast-track"')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;