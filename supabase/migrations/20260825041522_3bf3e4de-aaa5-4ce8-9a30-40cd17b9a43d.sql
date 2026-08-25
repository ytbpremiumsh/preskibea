select cron.schedule(
  'reconcile-fasttrack-payments',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://ltmfvbcazebowndigkyi.supabase.co/functions/v1/reconcile-payments',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"days": 30, "limit": 200}'::jsonb
  );
  $$
);