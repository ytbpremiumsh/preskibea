import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";

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

async function verifyAulaaSignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  if (!signature || !secret) return false;
  
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody)
  );
  
  const expectedSignature = encodeHex(new Uint8Array(sigBuffer));
  return signature === expectedSignature;
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

    // Identify Provider
    const aulaaSignature = req.headers.get("x-webhook-signature");
    let provider = "mayar";
    let isSignatureValid = true; // Skip Mayar signature check for now if not needed

    if (aulaaSignature) {
      provider = "aulaa";
      // Verify Aulaa Signature
      const { data: settings } = await supabaseAdmin
        .from("site_settings")
        .select("value")
        .eq("key", "aulaa_config")
        .maybeSingle();
      
      const secret = (settings?.value as any)?.webhook_secret;
      if (secret) {
        isSignatureValid = await verifyAulaaSignature(rawBody, aulaaSignature, secret);
      } else {
        console.warn("Aulaa webhook secret not configured, skipping verification.");
      }
    }

    if (!isSignatureValid) {
      console.error("Invalid webhook signature from", provider);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Determine and extract relevant info
    let email, status, tokenFromExtra, paymentAmount, externalId;

    if (provider === "mayar") {
      email = (body?.customer?.email || body?.email || body?.data?.customer?.email || body?.data?.email)?.trim();
      status = body?.status || body?.data?.status; 
      tokenFromExtra = body?.extraData?.noCustomer || body?.data?.extraData?.noCustomer;
      paymentAmount = body?.amount || body?.data?.amount;
      externalId = body?.id || body?.data?.id;
    } else if (provider === "aulaa") {
      // Aulaa Payload
      email = body?.email;
      status = body?.status;
      tokenFromExtra = body?.order_id;
      paymentAmount = body?.amount;
      externalId = body?.id;
    } else if (provider === "doku") {
      // Doku Payload
      email = body?.customer?.email;
      status = body?.transaction?.status; // Doku uses transaction.status (SUCCESS, FAILED, etc.)
      tokenFromExtra = body?.order?.invoice_number;
      paymentAmount = body?.order?.amount;
      externalId = body?.order?.invoice_number;
      
      if (status === "SUCCESS") status = "paid";
    }

    if (status === "success" || status === "paid" || body?.event === "payment.success" || body?.data?.event === "payment.success") {
       console.log(`Processing successful payment (${provider}), token: ${tokenFromExtra}`);
       
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
    // Log exception to DB for debugging
    try {
      await supabaseAdmin.from("site_settings").insert({
        key: `webhook_error_${Date.now()}`,
        value: { error: e.message, stack: e.stack, time: new Date().toISOString() }
      });
    } catch (logErr) {
      console.error("Failed to log error to DB:", logErr.message);
    }
    
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});