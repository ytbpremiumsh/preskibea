import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { type, full_name, email, token, kind, status } = await req.json()

    if (!email || !token) {
      throw new Error("Missing required fields: email and token")
    }

    const result = await sendTemplateEmail(type, email, {
      templateData: {
        full_name,
        token,
        kind,
        status,
        siteName: "Prestasi Kita"
      },
      idempotencyKey: `reg-${token}-${Date.now()}`
    })

    return new Response(JSON.stringify(result), {
      status: 200,
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
