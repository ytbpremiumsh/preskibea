-- Dashboard admin membutuhkan nilai lama dan baru agar hanya memberi notifikasi
-- ketika status pembayaran benar-benar berubah menjadi paid.
ALTER TABLE public.payments REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
