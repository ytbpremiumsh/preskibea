-- Setup for the participant dashboard. Apply through the project's authorized migration process.
-- No anonymous direct table access; participant operations go through the token-validated Edge Function.
create table if not exists public.peserta_reports (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  subject text not null check (length(subject) between 1 and 120),
  message text not null check (length(message) between 1 and 4000),
  status text not null default 'open' check (status in ('open','resolved')),
  admin_reply text check (admin_reply is null or length(admin_reply) <= 4000),
  image_path text,
  created_at timestamptz not null default now()
);
create index if not exists peserta_reports_registration_created_idx on public.peserta_reports (registration_id, created_at desc);
create index if not exists peserta_reports_created_idx on public.peserta_reports (created_at desc);
alter table public.peserta_reports enable row level security;
revoke all on public.peserta_reports from public, anon, authenticated;
grant select, update on public.peserta_reports to authenticated;
grant all on public.peserta_reports to service_role;
create policy "admins read participant reports" on public.peserta_reports for select to authenticated using (public.has_role((select auth.uid()), 'admin'));
create policy "admins update participant reports" on public.peserta_reports for update to authenticated using (public.has_role((select auth.uid()), 'admin')) with check (public.has_role((select auth.uid()), 'admin'));
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values ('peserta-kendala','peserta-kendala',false,2097152,array['image/jpeg','image/png','image/webp']) on conflict (id) do nothing;
create policy "admins read participant issue images" on storage.objects for select to authenticated using (bucket_id = 'peserta-kendala' and public.has_role((select auth.uid()), 'admin'));
-- Atomic, persistent fixed-window limiter; only callable by service role.
create table if not exists public.peserta_rate_limits (key text primary key, window_start timestamptz not null, attempts integer not null);
alter table public.peserta_rate_limits enable row level security;
revoke all on public.peserta_rate_limits from public, anon, authenticated;
grant all on public.peserta_rate_limits to service_role;
create or replace function public.peserta_rate_limit(p_key text) returns boolean language plpgsql security invoker set search_path = '' as $$
declare n integer;
begin
  if random() < 0.01 then delete from public.peserta_rate_limits where window_start < now() - interval '1 day'; end if;
  if p_key !~ '^[0-9a-f]{64}$' then return false; end if;
  insert into public.peserta_rate_limits as r (key, window_start, attempts) values (p_key, now(), 1)
  on conflict (key) do update set window_start = case when r.window_start < now() - interval '1 minute' then now() else r.window_start end,
  attempts = case when r.window_start < now() - interval '1 minute' then 1 else r.attempts + 1 end returning attempts into n;
  return n <= 30;
end $$;
revoke all on function public.peserta_rate_limit(text) from public, anon, authenticated;
grant execute on function public.peserta_rate_limit(text) to service_role;
