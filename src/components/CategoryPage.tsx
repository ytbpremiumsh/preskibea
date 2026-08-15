import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, FileText, PlayCircle, Share2, Trophy, HeartHandshake, Users, Heart, AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { AdSlot } from "@/components/ads/AdSlot";
import { RawHtmlWidget } from "@/components/ads/RawHtmlWidget";
import benefitAsset from "@/assets/benefit-prestasi-kita.webp";

const persyaratan = [
  "Warga Negara Indonesia (WNI)",
  "Tinggal di Indonesia",
  "Pelajar aktif SMP/MTs sederajat",
  "Pelajar aktif SMA/SMK/MA sederajat",
  "Mahasiswa aktif atau calon mahasiswa D3–S2",
  "Tanpa minimal nilai rapor atau IPK",
  "Mengikuti seluruh persyaratan yang ditetapkan",
];



const FALLBACK_BENEFIT_IMAGE = "/benefit-lokal.png";
const BENEFIT_IMAGE_URL = "/benefit-lokal.png";

const benefitList = [
  { strong: "Dana Pendidikan Beasiswa", rest: "" },
  { strong: "Merchandise menarik", rest: " dari Prestasi Kita." },
  { strong: "Sertifikat Beasiswa", rest: " by Prestasi Kita." },
  {
    prefix: "Peluang Menjadi ",
    strong: "Kontingen Ambassador",
    rest: " Program Prestasi Kita.",
  },
  {
    prefix: "Dapatkan ",
    strong: "Akses Magang",
    rest: " di Prestasi Kita Indonesia dan Partner.",
  },
];

import { useBranding } from "@/hooks/use-branding";

