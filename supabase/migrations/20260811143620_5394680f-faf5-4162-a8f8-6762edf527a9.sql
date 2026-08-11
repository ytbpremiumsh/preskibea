-- Initialize default settings for Aulaa.co
INSERT INTO public.site_settings (key, value)
VALUES 
  ('payment_provider', '"mayar"'),
  ('aulaa_config', '{"project_id": "", "api_key": "", "webhook_secret": ""}')
ON CONFLICT (key) DO NOTHING;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
GRANT SELECT ON public.site_settings TO anon;
