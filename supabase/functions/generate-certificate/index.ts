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

    // Colors
    const primaryNavy = "#1a2a47";
    const highlightYellow = "#ffd700";
    const mosaicBlue = "#2563eb";
    const mosaicLight = "#60a5fa";

    // 1. Background (White)
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, width, height, "F");

    // 2. Mosaic Pattern (Left & Right Sides)
    // Left Side Mosaic
    const drawMosaic = (startX: number) => {
      const colors = [primaryNavy, mosaicBlue, mosaicLight, highlightYellow];
      const size = 15;
      for (let y = 0; y < height; y += size) {
        for (let x = 0; x < 30; x += size) {
          const color = colors[Math.floor(Math.random() * colors.length)];
          doc.setFillColor(color);
          doc.rect(startX + x, y, size, size, "F");
        }
      }
    };
    drawMosaic(0);
    drawMosaic(width - 30);

    // 3. Central Content Area Border
    doc.setDrawColor(primaryNavy);
    doc.setLineWidth(0.8);
    doc.rect(35, 10, width - 70, height - 20, "D");

    // 4. Header Section
    doc.setTextColor(primaryNavy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.text("SERTIFIKAT", width / 2, 40, { align: "center" });
    doc.setFontSize(24);
    doc.text("PENGHARGAAN", width / 2, 50, { align: "center" });

    // Decorative line under title
    doc.setDrawColor(highlightYellow);
    doc.setLineWidth(2);
    doc.line(width / 2 - 40, 55, width / 2 + 40, 55);

    // 5. Main Body
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("Dengan bangga diberikan kepada:", width / 2, 75, { align: "center" });

    doc.setFontSize(38);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryNavy);
    doc.text(reg.full_name.toUpperCase(), width / 2, 95, { align: "center" });

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    const category = reg.kind.charAt(0).toUpperCase() + reg.kind.slice(1);
    doc.text("Atas partisipasinya sebagai Peserta pada program", width / 2, 115, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(`Beasiswa Prestasi Kita Batch #8 - Kategori ${category}`, width / 2, 125, { align: "center" });

    // 6. Footer (Official Details)
    const docNumber = `SK/${reg.kind.toUpperCase()}/PK-B8/${new Date().getFullYear()}/${reg.token.split("-").pop()}`;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(primaryNavy);
    doc.text(`Nomor Surat: ${docNumber}`, 45, height - 30);
    doc.text(`ID Sertifikat: ${reg.token}`, 45, height - 25);
    doc.text(`Tanggal Rilis: ${new Date().toLocaleDateString("id-ID")}`, width - 45, height - 25, { align: "right" });

    // 7. Signature Area
    doc.setDrawColor(primaryNavy);
    doc.setLineWidth(0.5);
    doc.line(width / 2 - 30, height - 40, width / 2 + 30, height - 40);
    doc.setFont("helvetica", "bold");
    doc.text("DIREKTUR PRESTASI KITA", width / 2, height - 33, { align: "center" });

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
