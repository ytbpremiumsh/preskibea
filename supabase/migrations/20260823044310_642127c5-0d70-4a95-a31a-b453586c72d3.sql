ALTER TABLE public.registrations REPLICA IDENTITY FULL;
ALTER TABLE public.documents REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;