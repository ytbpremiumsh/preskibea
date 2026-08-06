ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS fast_track boolean DEFAULT false;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.registrations TO authenticated;
GRANT ALL ON public.registrations TO service_role;
