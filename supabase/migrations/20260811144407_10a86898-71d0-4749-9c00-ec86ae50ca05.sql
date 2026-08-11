INSERT INTO public.site_settings (key, value)
VALUES ('fast_track_fee', '15000')
ON CONFLICT (key) DO NOTHING;