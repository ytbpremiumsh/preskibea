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
  const navy: [number, number, number] = [15, 32, 68];
  const gold: [number, number, number] = [212, 175, 55];
  const green: [number, number, number] = [22, 163, 74];
  const ink: [number, number, number] = [31, 41, 55];
  const muted: [number, number, number] = [107, 114, 128];
  const line: [number, number, number] = [226, 232, 240];
  const paidAt =
    inv.date.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) +
    ", " +
    inv.date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) +
    " WIB";

  // Premium letterhead
  doc.setFillColor(...navy);
  doc.rect(0, 0, W, 49, "F");
  doc.setFillColor(...gold);
  doc.rect(0, 49, W, 2, "F");
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.7);
  doc.circle(M + 6, 19, 6, "S");
  doc.setTextColor(...gold);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("PK", M + 6, 20.6, { align: "center" });
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text("PRESTASI KITA", M + 16, 17.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("PROGRAM BEASISWA PENDIDIKAN BATCH #8", M + 16, 23);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text("INVOICE TRANSAKSI", W - M, 17, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(214, 220, 231);
  doc.text(inv.invoiceNo, W - M, 24, { align: "right" });

  // Verified status strip
  doc.setFillColor(239, 253, 244);
  doc.roundedRect(M, 60, W - M * 2, 22, 2, 2, "F");
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(M, 60, W - M * 2, 22, 2, 2, "S");
  doc.setFillColor(...green);
  doc.circle(M + 8, 71, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("V", M + 8, 72.2, { align: "center" });
  doc.setTextColor(...green);
  doc.setFontSize(12);
  doc.text("PEMBAYARAN VALID", M + 16, 69.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Transaksi telah diterima dan diverifikasi oleh sistem.", M + 16, 75);
  doc.setTextColor(...ink);
  doc.setFont("helvetica", "bold");
  doc.text(paidAt, W - M - 5, 72, { align: "right" });

  // Customer and transaction metadata columns
  let y = 96;
  doc.setTextColor(...muted);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("DITERBITKAN UNTUK", M, y);
  doc.text("DETAIL TRANSAKSI", 114, y);
  doc.setTextColor(...ink);
  doc.setFontSize(11);
  doc.text(doc.splitTextToSize(inv.name, 78), M, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...muted);
  doc.text(inv.email, M, y + 14);
  if (inv.whatsapp) doc.text(inv.whatsapp, M, y + 19);

  const metaRows = [
    ["Provider", inv.provider?.toUpperCase() || "PAYMENT GATEWAY"],
    ["Referensi", inv.reference || "-"],
  ];
  metaRows.forEach(([label, value], index) => {
    const rowY = y + 7 + index * 8;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...muted);
    doc.text(label, 114, rowY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ink);
    doc.text(doc.splitTextToSize(value, 51), W - M, rowY, { align: "right" });
  });

  // Itemized transaction table
  y = 130;
  doc.setFillColor(...navy);
  doc.roundedRect(M, y, W - M * 2, 10, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("DESKRIPSI", M + 4, y + 6.5);
  doc.text("STATUS", 146, y + 6.5, { align: "center" });
  doc.text("NOMINAL", W - M - 4, y + 6.5, { align: "right" });

  doc.setDrawColor(...line);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(M, y + 12, W - M * 2, 29, 1.5, 1.5, "FD");
  doc.setTextColor(...ink);
  doc.setFontSize(9.5);
  doc.text(doc.splitTextToSize(inv.item, 93), M + 4, y + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...muted);
  doc.text(`Kategori: ${inv.kind}`, M + 4, y + 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...green);
  doc.text("VALID", 146, y + 25, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(...ink);
  doc.text(rupiah(inv.amount), W - M - 4, y + 25, { align: "right" });

  // Total paid panel
  y = 183;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(105, y, W - M - 105, 28, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...muted);
  doc.setFontSize(8);
  doc.text("TOTAL PEMBAYARAN VALID", 111, y + 8);
  doc.setTextColor(...navy);
  doc.setFontSize(17);
  doc.text(rupiah(inv.amount), W - M - 5, y + 19, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...muted);
  doc.setFontSize(8.5);
  doc.text("Keterangan", M, y + 7);
  doc.setTextColor(...ink);
  doc.setFont("helvetica", "bold");
  doc.text("Transaksi berhasil dan pembayaran telah tervalidasi.", M, y + 14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...muted);
  doc.text("Simpan dokumen ini sebagai bukti pembayaran resmi.", M, y + 20);

  // Document authenticity and footer
  y = 239;
  doc.setDrawColor(...line);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("DOKUMEN TRANSAKSI RESMI", M, y + 9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...muted);
  doc.setFontSize(8);
  doc.text("Invoice ini diterbitkan otomatis dan sah tanpa tanda tangan.", M, y + 15);
  doc.text("Keaslian transaksi mengacu pada nomor invoice dan referensi pembayaran di atas.", M, y + 20);
  doc.setFillColor(...gold);
  doc.rect(0, 277, W, 1.2, "F");
  doc.setFillColor(...navy);
  doc.rect(0, 278.2, W, 18.8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("PRESTASI KITA", M, 287.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(214, 220, 231);
  doc.text("prestasikita.id  |  @prestasikita", W - M, 287.5, { align: "right" });

  const safeName = inv.invoiceNo.replace(/[^a-zA-Z0-9_-]+/g, "-");
  doc.save(`${safeName}-VALID.pdf`);
}
