CREATE TABLE IF NOT EXISTS public.admin_push_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  push_token text NOT NULL UNIQUE,
  platform text NOT NULL DEFAULT 'android',
  sound_enabled boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_push_devices_user_id_idx
  ON public.admin_push_devices(user_id);

ALTER TABLE public.admin_push_devices ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.admin_push_devices FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_push_devices TO authenticated;
GRANT ALL ON public.admin_push_devices TO service_role;

CREATE POLICY "Admin manages own push devices"
  ON public.admin_push_devices
  FOR ALL
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );

ALTER TABLE public.admin_push_devices REPLICA IDENTITY FULL;
