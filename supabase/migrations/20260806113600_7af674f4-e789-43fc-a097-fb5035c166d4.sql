ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_url text;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.registrations TO authenticated;
GRANT ALL ON public.registrations TO service_role;