export function CategoryPage({
  kind,
  title,
  tagline,
  desc,
  shareTo,
}: {
  kind: "prestasi" | "ekonomi" | "umum" | "yatim";
  title: string;
  tagline: string;
  desc: string;
  shareTo: "/bagikan-poster";
}) {
  const { benefitImage, globalWidgets, categoryWidgets } = useBranding();
  const isGold = kind === "ekonomi";
  const Icon: ReactNode = isGold ? <HeartHandshake /> : kind === "umum" ? <Users /> : kind === "yatim" ? <Heart /> : <Trophy />;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="container-page py-16 md:py-20">
          <Link to="/" className="text-xs font-semibold text-primary hover:underline">← Kembali ke Beranda</Link>
          <div className="mt-4 max-w-3xl">
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${isGold ? "bg-[oklch(0.92_0.14_85)] text-gold-foreground" : "bg-primary-soft text-primary"}`}>
              {Icon} {tagline}
            </span>
            <h1 className="mt-4 text-4xl md:text-5xl font-extrabold leading-tight text-foreground">{title}</h1>
            <p className="mt-4 text-muted-foreground text-lg">{desc}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to={shareTo} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition">
                <Share2 size={16} /> Bagikan Poster
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Widget Atas khusus halaman kategori */}
      {categoryWidgets.top && (
        <div className="container-page py-4 overflow-visible">
          <RawHtmlWidget id="category-widget-top" html={categoryWidgets.top} />
        </div>
      )}

      {/* INFO */}
      <section className="container-page py-16 grid lg:grid-cols-2 gap-8 items-start">
        {/* Persyaratan */}
        <div className="card-block p-8 flex flex-col">
          <h2 className="text-2xl font-bold text-foreground">Persyaratan</h2>
          <p className="mt-1 text-sm text-muted-foreground">Pastikan kamu memenuhi seluruh persyaratan berikut.</p>
          <ul className="mt-6 space-y-3">
            {persyaratan.map((p) => (
              <li key={p} className="flex items-start gap-3 rounded-xl bg-secondary/50 p-3 text-sm text-foreground/90">
                <CheckCircle2 size={18} className="mt-0.5 text-primary shrink-0" /> {p}
              </li>
            ))}
          </ul>

          {/* Info tambahan agar kolom tidak kosong */}
          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-secondary/40 p-5">
              <div className="flex items-center gap-2 text-primary">
                <Trophy size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Gratis</span>
              </div>
              <h3 className="mt-2 font-semibold text-foreground">Tanpa Biaya Pendaftaran</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Seluruh proses pendaftaran beasiswa 100% gratis tanpa pungutan apapun.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/40 p-5">
              <div className="flex items-center gap-2 text-primary">
                <HeartHandshake size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Terbuka</span>
              </div>
              <h3 className="mt-2 font-semibold text-foreground">Seluruh Indonesia</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Pelajar & mahasiswa dari Sabang sampai Merauke berhak mendaftar.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl p-5 text-primary-foreground shadow-soft" style={{ background: "var(--gradient-primary)" }}>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
              <CheckCircle2 size={16} /> Tips Persiapan
            </div>
            <p className="mt-2 text-sm leading-relaxed opacity-95">
              Siapkan dokumen pendukung seperti {kind === 'ekonomi' ? 'SKTM, Bukti Penghasilan,' : kind === 'prestasi' ? 'Sertifikat Prestasi, CV,' : 'Rapor/Transkrip,'} Kartu Pelajar / Kartu Mahasiswa, dan
              Esai sesuai tema sebelum mengisi formulir agar prosesnya lebih cepat.
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-primary/30 bg-primary-soft/50 p-5">
            <p className="text-sm text-foreground/90">
              Punya pertanyaan seputar persyaratan?{" "}
              <Link to={shareTo} className="font-semibold text-primary hover:underline">
                Bagikan poster
              </Link>{" "}
              ke teman atau hubungi admin via WhatsApp.
            </p>
          </div>
        </div>

        {/* Benefit */}
        <div className="card-block p-8">
          <h2 className="text-2xl font-bold text-foreground">Benefit Beasiswa</h2>
          <p className="mt-1 text-sm text-muted-foreground">Total beasiswa Rp17.000.000/semester serta benefit pendukung.</p>

          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-secondary/30 relative">
            <img
              src="/benefit-lokal.png"
              alt="Benefit Beasiswa Prestasi Kita"
              loading="lazy"
              decoding="async"
              width={1200}
              height={800}
              className="w-full h-auto object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                if (benefitImage && target.src !== benefitImage) {
                  target.src = benefitImage;
                }
              }}
            />
          </div>

          <div className="mt-6 rounded-2xl p-5 text-primary-foreground shadow-soft" style={{ background: "var(--gradient-primary)" }}>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
              <PlayCircle size={16} /> Benefit Unggulan
            </div>
            <p className="mt-2 font-semibold text-lg leading-snug">
              Dukungan Finansial & Pengembangan Diri untuk Masa Depan
            </p>
          </div>

          <ul className="mt-6 space-y-2.5">
            {benefitList.map((b, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 rounded-xl bg-secondary/40 px-3.5 py-2.5 text-sm text-foreground/90"
              >
                <span
                  className={`mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${isGold ? "bg-[oklch(0.78_0.18_80)]" : "bg-primary"}`}
                />
                <span>
                  {b.prefix}
                  <strong className="font-semibold text-foreground">{b.strong}</strong>
                  {b.rest}
                </span>
              </li>
            ))}
          </ul>

        </div>
      </section>

      <AdSlot placement="category_middle" />
      
      {/* Widget 2 khusus halaman kategori */}
      <div className="container-page py-4 overflow-visible">
        <RawHtmlWidget id="category-widget-middle" html={categoryWidgets.bottom || ""} />
      </div>

      {/* Widget Di atas Tombol khusus halaman kategori */}
      {categoryWidgets.above_button && (
        <div className="container-page py-4 overflow-visible">
          <RawHtmlWidget id="category-widget-above-button" html={categoryWidgets.above_button} />
        </div>
      )}

      {/* CTA — Pendaftaran (terpisah dari berkas) */}
      <section className="container-page pb-10">
        <div className="card-block p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground">Sudah memenuhi persyaratan?</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">Lengkapi formulir pendaftaran beasiswa.</p>
          </div>
          <Link 
            to="/pendaftaran/pilih-tipe" 
            search={{ kind }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95 transition"
          >
            Daftar Sekarang <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* CTA — Pengiriman Berkas (terpisah dari pendaftaran) */}
      <section className="container-page pb-20">
        <div className="rounded-3xl border border-border bg-secondary/40 p-8 md:p-10 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground">Sudah daftar? Kirim berkas pendukung</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Unggah berkas khusus jalur {kind === "prestasi" ? "Prestasi" : kind === "ekonomi" ? "Ekonomi" : "Umum"}.
            </p>
          </div>
          <Link
            to={kind === "prestasi" ? "/berkas/prestasi/upload" : kind === "ekonomi" ? "/berkas/ekonomi/upload" : kind === "yatim" ? "/berkas/yatim/upload" : "/berkas/umum/upload"}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition"
          >
            <FileText size={16} /> Kirim Berkas
          </Link>
        </div>
      </section>

      <AdSlot placement="category_bottom" />

      {/* Widget Bawah khusus halaman kategori */}
      {categoryWidgets.bottom && (
        <div className="container-page pb-10 overflow-visible">
          <RawHtmlWidget id="category-widget-bottom" html={categoryWidgets.bottom} />
        </div>
      )}
    </>
  );
}
