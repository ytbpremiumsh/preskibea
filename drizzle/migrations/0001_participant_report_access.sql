REVOKE ALL ON public.peserta_reports FROM anon, authenticated;
GRANT SELECT, UPDATE ON public.peserta_reports TO authenticated;
GRANT ALL ON public.peserta_reports TO service_role;
GRANT ALL ON public.peserta_rate_limits TO service_role;
ALTER TABLE public.peserta_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peserta_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON FUNCTION public.peserta_rate_limit(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.peserta_rate_limit(text) TO service_role;
CREATE INDEX IF NOT EXISTS peserta_reports_registration_created_idx ON public.peserta_reports (registration_id, created_at DESC);