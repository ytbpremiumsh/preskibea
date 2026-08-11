import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-mayar-signature, x-webhook-signature",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const SECOND_APP_WEBHOOK_URL = "https://tvingnpdeueufagssdte.supabase.co/functions/v1/mayar-webhook";

// Helpers for Aulaa.co Webhook Verification using Web Crypto API
async function verifyAulaaWebhook(rawBody: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const data = encoder.encode(rawBody);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, data);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, "0")).join("");

  return signature === signatureHex;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  
  try {
    const rawBody = await req.text();
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      console.error("Failed to parse JSON body:", e);
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    console.log("Webhook received:", body);

    // --- FORWARDING LOGIC ---
    try {
      console.log("Forwarding webhook to second app...");
      fetch(SECOND_APP_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Mayar-Signature": req.headers.get("X-Mayar-Signature") || "",
          "X-Webhook-Signature": req.headers.get("X-Webhook-Signature") || "",
        },
        body: rawBody,
      }).catch(err => console.error("Error forwarding to second app:", err.message));
    } catch (forwardErr) {
      console.error("Forwarding exception:", forwardErr.message);
    }
    // ------------------------

    // Determine provider and extract relevant info
    let provider: "mayar" | "aulaa" | "unknown" = "unknown";
    let email: string | undefined;
    let status: string | undefined;
    let tokenFromExtra: string | undefined;
    let paymentAmount: number | undefined;
    let externalId: string | undefined;

    const mayarSig = req.headers.get("X-Mayar-Signature");
    const aulaaSig = req.headers.get("X-Webhook-Signature");

    if (mayarSig) {
      provider = "mayar";
      email = (body?.customer?.email || body?.email || body?.data?.customer?.email || body?.data?.email)?.trim();
      status = body?.status || body?.data?.status; 
      tokenFromExtra = body?.extraData?.noCustomer || body?.data?.extraData?.noCustomer;
      paymentAmount = body?.amount || body?.data?.amount;
      externalId = body?.id || body?.data?.id;
    } else if (aulaaSig) {
      const { data: aulaaConfigRow } = await supabaseAdmin
        .from("site_settings")
        .select("value")
        .eq("key", "aulaa_config")
        .maybeSingle();
      const aulaaConfig = (aulaaConfigRow?.value ?? {}) as { webhook_secret?: string };

      if (aulaaConfig.webhook_secret && await verifyAulaaWebhook(rawBody, aulaaSig, aulaaConfig.webhook_secret)) {
        provider = "aulaa";
        email = body?.data?.customer_email?.trim();
        status = body?.data?.status; // "paid", "pending", "failed"
        // Aulaa.co order_id format is likely set as token in invoice creation
        tokenFromExtra = body?.data?.order_id;
        paymentAmount = body?.data?.amount;
        externalId = body?.data?.id;
      } else {
        console.warn("Aulaa.co webhook received but signature verification failed or secret missing.");
        return new Response(JSON.stringify({ error: "Verification failed" }), { status: 403, headers: cors });
      }
    } else {
      // Fallback for Mayar if signature header is missing but body looks like Mayar
      if (body?.extraData?.noCustomer || body?.data?.extraData?.noCustomer) {
        provider = "mayar";
        email = (body?.customer?.email || body?.email || body?.data?.customer?.email || body?.data?.email)?.trim();
        status = body?.status || body?.data?.status; 
        tokenFromExtra = body?.extraData?.noCustomer || body?.data?.extraData?.noCustomer;
        paymentAmount = body?.amount || body?.data?.amount;
        externalId = body?.id || body?.data?.id;
      }
    }

    if (status === "success" || status === "paid" || body?.event === "payment.success" || body?.data?.event === "payment.success") {
       console.log(`Processing successful payment for ${provider}, token: ${tokenFromExtra}`);
       
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
         
         console.log(`Registration ${reg.token} marked as paid via ${provider}.`);

         // Record payment in payments table
         try {
           await supabaseAdmin.from("payments").insert({
             registration_id: reg.id,
             amount: Number(paymentAmount) || 0,
             status: status,
             external_id: externalId,
             provider: provider,
           });
         } catch (payErr) {
           console.error("Failed to record payment:", payErr.message);
         }

          try {
            await supabaseAdmin.functions.invoke("send-whatsapp", {
              body: {
                type: "pendaftaran_sukses",
                full_name: reg.full_name,
                email: reg.email,
                whatsapp: reg.whatsapp,
                kind: reg.kind,
                token: reg.token,
              },
            });

            await supabaseAdmin.functions.invoke("notify-user", {
              body: {
                type: "registration",
                full_name: reg.full_name,
                email: reg.email,
                token: reg.token,
                kind: reg.kind,
                status: "approved"
              },
            });
          } catch (err) {
            console.error("Failed to send success notifications:", err.message);
          }
       } else {
         console.log(`No matching pending fast-track registration found for token ${tokenFromExtra} / email ${email}.`);
       }
    }

    return new Response(JSON.stringify({ received: true, provider }), {
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