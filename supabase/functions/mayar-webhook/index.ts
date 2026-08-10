import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const SECOND_APP_WEBHOOK_URL = "https://tvingnpdeueufagssdte.supabase.co/functions/v1/mayar-webhook";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  
  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    console.log("Mayar Webhook received:", body);

    // --- FORWARDING LOGIC ---
    // We forward the raw request to the second app in parallel
    // so both apps can process the same webhook event.
    try {
      console.log("Forwarding webhook to second app...");
      fetch(SECOND_APP_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Forwarding necessary headers if any, or just plain POST
        },
        body: rawBody,
      }).catch(err => console.error("Error forwarding to second app:", err.message));
    } catch (forwardErr) {
      console.error("Forwarding exception:", forwardErr.message);
    }
    // ------------------------

    const email = (body?.customer?.email || body?.email || body?.data?.customer?.email || body?.data?.email)?.trim();
    const status = body?.status || body?.data?.status; 
    const tokenFromExtra = body?.extraData?.noCustomer || body?.data?.extraData?.noCustomer;

    if (status === "success" || status === "paid" || body?.event === "payment.success" || body?.data?.event === "payment.success") {
       // Search for the latest pending fast_track registration
       let q = supabaseAdmin
         .from("registrations")
         .select("id, token, full_name, email, whatsapp, kind")
         .eq("fast_track", true)
         .eq("payment_status", "pending")
         .order("created_at", { ascending: false });

       if (tokenFromExtra) {
         q = q.eq("token", tokenFromExtra);
       } else if (email) {
         q = q.eq("email", email);
       }

       const { data: reg } = await q.limit(1).maybeSingle();

       if (reg) {
         await supabaseAdmin
           .from("registrations")
           .update({ 
             payment_status: "paid", 
             status: "approved" 
           })
           .eq("id", reg.id);
         
         console.log(`Registration ${reg.token} marked as paid.`);

         // Record payment in payments table
         try {
           const amount = body?.amount || body?.data?.amount || 15000;
           await supabaseAdmin.from("payments").insert({
             registration_id: reg.id,
             amount: Number(amount),
             status: status,
             payment_url: body?.payment_url || body?.data?.payment_url || null,
             external_id: body?.id || body?.data?.id || null
           });
         } catch (payErr) {
           console.error("Failed to record payment:", payErr.message);
         }

          try {
            const regDetail = reg;
            await supabaseAdmin.functions.invoke("send-whatsapp", {
              body: {
                type: "pendaftaran_sukses",
                full_name: regDetail.full_name,
                email: regDetail.email,
                whatsapp: regDetail.whatsapp,
                kind: regDetail.kind,
                token: reg.token,
              },
            });

            await supabaseAdmin.functions.invoke("notify-user", {
              body: {
                type: "registration",
                full_name: regDetail.full_name,
                email: regDetail.email,
                token: reg.token,
                kind: regDetail.kind,
                status: "approved"
              },
            });
          } catch (err) {
            console.error("Failed to send success notifications:", err.message);
          }
       } else {
         console.log("No matching pending fast-track registration found for this app. Skipping local processing.");
       }
    }

    return new Response(JSON.stringify({ received: true, forwarded: true }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});