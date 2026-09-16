import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const bearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!serviceRole || bearer !== serviceRole) return json({ error: 'Unauthorized' }, 401);

  try {
    const body = await req.json();
    const amount = Number(body.amount) || 0;
    const registration = body.registration ?? {};
    const formatter = new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
    });
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, serviceRole);
    const { data: devices, error } = await supabaseAdmin
      .from('admin_push_devices')
      .select('push_token,sound_enabled')
      .eq('active', true);
    if (error) throw error;
    if (!devices?.length) return json({ ok: true, sent: 0 });

    const messages = devices.map((device) => ({
      to: device.push_token,
      title: 'Pembayaran baru masuk 💰',
      body: `${registration.full_name || 'Peserta'} · ${formatter.format(amount)} · ${registration.token || '-'}`,
      data: { type: 'payment_paid', registration_id: registration.id, token: registration.token },
      sound: device.sound_enabled ? 'default' : null,
      channelId: device.sound_enabled ? 'payments_sound' : 'payments_silent',
      priority: 'high',
    }));
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Accept-Encoding': 'gzip, deflate', 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(`Expo Push gagal [${response.status}]`);
    return json({ ok: true, sent: messages.length, result });
  } catch (error) {
    console.error('send-admin-payment-push error', (error as Error).message);
    return json({ error: (error as Error).message }, 500);
  }
});
