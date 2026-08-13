import { Link } from "@tanstack/react-router";
import { Download, Share2, Facebook, Instagram, ListChecks, MessageCircle, Info, CheckCircle2, Copy, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useBranding } from "@/hooks/use-branding";
import { RawHtmlWidget } from "@/components/ads/RawHtmlWidget";
import defaultPoster from "@/assets/poster-beasiswa.png";
import { AdSlot } from "@/components/ads/AdSlot";
import { supabase } from "@/integrations/supabase/client";

type PosterCfg = {
  image_url: string;
  download_url: string;
  caption: string;
  wa_number: string;
  wa_message: string;
};

export function SharePosterPage({ kind: initialKind }: { kind?: "prestasi" | "ekonomi" | "umum" | "yatim" }) {
  const kind = initialKind || "prestasi";
  const { posterWidgets } = useBranding();
  const isGold = kind === "ekonomi";
  const label = kind === "ekonomi" ? "Beasiswa Ekonomi" : kind === "umum" ? "Beasiswa Umum" : kind === "yatim" ? "Beasiswa Yatim" : "Beasiswa Prestasi";
  const path = kind === "ekonomi" ? "/beasiswa-ekonomi" : kind === "umum" ? "/beasiswa-umum" : kind === "yatim" ? "/beasiswa-yatim" : "/beasiswa-prestasi";
  const url = typeof window !== "undefined" ? window.location.origin + path : "https://prestasikita.com";

  const defaultCaption = `🎓✨ BEASISWA PENDIDIKAN PRESTASI KITA — BATCH #8 ✨🎓

Halo Sobat Pejuang Pendidikan! 👋
Saatnya wujudkan mimpi pendidikanmu bersama ${label}!

💰 Total Beasiswa hingga Rp17.000.000/semester
📚 Terbuka untuk SMP, SMA/SMK/MA & Mahasiswa
🚫 100% TIDAK DIPUNGUT BIAYA

✅ Persyaratan:
• Warga Negara Indonesia (WNI) & berdomisili di Indonesia
• Pelajar/Mahasiswa aktif (atau calon mahasiswa D3–S2)
• Tanpa minimal nilai rapor / IPK
• Mengikuti seluruh ketentuan yang berlaku

🎁 Benefit Penerima:
• Sertifikat resmi Beasiswa Prestasi Kita
• Merchandise eksklusif (Plakat, Kaos, Block Note, Goodie Bag, dll)
• Video motivasi & sesi pembinaan penerima

📌 Daftar sekarang di: ${url}
📷 Info lengkap: @prestasikita
📞 0812 8001 0302

⚠️ Hati-hati terhadap penipuan yang mengatasnamakan Prestasi Kita.

#PrestasiKita #BeasiswaPendidikan #BeasiswaIndonesia #BeasiswaPelajar #BeasiswaMahasiswa #PrestasiKitaBatch8`;

  const [cfg, setCfg] = useState<PosterCfg>({
    image_url: defaultPoster,
    download_url: "",
    caption: defaultCaption,
    wa_number: "6281280010302",
    wa_message: "Halo, saya ingin mengirim bukti bagikan poster Beasiswa Prestasi Kita.",
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "share_poster")
        .maybeSingle();
      const v = data?.value as {
        prestasi?: Partial<PosterCfg>;
        ekonomi?: Partial<PosterCfg>;
        umum?: Partial<PosterCfg>;
        yatim?: Partial<PosterCfg>;
        is_unified?: boolean;
        unified?: Partial<PosterCfg>;
      } | undefined;

      const k = v?.is_unified ? v?.unified : v?.[initialKind || "prestasi"];
      if (k) {
        setCfg((prev) => ({
          image_url: k.image_url || prev.image_url,
          download_url: k.download_url || k.image_url || prev.download_url,
          caption: k.caption || prev.caption,
          wa_number: k.wa_number || prev.wa_number,
          wa_message: k.wa_message || prev.wa_message,
        }));
      }
    })();
  }, [initialKind]);

  const caption = cfg.caption;


  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  const [shares, setShares] = useState({ wa: 0, ig: 0, fb: 0, x: 0 });
  const track = (k: keyof typeof shares) => setShares((s) => ({ ...s, [k]: s[k] + 1 }));

  const links = [
    { key: "wa" as const, label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(caption)}`, icon: <Share2 size={16} />, color: "bg-[oklch(0.72_0.17_150)]" },
    { key: "fb" as const, label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, icon: <Facebook size={16} />, color: "bg-[oklch(0.50_0.18_260)]" },
    { key: "x" as const, label: "X (Twitter)", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`, icon: <Share2 size={16} />, color: "bg-foreground" },
    { key: "ig" as const, label: "Instagram", href: `https://www.instagram.com/`, icon: <Instagram size={16} />, color: "bg-gradient-to-tr from-[oklch(0.65_0.20_30)] to-[oklch(0.55_0.23_310)]" },
  ];

  return (
    <section className="container-page py-16">
      <Link to="/" className="text-xs font-semibold text-primary hover:underline">← Kembali ke Beranda</Link>

      {/* Widget Atas Poster */}
      {posterWidgets.top && (
        <div className="mt-6 overflow-visible">
          <RawHtmlWidget id="poster-widget-top" html={posterWidgets.top} />
        </div>
      )}

      <div className="mt-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">Bagikan Poster Beasiswa</h1>
        <p className="mt-2 text-muted-foreground">Bantu sebarkan informasi beasiswa ini kepada teman dan keluarga.</p>
      </div>

      {/* KETENTUAN BAGIKAN POSTER — di atas */}
      <div className="card-block mt-8 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ListChecks size={18} />
          </span>
          <h2 className="text-lg md:text-xl font-bold text-foreground">Ketentuan Bagikan Poster Beasiswa</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Lengkapi seluruh tahapan berikut agar pendaftaranmu dapat diproses ke tahap selanjutnya.
        </p>

        <ol className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { t: "Follow Instagram @prestasikita dan @atskolla", d: "Pastikan kamu sudah mengikuti akun Instagram resmi @prestasikita dan @atskolla sebelum lanjut ke tahap berikutnya." },
            { t: "Sebar ke 5 grup WA atau 1 Instagram Feed", d: "Pilih salah satu: bagikan poster + caption ke minimal 5 grup WhatsApp, atau posting poster + caption ke 1 Instagram Feed kamu." },
            { t: "Komentar & tag 3 teman", d: "Komentari unggahan resmi @prestasikita dan mention 3 sahabatmu. Contoh: \"Yuk ikut daftar beasiswa ini 🥳✨ @temanA @temanB @temanC\"." },
            { t: "Konfirmasi bukti via WhatsApp", d: "Kirim screenshot (Story, postingan, dan grup) melalui tombol konfirmasi di bawah agar tim verifikasi mencatat partisipasimu." },
          ].map((item, i) => (
            <li key={item.t} className="flex flex-col sm:flex-row gap-4 rounded-2xl border border-border bg-background p-4 h-full">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary font-bold">
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                  <h3 className="text-sm font-semibold text-foreground leading-tight break-words">{item.t}</h3>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">{item.d}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href={`https://wa.me/${cfg.wa_number.replace(/\D/g, "")}?text=${encodeURIComponent(cfg.wa_message)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95 transition"
          >
            <MessageCircle size={16} /> Konfirmasi Poster via WhatsApp
          </a>
          <span className="text-xs text-muted-foreground">Pastikan bukti yang dikirim jelas dan terbaca.</span>
        </div>

        <div className="mt-6 flex items-start gap-2 rounded-2xl bg-[oklch(0.92_0.14_85)]/30 border border-[oklch(0.85_0.16_85)]/50 p-4 text-sm text-foreground/85">
          <Info size={16} className="mt-0.5 text-[oklch(0.55_0.16_75)] shrink-0" />
          <p>
            <span className="font-semibold">Catatan:</span> Wajib menggunakan poster dan caption resmi yang telah disediakan di bawah. Materi di luar yang disediakan tidak dihitung sebagai partisipasi sah.
          </p>
        </div>
      </div>

      <AdSlot placement="share_top" />

      {/* POSTER + CAPTION — di bawah */}
      <div className="mt-10 grid lg:grid-cols-[1fr_1.1fr] gap-8 items-start">
        {/* Poster */}
        <div className="card-block p-4">
          <div className="rounded-2xl overflow-hidden bg-muted">
            <img
              src={cfg.image_url}
              alt={`Poster Beasiswa Prestasi Kita ${label}`}
              className="w-full h-auto block"
              loading="lazy"
            />
          </div>
          <div className="mt-5 flex justify-center">
            <a
              href={cfg.download_url || cfg.image_url}
              download={`poster-prestasi-kita.png`}
              target="_blank"
              rel="noreferrer"
              className="group relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary/80 px-7 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/40 active:scale-95 overflow-hidden"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <Download size={18} className="relative animate-bounce-soft transition-transform group-hover:-translate-y-0.5" />
              <span className="relative">Download Poster</span>
            </a>
          </div>
        </div>


        {/* Caption + share buttons */}
        <div className="space-y-6">
          <div className="card-block p-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-sm font-semibold text-foreground">Caption Resmi</div>
                <p className="text-xs text-muted-foreground">Salin dan tempel caption ini saat membagikan poster.</p>
              </div>
              <button
                onClick={handleCopy}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                  copied
                    ? "bg-[oklch(0.72_0.17_150)] text-white"
                    : "bg-primary text-primary-foreground hover:opacity-95"
                }`}
              >
                {copied ? (<><Check size={14} /> Tersalin</>) : (<><Copy size={14} /> Salin Caption</>)}
              </button>
            </div>
            <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-background border border-border p-4 text-xs leading-relaxed font-sans text-foreground/90">
{caption}
            </pre>
          </div>

          <div className="card-block p-6">
            <div className="text-sm font-semibold text-foreground">Bagikan ke Media Sosial</div>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              {links.map((l) => (
                <a
                  key={l.key}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => track(l.key)}
                  className="group flex items-center justify-between rounded-2xl border border-border bg-background p-3 hover:border-primary transition"
                >
                  <span className="flex items-center gap-3">
                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-white ${l.color}`}>{l.icon}</span>
                    <span className="text-sm font-medium text-foreground">{l.label}</span>
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">{shares[l.key]}x</span>
                </a>
              ))}
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              Total share sesi ini: <span className="font-semibold text-foreground">{Object.values(shares).reduce((a, b) => a + b, 0)}</span>
            </div>
          </div>
        </div>
      </div>
      <AdSlot placement="share_bottom" />

      {/* Widget Bawah Poster */}
      {posterWidgets.bottom && (
        <div className="mt-10 overflow-visible">
          <RawHtmlWidget id="poster-widget-bottom" html={posterWidgets.bottom} />
        </div>
      )}
    </section>
  );
}
