import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, FileText, PenLine, Share2, Trophy, Zap } from "lucide-react";

export type Stage = { title: string; desc: string; date: string; startDate?: string; singleDay?: boolean };

const fallback: Stage[] = [
  { title: "Pendaftaran Dibuka", desc: "Calon peserta mengisi formulir pendaftaran beasiswa secara online.", date: "2027-02-07", startDate: "2026-08-12" },
  { title: "Bagikan Poster", desc: "Peserta membagikan poster beasiswa ke media sosial sebagai bagian dari tahapan seleksi.", date: "2027-02-07", startDate: "2026-08-12" },
  { title: "Pengiriman Essai", desc: "Lengkapi pertanyaan esai yang tersedia sebagai syarat untuk melanjutkan ke tahap berkas administrasi", date: "2027-02-07", startDate: "2026-08-12" },
  { title: "Berkas Administrasi", desc: "Peserta mengunggah seluruh berkas pendukung sesuai persyaratan yang ditentukan.", date: "2027-02-07", startDate: "2026-08-12" },
  { title: "Seleksi Administrasi", desc: "Tim panitia memeriksa kelengkapan data dan keabsahan berkas pendaftar.", date: "2027-02-12", startDate: "2027-02-08" },
  { title: "Verifikasi", desc: "Validasi akhir terhadap dokumen dan data peserta yang lolos administrasi.", date: "2027-02-26", startDate: "2027-02-13" },
  { title: "Pengumuman Kandidat", desc: "Pengumuman peserta yang lolos sebagai kandidat dan berhak mengikuti TPA.", date: "2027-02-27", startDate: "2027-02-27", singleDay: true },
  { title: "Tes Potensi Akademik (TPA)", desc: "Peserta mengikuti tes online serentak untuk mengukur kemampuan akademik.", date: "2027-03-04", startDate: "2027-03-04", singleDay: true },
  { title: "Pengumuman Finalis", desc: "Pengumuman peserta yang lolos sebagai finalis penerima beasiswa.", date: "2027-03-11", startDate: "2027-03-11", singleDay: true },
  { title: "Awarding", desc: "Penyerahan beasiswa dan merchandise resmi kepada para penerima.", date: "2027-03-25", startDate: "2027-03-25", singleDay: true },
];

function fmt(d: string) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function statusOf(stages: Stage[], i: number) {
  const now = new Date().getTime();
  const cur = stages[i];
  if (!cur) return "Akan Datang";

  const curStart = cur.startDate ? new Date(cur.startDate).getTime() : NaN;
  const curEnd = cur.date ? new Date(cur.date).getTime() : NaN;

  // Fallback: kalau startDate tidak ada, pakai date sebagai tanggal mulai (behavior lama)
  const start = isNaN(curStart) ? curEnd : curStart;
  // Akhir hari dari tanggal selesai (inklusif) — selama belum lewat, masih Berlangsung
  const end = isNaN(curEnd) ? start : curEnd + 24 * 60 * 60 * 1000 - 1;

  if (isNaN(start)) return "Akan Datang";
  if (now < start) return "Akan Datang";
  if (now <= end) return "Berlangsung";
  return "Selesai";
}

export function TimelineSection() {
  const [stages, setStages] = useState<Stage[]>(fallback);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "timeline")
      .maybeSingle()
      .then(({ data }) => {
        if (Array.isArray(data?.value)) setStages(data.value as Stage[]);
      });
  }, []);

  return (
    <section id="timeline" className="bg-secondary/40 border-y border-border">
      <div className="container-page py-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            Timeline Gelombang Batch #8
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-extrabold text-foreground">
            Tahapan Seleksi Beasiswa
          </h2>
          <p className="mt-3 text-muted-foreground">
            Ikuti setiap tahap dengan teliti agar dapat lolos hingga awarding.
          </p>
        </div>

        <ol className="mt-12 relative max-w-3xl mx-auto">
          <span className="hidden md:block absolute left-5 top-0 bottom-0 w-px bg-border" aria-hidden />
          {stages.map((t, i) => {
            const status = statusOf(stages, i);
            return (
              <li key={i} className="relative pl-0 md:pl-16 pb-8 last:pb-0">
                <span className="hidden md:flex absolute left-0 top-0 h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-soft">
                  {i + 1}
                </span>
                <div className="card-block p-5 w-full">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <span className="md:hidden inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {i + 1}
                      </span>
                      {t.title}
                    </h3>
                    <span
                      className={`text-[11px] font-semibold rounded-full px-2.5 py-1 whitespace-nowrap ${
                        status === "Berlangsung"
                          ? "bg-[oklch(0.92_0.13_85)] text-gold-foreground"
                          : status === "Selesai"
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary-soft text-primary"
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{t.desc}</p>
                  {(t.title.toLowerCase().includes("esai") || t.title.toLowerCase().includes("essai")) && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-[oklch(0.92_0.13_85)] bg-[oklch(0.97_0.06_85)] px-3 py-2 text-xs font-medium text-gold-foreground">
                      <Zap size={14} className="mt-0.5 shrink-0" />
                      <span>
                        <strong>Fast Track otomatis lolos</strong> tahapan esai — kamu bisa langsung lanjut kirim Berkas Administrasi.
                      </span>
                    </div>
                  )}
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-foreground/80 flex-wrap">
                    <Calendar size={14} className="text-primary shrink-0" />
                    {t.startDate && t.startDate !== t.date ? (
                      <>
                        {(t.title.toLowerCase().includes("pendaftaran") || 
                          t.title.toLowerCase().includes("poster") || 
                          t.title.toLowerCase().includes("esai") || 
                          t.title.toLowerCase().includes("essai") || 
                          t.title.toLowerCase().includes("berkas")) 

                          ? `Hingga ${fmt(t.date)}` 
                          : `${fmt(t.startDate)} – ${t.singleDay ? fmt(t.date) : `Hingga ${fmt(t.date)}`}`}
                      </>
                    ) : t.date ? (
                      t.singleDay ? fmt(t.date) : `Hingga ${fmt(t.date)}`
                    ) : (
                      "—"
                    )}
                  </div>
                  <StageActions title={t.title} />
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function StageActions({ title }: { title: string }) {
  const t = title.toLowerCase();

  if (t.includes("pendaftaran")) {
    return (
      <div className="mt-4">
        <Link
          to="/daftar"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-soft hover:opacity-95 transition"
        >
          <Trophy size={14} /> Daftar Sekarang <ArrowRight size={12} />
        </Link>
      </div>
    );
  }

  if (t.includes("poster") || t.includes("bagikan")) {
    return (
      <div className="mt-4">
        <Link
          to="/bagikan-poster"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-soft hover:opacity-95 transition"
        >
          <Share2 size={14} /> Bagikan Poster <ArrowRight size={12} />
        </Link>
      </div>
    );
  }

  if (t.includes("esai") || t.includes("essai")) {
    return (
      <div className="mt-4">
        <Link
          to="/esai"
          search={{ token: "" }}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-soft hover:opacity-95 transition"
        >
          <PenLine size={14} /> Kirim Esai <ArrowRight size={12} />
        </Link>
      </div>
    );
  }

  if (t.includes("berkas") || t.includes("pengumpulan")) {
    return (
      <div className="mt-4">
        <Link
          to="/berkas/prestasi/upload"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-soft hover:opacity-95 transition"
        >
          <FileText size={14} /> Kirim Berkas <ArrowRight size={12} />
        </Link>
      </div>
    );
  }

  return null;
}
