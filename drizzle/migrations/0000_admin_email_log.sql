-- Email logs contain participant information. Only admins may read them;
-- service-role code alone writes attempts and outcomes.
REVOKE ALL ON public.email_send_log FROM anon, authenticated;
GRANT SELECT ON public.email_send_log TO authenticated;
DROP POLICY IF EXISTS "Admins can read email send log" ON public.email_send_log;
CREATE POLICY "Admins can read email send log"
ON public.email_send_log FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = 'admin'));
