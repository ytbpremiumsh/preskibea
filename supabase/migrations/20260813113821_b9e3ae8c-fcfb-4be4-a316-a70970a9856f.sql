-- Adding columns for additional documentation in Prestasi category
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS khs_url TEXT,
ADD COLUMN IF NOT EXISTS transcript_custom_url TEXT,
ADD COLUMN IF NOT EXISTS additional_docs_url TEXT;

COMMENT ON COLUMN public.registrations.khs_url IS 'URL for Kartu Hasil Studi (Prestasi Category)';
COMMENT ON COLUMN public.registrations.transcript_custom_url IS 'URL for Transkrip Nilai (Prestasi Category)';
COMMENT ON COLUMN public.registrations.additional_docs_url IS 'URL for Berkas Pendukung Lainnya';
