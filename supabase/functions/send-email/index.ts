import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { RegistrationEmail } from '../_shared/email-templates/registration-confirmation.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_NAME = "Prestasi Kita"
const FROM_DOMAIN = "prestasikita.com"
const SENDER_DOMAIN = "notify.prestasikita.com"

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { type, full_name, email, token, kind, status } = await req.json()

    if (!email || !token) {
      throw new Error("Missing required fields: email and token")
    }

    let html = ""
    let subject = ""

    if (type === 'registration') {
      subject = `Konfirmasi Pendaftaran ${SITE_NAME} - ${token}`
      html = await renderAsync(
        React.createElement(RegistrationEmail, {
          full_name,
          token,
          kind,
          status,
          siteName: SITE_NAME
        })
      )
    } else {
       throw new Error(`Unknown email type: ${type}`)
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY')
    const sendUrl = Deno.env.get('LOVABLE_SEND_URL') || "https://api.lovable.dev/v1/emails/send"

    if (!apiKey) {
      console.warn("LOVABLE_API_KEY is not set, email will not be sent")
      return new Response(JSON.stringify({ message: "API Key missing, but template rendered successfully", html }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const res = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        to: [email],
        subject,
        html,
        senderDomain: SENDER_DOMAIN,
      }),
    })

    const result = await res.json()

    return new Response(JSON.stringify(result), {
      status: res.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
