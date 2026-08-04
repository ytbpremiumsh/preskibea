-- ai_behavior: admin only
DROP POLICY IF EXISTS "Authenticated can delete ai_behavior" ON public.ai_behavior;
DROP POLICY IF EXISTS "Authenticated can insert ai_behavior" ON public.ai_behavior;
DROP POLICY IF EXISTS "Authenticated can read ai_behavior" ON public.ai_behavior;
DROP POLICY IF EXISTS "Authenticated can update ai_behavior" ON public.ai_behavior;

CREATE POLICY "Admins can read ai_behavior" ON public.ai_behavior
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert ai_behavior" ON public.ai_behavior
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update ai_behavior" ON public.ai_behavior
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete ai_behavior" ON public.ai_behavior
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ai_knowledge_base: read for signed-in, writes admin only
DROP POLICY IF EXISTS "Authenticated can delete ai_knowledge_base" ON public.ai_knowledge_base;
DROP POLICY IF EXISTS "Authenticated can insert ai_knowledge_base" ON public.ai_knowledge_base;
DROP POLICY IF EXISTS "Authenticated can update ai_knowledge_base" ON public.ai_knowledge_base;

CREATE POLICY "Admins can insert ai_knowledge_base" ON public.ai_knowledge_base
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update ai_knowledge_base" ON public.ai_knowledge_base
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete ai_knowledge_base" ON public.ai_knowledge_base
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- registrations: no direct public insert (submissions go through the edge function)
DROP POLICY IF EXISTS "public can submit registration" ON public.registrations;
ALTER TABLE public.registrations ALTER COLUMN status SET DEFAULT 'pending'::registration_status;

-- storage: kp-uploads readable only by admins
DROP POLICY IF EXISTS "kp-uploads public read" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read kp-uploads" ON storage.objects;
CREATE POLICY "Admins can read kp-uploads" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'kp-uploads' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete kp-uploads" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'kp-uploads' AND public.has_role(auth.uid(), 'admin'::app_role));