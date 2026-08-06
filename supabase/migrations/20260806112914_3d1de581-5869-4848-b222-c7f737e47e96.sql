-- 1. documents: no direct public inserts (submissions go via edge function/service role)
DROP POLICY IF EXISTS "public can submit document" ON public.documents;
REVOKE INSERT ON public.documents FROM anon, authenticated;

-- 2. donations: no direct public inserts (created by create-donation edge function)
DROP POLICY IF EXISTS "public can submit donation" ON public.donations;
REVOKE INSERT ON public.donations FROM anon, authenticated;

-- 3. storage: restrict anonymous uploads to the scholarship folders of kp-uploads
DROP POLICY IF EXISTS "kp-uploads public upload" ON storage.objects;
CREATE POLICY "kp-uploads scoped upload"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'kp-uploads'
  AND (storage.foldername(name))[1] IN ('prestasi','ekonomi','umum','yatim')
  AND coalesce(array_length(storage.foldername(name), 1), 0) BETWEEN 2 AND 3
);

-- 4. site_settings: hide sensitive configuration keys from the public
DROP POLICY IF EXISTS "public can read site settings" ON public.site_settings;

CREATE POLICY "public can read non-sensitive site settings"
ON public.site_settings FOR SELECT
TO anon, authenticated
USING (
  key NOT IN ('whatsapp','mayar_config','ai_provider','ai_provider_settings','smtp','email_config','email_settings')
);

CREATE POLICY "admins can read all site settings"
ON public.site_settings FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. harden helper function search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;