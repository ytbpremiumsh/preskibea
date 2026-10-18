import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const bearer = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!serviceRole || bearer !== serviceRole) return json({ error: "Unauthorized" }, 401);
  try {
    const body = await req.json();
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRole);
    // Use the persisted transaction as the source of truth, never a caller's amount.
    if (!body.payment_id) return json({ error: "payment_id is required" }, 400);
    const { data: payment, error: paymentError } = await admin
      .from("payments")
      .select("id,registration_id,amount,status")
      .eq("id", body.payment_id)
      .single();
    if (paymentError) throw paymentError;
    if (!["paid", "success", "settlement"].includes(String(payment.status).toLowerCase()))
      return json({ error: "Payment is not successful" }, 400);
    const { data: registration, error: registrationError } = await admin
      .from("registrations")
      .select("id,full_name,token")
      .eq("id", payment.registration_id)
      .single();
    if (registrationError) throw registrationError;
    const { data: devices, error } = await admin
      .from("admin_push_devices")
      .select("push_token,sound_enabled,user_id")
      .eq("active", true);
    if (error) throw error;
    if (!devices?.length) return json({ ok: false, accepted: 0, reason: "no_active_devices" }, 409);
    // Recheck administrator access; stale registrations must not receive payment data.
    const { data: roles, error: roleError } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .in("user_id", [...new Set(devices.map((d) => d.user_id))]);
    if (roleError) throw roleError;
    const admins = new Set((roles ?? []).map((r) => r.user_id));
    const targets = devices.filter((d) => admins.has(d.user_id));
    if (!targets.length) return json({ ok: false, accepted: 0, reason: "no_admin_devices" }, 409);
    const amount = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(payment.amount) || 0);
    let accepted = 0;
    const ticketIds: string[] = [];
    const failures: unknown[] = [];
    for (let offset = 0; offset < targets.length; offset += 100) {
      const batch = targets.slice(offset, offset + 100);
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(Deno.env.get("EXPO_ACCESS_TOKEN")
            ? { Authorization: `Bearer ${Deno.env.get("EXPO_ACCESS_TOKEN")}` }
            : {}),
        },
        body: JSON.stringify(
          batch.map((device) => ({
            to: device.push_token,
            title: "Pembayaran valid",
            body: `${amount} berhasil diverifikasi dari ${registration.full_name || "Peserta"}.`,
            data: {
              type: "payment_paid",
              payment_id: payment.id,
              registration_id: registration.id,
            },
            sound: device.sound_enabled ? "default" : null,
            channelId: device.sound_enabled ? "payments_sound" : "payments_silent",
            priority: "high",
            ttl: 86400,
          })),
        ),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          `Expo Push HTTP ${response.status}: ${JSON.stringify(result.errors ?? [])}`,
        );
      if (!Array.isArray(result.data) || result.data.length !== batch.length)
        throw new Error("Invalid Expo ticket response");
      for (let i = 0; i < result.data.length; i++) {
        const ticket = result.data[i];
        if (ticket.status === "ok") {
          accepted++;
          if (ticket.id) ticketIds.push(ticket.id);
          continue;
        }
        const code = ticket.details?.error ?? "unknown";
        failures.push({ code, message: ticket.message });
        if (code === "DeviceNotRegistered") {
          const { error: updateError } = await admin
            .from("admin_push_devices")
            .update({ active: false, updated_at: new Date().toISOString() })
            .eq("push_token", batch[i].push_token);
          if (updateError) console.error("Deactivate push device failed", updateError.message);
        }
      }
    }
    // Ticket acceptance is not a delivery receipt; never report it as delivered.
    if (failures.length) console.error("Expo rejected payment push", JSON.stringify(failures));
    return json(
      { ok: failures.length === 0, accepted, rejected: failures.length, failures },
      failures.length ? 502 : 200,
    );
  } catch (error) {
    const message = (error as Error).message;
    console.error("send-admin-payment-push error", message);
    return json({ error: message }, 500);
  }
});
