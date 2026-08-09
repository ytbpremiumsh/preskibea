import { GraduationCap, BookOpen, FileText, CheckCircle2 } from "lucide-react";

type Kind = "prestasi" | "ekonomi" | "umum" | "yatim";

const content: Record<Kind, { pelajar: string[]; mahasiswa: string[]; umum: string[] }> = {
  prestasi: {
    pelajar: [
      "Kartu Pelajar / Surat Keterangan Siswa Aktif",
      "Rapor / Transkrip nilai semester terakhir",
    ],
    mahasiswa: [
      "Kartu Tanda Mahasiswa (KTM) / Surat Keterangan Aktif Kuliah",
      "Transkrip Nilai atau Kartu Hasil Studi (KHS)",
    ],
    umum: [
      "Sertifikat / medali / surat rekomendasi prestasi",
      "Curriculum Vitae (CV) Kreatif",
      "Sertifikat Organisasi/Kepanitiaan (opsional)",
    ],
  },
  ekonomi: {
    pelajar: [
      "Kartu Pelajar / Surat Keterangan Siswa Aktif",
    ],
    mahasiswa: [
      "Kartu Tanda Mahasiswa (KTM) / Surat Keterangan Aktif Kuliah",
    ],
    umum: [
      "Surat Keterangan Tidak Mampu (SKTM) dari kelurahan",
      "Keterangan penghasilan orang tua / wali",
      "Bukti pembayaran listrik rumah terakhir",
      "Foto Rumah (Tampak Depan & Ruang Tamu)",
      "Bukti Pembayaran Listrik/PBB",
    ],
  },
  umum: {
    pelajar: [
      "Kartu Pelajar / Surat Keterangan Siswa Aktif",
      "Rapor semester terakhir",
    ],
    mahasiswa: [
      "Kartu Tanda Mahasiswa (KTM) / Surat Keterangan Aktif Kuliah",
      "Transkrip Nilai atau Kartu Hasil Studi (KHS)",
    ],
    umum: [
      "Curriculum Vitae (CV) / Portofolio Singkat",
      "Video Motivasi Diri (Link)",
      "Sertifikat / Berkas Pendukung Lainnya",
    ],
  },
  yatim: {
    pelajar: [
      "Kartu Pelajar / Surat Keterangan Siswa Aktif",
      "Rapor semester terakhir",
    ],
    mahasiswa: [
      "Kartu Tanda Mahasiswa (KTM) / Surat Keterangan Aktif Kuliah",
      "Transkrip Nilai atau Kartu Hasil Studi (KHS)",
    ],
    umum: [
      "Surat keterangan yatim / piatu / yatim piatu dari kelurahan",
      "Akta atau surat keterangan kematian orang tua",
      "Kartu Keluarga (KK)",
      "Esai dengan tema yang sudah ditentukan",
    ],
  },
};

export function KetentuanBerkasCard({ kind }: { kind: Kind }) {
  const c = content[kind];
  return (
    <div className="card-block p-6 md:p-7">
      <div className="flex items-center gap-2">
        <FileText size={18} className="text-primary" />
        <h2 className="text-base font-bold text-foreground">Ketentuan Berkas</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Persyaratan berkeda untuk Pelajar dan Mahasiswa. Siapkan berkas berikut sebelum mengisi tautan di bawah.
      </p>

      <div className="mt-5 grid sm:grid-cols-2 gap-4">
        <Block
          icon={<BookOpen size={16} />}
          title="Pelajar (SMP / SMA / Gap Year)"
          items={c.pelajar}
          tone="primary"
        />
        <Block
          icon={<GraduationCap size={16} />}
          title="Mahasiswa"
          items={c.mahasiswa}
          tone="accent"
        />
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-border bg-background p-4">
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Berlaku untuk semua</div>
        <ul className="mt-2 space-y-1.5">
          {c.umum.map((t) => (
            <li key={t} className="flex items-start gap-2 text-sm text-foreground/85">
              <CheckCircle2 size={14} className="mt-0.5 text-primary shrink-0" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Block({
  icon, title, items, tone,
}: { icon: React.ReactNode; title: string; items: string[]; tone: "primary" | "accent" }) {
  const cls = tone === "primary"
    ? "border-primary/30 bg-primary-soft/40"
    : "border-amber-500/30 bg-amber-500/5";
  const iconCls = tone === "primary" ? "bg-primary text-primary-foreground" : "bg-amber-500 text-white";
  return (
    <div className={`rounded-2xl border-2 ${cls} p-4`}>
      <div className="flex items-center gap-2">
        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${iconCls}`}>{icon}</span>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      <ul className="mt-3 space-y-1.5">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2 text-sm text-foreground/85">
            <CheckCircle2 size={14} className="mt-0.5 text-primary shrink-0" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
