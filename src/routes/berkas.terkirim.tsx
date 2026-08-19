import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { CheckCircle2, Home, Search, ShieldCheck, Clock, FileUp } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  kind: z.enum(["prestasi", "ekonomi", "umum", "yatim"]).optional(),
  count: z.number().optional(),
});

export const Route = createFileRoute("/berkas/terkirim")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Berkas Terkirim — Prestasi Kita" },
      { name: "description", content: "Berkas Anda berhasil dikirim dan sedang diverifikasi." },
    ],
  }),
  component: BerkasTerkirim,
});

const KIND_LABEL: Record<string, string> = {
  prestasi: "Beasiswa Prestasi",
  ekonomi: "Beasiswa Ekonomi",
  umum: "Beasiswa Umum",
  yatim: "Beasiswa Yatim",
};

const steps = [
  {
    icon: FileUp,
    title: "Berkas Terkirim",
    desc: "Dokumen Anda sudah masuk ke sistem panitia.",
    state: "done" as const,
  },
  {
    icon: Clock,
    title: "Verifikasi Berkas",
    desc: "Tim kami memeriksa kelengkapan dan keabsahan dokumen.",
    state: "active" as const,
  },
  {
    icon: ShieldCheck,
    title: "Pengumuman Kandidat",
    desc: "Hasil seleksi administrasi diumumkan sesuai timeline.",
    state: "upcoming" as const,
  },
];

function BerkasTerkirim() {
  const { kind } = useSearch({ from: "/berkas/terkirim" });
  const jenis = (kind && KIND_LABEL[kind]) || "Beasiswa";

  return (
    <section className="container-page py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <div className="card-block p-8 md:p-10 text-center">
          <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary-soft text-primary shadow-soft">
            <CheckCircle2 size={44} />
          </div>
          <span className="mt-5 inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            {jenis} — Batch #8
          </span>
          <h1 className="mt-4 text-3xl md:text-4xl font-extrabold text-foreground">
            Berkas Berhasil Dikirim!
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Terima kasih, berkas {jenis} Anda telah kami terima dan sedang dalam tahap
            verifikasi oleh tim panitia.
          </p>
        </div>

        <div className="mt-8 card-block p-6 md:p-8">
          <h2 className="text-lg font-bold text-foreground">Tahapan Status</h2>
          <ol className="mt-6 relative">
            <span className="absolute left-5 top-2 bottom-2 w-px bg-border" aria-hidden />
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.title} className="relative pl-16 pb-6 last:pb-0">
                  <span
                    className={`absolute left-0 top-0 inline-flex h-10 w-10 items-center justify-center rounded-full ${
                      s.state === "done"
                        ? "bg-primary text-primary-foreground"
                        : s.state === "active"
                        ? "bg-[oklch(0.92_0.13_85)] text-gold-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon size={18} />
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{s.title}</h3>
                    <span
                      className={`text-[11px] font-semibold rounded-full px-2.5 py-1 ${
                        s.state === "done"
                          ? "bg-primary-soft text-primary"
                          : s.state === "active"
                          ? "bg-[oklch(0.97_0.06_85)] text-gold-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {s.state === "done" ? "Selesai" : s.state === "active" ? "Berlangsung" : "Akan Datang"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/cek-status"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95 transition"
          >
            <Search size={16} /> Cek Status Pendaftaran
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition"
          >
            <Home size={16} /> Kembali ke Beranda
          </Link>
        </div>
      </div>
    </section>
  );
}
