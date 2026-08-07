import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { type, full_name, email, token, kind, status, whatsapp, count } = await req.json()

    if (!email || !token) {
      throw new Error("Missing required fields: email and token")
    }

    console.log(`Attempting to send ${type} email to ${email} for ${full_name}`);

    // Mapping type to the customizable setting key used by send-app-email
    const typeMap: Record<string, string> = {
      "registration": "registration-confirmation",
      "berkas": "berkas-confirmation"
    };

    const templateName = typeMap[type] || type;

    const result = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-app-email`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        templateName,
        recipientEmail: email,
        templateData: {
          full_name,
          token,
          kind,
          status,
          whatsapp,
          count,
        },
      }),
    });

    const resJson = await result.json();

    return new Response(JSON.stringify(resJson), {
      status: result.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("Email error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
