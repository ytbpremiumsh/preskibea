import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Check if certificates are enabled
    const { data: config } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "certificate_config")
      .maybeSingle();
    
    const settings = (config?.value as any) || { enabled: true };
    if (!settings.enabled) {
      return new Response(JSON.stringify({ ok: false, error: "Certificates are currently disabled" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Lookup registrant
    const { data: reg, error: regError } = await supabase
      .from("registrations")
      .select("full_name, kind, token")
      .eq("token", token)
      .maybeSingle();

    if (regError || !reg) {
      return new Response(JSON.stringify({ ok: false, error: "Registrant not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Generate PDF
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    // Background and border
    doc.setFillColor(255, 255, 255); // White background
    doc.rect(0, 0, width, height, "F");
    
    // Pattern or side decoration (Navy blue side bars)
    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, 30, height, "F");
    doc.rect(width - 30, 0, 30, height, "F");

    // Gold inner border
    doc.setDrawColor(193, 157, 79); // Gold
    doc.setLineWidth(1);
    doc.rect(35, 10, width - 70, height - 20, "D");
    doc.setLineWidth(0.5);
    doc.rect(37, 12, width - 74, height - 24, "D");

    // Title
    doc.setTextColor(15, 23, 42); // Navy
    doc.setFont("helvetica", "bold");
    doc.setFontSize(36);
    doc.text("SERTIFIKAT PENGHARGAAN", width / 2, 40, { align: "center" });

    // Logo Placeholder or Decorative Element
    doc.setDrawColor(193, 157, 79);
    doc.setLineWidth(1);
    doc.circle(width / 2, 60, 10, "D");

    // Body
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(14);
    doc.setFont("helvetica", "italic");
    doc.text("Dengan bangga diberikan kepada:", width / 2, 85, { align: "center" });

    doc.setFontSize(38);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(reg.full_name.toUpperCase(), width / 2, 105, { align: "center" });

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    const category = reg.kind.charAt(0).toUpperCase() + reg.kind.slice(1);
    doc.text(`Atas partisipasinya sebagai Peserta pada program`, width / 2, 125, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(`Beasiswa Prestasi Kita Batch #8 - Kategori ${category}`, width / 2, 135, { align: "center" });

    // Footer info
    const docNumber = `SK/${reg.kind.toUpperCase()}/PK-B8/${new Date().getFullYear()}/${reg.token.split('-').pop()}`;
    doc.setFontSize(10);
    doc.text(`Nomor Surat: ${docNumber}`, 20, height - 25);
    doc.text(`ID Sertifikat: ${reg.token}`, 20, height - 20);
    doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, width - 20, height - 20, { align: "right" });

    // Signature placeholders
    doc.setTextColor(15, 23, 42);
    doc.setDrawColor(15, 23, 42);
    doc.line(width / 2 - 40, height - 45, width / 2 + 40, height - 45);
    doc.setFont("helvetica", "bold");
    doc.text("Direktur Prestasi Kita", width / 2, height - 38, { align: "center" });

    const pdfOutput = doc.output("arraybuffer");

    return new Response(pdfOutput, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Sertifikat_${reg.token}.pdf"`,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
