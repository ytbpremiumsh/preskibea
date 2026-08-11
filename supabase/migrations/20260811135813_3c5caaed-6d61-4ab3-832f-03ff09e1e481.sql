ALTER TABLE public.payments ADD COLUMN provider text;
COMMENT ON COLUMN public.payments.provider IS 'Payment provider (mayar, aulaa)';

-- Ensure site_settings are accessible to admin
GRANT ALL ON public.payments TO service_role;
GRANT SELECT ON public.payments TO authenticated;
