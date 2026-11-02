import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "https://esm.sh/zod@3.23.8";
import { notificationKey } from "../_shared/email-safety.ts";

const Input = z.object({
  type: z.enum(["registration", "berkas", "esai"]),
  full_name: z.string().min(1).max(255),
  email: z.string().email(),
  token: z.string().min(1).max(100),
  kind: z.enum(["prestasi", "ekonomi", "umum", "yatim"]),
  status: z.string().max(100).optional(),
  whatsapp: z.string().max(30).optional(),
  count: z.number().int().nonnegative().optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  const expected = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = req.headers.get("Authorization") ?? "";
  if (!expected || authorization !== `Bearer ${expected}`) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const parsed = Input.safeParse(await req.json());
    if (!parsed.success) return new Response(JSON.stringify({ error: "Data pemberitahuan tidak valid" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { type, full_name, email, token, kind, status, whatsapp, count } = parsed.data;

    // Unified email sending logic that prioritizes custom templates from site_settings
    const typeMap: Record<string, string> = {
      "registration": "registration-confirmation",
      "berkas": "berkas-confirmation",
      "esai": "esai-confirmation"
    };

    const templateName = typeMap[type] || type;

    // Call send-app-email which already handles custom templates from site_settings
    // and falls back to default layouts if custom ones are disabled.
    const result = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-app-email`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        templateName,
        recipientEmail: email,
        idempotencyKey: notificationKey(type, token, status, count),
        templateData: {
          full_name,
          token,
          kind,
          status,
          whatsapp,
          count,
          site_name: "Prestasi Kita",
        },
      }),
    });

    const resJson = await result.json();

    if (!result.ok) {
      console.error(`Email delivery request failed with status ${result.status}`)
    }

    return new Response(JSON.stringify(resJson), {
      status: result.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("Notification request failed");
    return new Response(JSON.stringify({ error: "Pemberitahuan email gagal diproses" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
