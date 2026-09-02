import { jsPDF } from "jspdf";

export type InvoiceData = {
  invoiceNo: string;
  date: Date;
  name: string;
  email: string;
  whatsapp?: string | null;
  item: string;
  kind: string;
  amount: number;
  provider?: string | null;
  reference?: string | null;
};

const rupiah = (n: number) => "Rp " + (n || 0).toLocaleString("id-ID");

export function downloadInvoicePdf(inv: InvoiceData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 18;

  // Header band (navy)
  doc.setFillColor(15, 32, 68);
  doc.rect(0, 0, W, 38, "F");
  // Gold accent line
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 38, W, 1.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("INVOICE", M, 17);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Prestasi Kita — Beasiswa Batch #8", M, 24);
  doc.setFontSize(9);
  doc.text(inv.invoiceNo, M, 30);

  // Status badge (LUNAS)
  doc.setFillColor(16, 185, 129);
  const badgeW = 34;
  doc.roundedRect(W - M - badgeW, 12, badgeW, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("LUNAS", W - M - badgeW / 2, 18.8, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    inv.date.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) +
      " " +
      inv.date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) +
      " WIB",
    W - M,
    30,
    { align: "right" },
  );

  // Billing info
  let y = 52;
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.text("DITAGIHKAN KEPADA", M, y);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(inv.name, M, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text(inv.email, M, y + 11.5);
  if (inv.whatsapp) doc.text(inv.whatsapp, M, y + 16);

  // Item table header
  y = 82;
  doc.setFillColor(245, 246, 250);
  doc.rect(M, y, W - M * 2, 9, "F");
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("DESKRIPSI", M + 3, y + 6);
  doc.text("JUMLAH", W - M - 3, y + 6, { align: "right" });

  // Item row
  y += 15;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(inv.item, 110), M + 3, y);
  doc.setFontSize(10);
  doc.text(rupiah(inv.amount), W - M - 3, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Kategori: ${inv.kind}`, M + 3, y + 5);

  // Total
  y += 18;
  doc.setDrawColor(220, 220, 220);
  doc.line(M, y, W - M, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 32, 68);
  doc.text("TOTAL TERBAYAR", M, y);
  doc.text(rupiah(inv.amount), W - M, y, { align: "right" });

  // Payment meta
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(110, 110, 110);
  if (inv.provider) {
    doc.text(`Metode/Provider: ${inv.provider.toUpperCase()}`, M, y);
    y += 5;
  }
  if (inv.reference) {
    doc.text(`Referensi: ${inv.reference}`, M, y);
    y += 5;
  }

  // Footer note
  y = 270;
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.6);
  doc.line(M, y, W - M, y);
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text(
    "Invoice ini diterbitkan otomatis oleh sistem dan sah tanpa tanda tangan.",
    W / 2,
    y + 6,
    { align: "center" },
  );
  doc.text("Prestasi Kita · prestasikita.id · @prestasikita", W / 2, y + 11, {
    align: "center",
  });

  doc.save(`${inv.invoiceNo}.pdf`);
}
