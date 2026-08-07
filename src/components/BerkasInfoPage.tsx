import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, FileText, ShieldCheck, UploadCloud } from "lucide-react";
import { InfoBeasiswaInteraktif } from "@/components/InfoBeasiswaInteraktif";
import { AdSlot } from "@/components/ads/AdSlot";

const docsByKind = {
  prestasi: [
    "Kartu Pelajar / Kartu Mahasiswa",
    "Sertifikat Prestasi Akademik/Non-Akademik",
    "Sertifikat Organisasi/Kepanitiaan",
    "Esai Motivasi: 'Kontribusiku untuk Indonesia Melalui Prestasi'",
    "Curriculum Vitae (CV) Kreatif",
    "Video Motivasi (link/file) — opsional",
  ],
  ekonomi: [
    "Kartu Pelajar / Kartu Mahasiswa",
    "Surat Keterangan Penghasilan Orang Tua / Slip Gaji",
    "Surat Keterangan Tidak Mampu (SKTM)",
    "Foto Rumah (Tampak Depan & Ruang Tamu)",
    "Bukti Pembayaran Listrik/Pajak Bumi Bangunan",
    "Esai Motivasi: 'Pentingnya Pendidikan untuk Merubah Ekonomi Keluarga'",
  ],
  umum: [
    "Kartu Pelajar / Kartu Mahasiswa",
    "Rapor / Transkrip Nilai Terakhir (Minimal 1 Semester)",
    "Esai Motivasi: 'Peranku dalam Memajukan Pendidikan di Lingkungan Sekitar'",
    "Sertifikat Pendukung Lainnya — opsional",
    "Video Motivasi (link/file) — opsional",
  ],
  yatim: [
    "Kartu Pelajar / Kartu Mahasiswa",
    "Surat Keterangan Yatim / Piatu / Yatim Piatu",
    "Akta Kematian Orang Tua",
    "Kartu Keluarga (KK)",
    "Esai Motivasi: 'Harapanku untuk Masa Depan Melalui Pendidikan'",
    "Sertifikat Pendukung Lainnya — opsional",
  ],
} as const;

const tips = [
  "Format file: PDF, JPG",
  "Pastikan dokumen jelas terbaca dan tidak terpotong",
  "Gunakan Kode Token yang sama saat pendaftaran",
];

export function BerkasInfoPage({ kind }: { kind: "prestasi" | "ekonomi" | "umum" | "yatim" }) {
  const docs = docsByKind[kind];
  const uploadTo = kind === "prestasi" ? "/berkas/prestasi/upload" : kind === "ekonomi" ? "/berkas/ekonomi/upload" : kind === "yatim" ? "/berkas/yatim/upload" : "/berkas/umum/upload";

  return (
    <>
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="container-page py-16 md:py-20">
          <Link to="/" className="text-xs font-semibold text-primary hover:underline">
            ← Kembali ke Beranda
          </Link>
          <div className="mt-4 max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              <FileText size={14} /> Pengiriman Berkas {kind === "prestasi" ? "Prestasi" : kind === "ekonomi" ? "Ekonomi" : kind === "yatim" ? "Yatim" : "Umum"}
            </span>
            <h1 className="mt-4 text-4xl md:text-5xl font-extrabold leading-tight text-foreground">
              Persiapkan Berkas Pendukungmu
            </h1>
            <p className="mt-4 text-muted-foreground text-lg">
              Sebelum mengunggah, pastikan kamu sudah menyiapkan seluruh berkas berikut sesuai
              persyaratan. Setelah lengkap, lanjutkan ke halaman unggah berkas.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to={uploadTo}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95 transition"
              >
                <UploadCloud size={16} /> Lanjut ke Unggah Berkas <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <AdSlot placement="berkas_top" />

      <section className="container-page py-16 grid lg:grid-cols-2 gap-8">
        <div className="card-block p-8">
          <h2 className="text-2xl font-bold text-foreground">Daftar Berkas yang Perlu Disiapkan</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Berkas wajib harus diunggah agar dapat lanjut ke tahap verifikasi.
          </p>
          <ul className="mt-6 space-y-3">
            {docs.map((d) => (
              <li
                key={d}
                className="flex items-start gap-3 rounded-xl bg-secondary/50 p-3 text-sm text-foreground/90"
              >
                <CheckCircle2 size={18} className="mt-0.5 text-primary shrink-0" /> {d}
              </li>
            ))}
          </ul>
        </div>

        <div className="card-block p-8">
          <h2 className="text-2xl font-bold text-foreground">Catatan Pengiriman</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Beberapa hal yang perlu diperhatikan sebelum mengunggah.
          </p>
          <ul className="mt-6 space-y-3">
            {tips.map((t) => (
              <li
                key={t}
                className="flex items-start gap-3 rounded-xl border border-border bg-background p-3 text-sm text-foreground/90"
              >
                <ShieldCheck size={18} className="mt-0.5 text-primary shrink-0" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page pb-4">
        <div className="card-block p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground">
              Sudah lengkap semuanya?
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Lanjutkan ke halaman unggah berkas untuk menyelesaikan proses pengiriman.
            </p>
          </div>
          <Link
            to={uploadTo}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95 transition"
          >
            <UploadCloud size={16} /> Mulai Unggah Berkas <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="container-page pb-20">
        <InfoBeasiswaInteraktif />
      </section>
      <AdSlot placement="berkas_bottom" />
    </>
  );
}
