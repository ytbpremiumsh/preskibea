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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  
  try {
    const body = await req.json();
    console.log("Mayar Webhook received:", body);

    // Mayar webhook structure usually has 'data' or top-level fields
    // We assume it sends some identifier that we can map back to our registration
    // For now, we'll try to find by email or an external_id if passed.
    // Ideally, we include the registration token in the Mayar payment URL as a query param
    // that Mayar returns in the webhook payload.
    
    const email = body?.customer?.email || body?.email;
    const status = body?.status; // e.g., 'paid' or 'success'
    const mobile = body?.customer?.mobile || body?.mobile;

    if (status === "success" || status === "paid" || body?.event === "payment.success") {
       // Search for the latest pending fast_track registration with this email
       const { data: reg } = await supabaseAdmin
         .from("registrations")
         .select("id, token")
         .eq("email", email)
         .eq("fast_track", true)
         .eq("payment_status", "pending")
         .order("created_at", { ascending: false })
         .limit(1)
         .maybeSingle();

       if (reg) {
         await supabaseAdmin
           .from("registrations")
           .update({ 
             payment_status: "paid", 
             status: "approved" 
           })
           .eq("id", reg.id);
         
         console.log(`Registration ${reg.token} marked as paid.`);

         // Fire-and-forget success notification via WhatsApp
         try {
           const { data: regDetail } = await supabaseAdmin
             .from("registrations")
             .select("full_name, email, whatsapp, kind")
             .eq("id", reg.id)
             .single();

           if (regDetail) {
             await supabaseAdmin.functions.invoke("send-whatsapp", {
               body: {
                 type: "pendaftaran_sukses", // Template for successful payment
                 full_name: regDetail.full_name,
                 email: regDetail.email,
                 whatsapp: regDetail.whatsapp,
                 kind: regDetail.kind,
                 token: reg.token,
               },
             });
            }

            // Also send email confirmation on successful payment
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
           console.error("Failed to send WA success notification:", err.message);
         }
       }
    }

    return new Response(JSON.stringify({ received: true }), {
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
