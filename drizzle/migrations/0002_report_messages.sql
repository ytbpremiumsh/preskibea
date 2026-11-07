CREATE TABLE public.peserta_report_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.peserta_reports(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('participant','admin')),
  message text NOT NULL,
  image_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.peserta_report_messages TO service_role;
ALTER TABLE public.peserta_report_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX peserta_report_messages_report_idx ON public.peserta_report_messages(report_id, created_at);