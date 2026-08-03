import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ArrowRight, Share2, Sparkles, Trophy, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/donasi/terima-kasih")({
  head: () => ({
    meta: [
      { title: "Terima Kasih — Donasi Beasiswa Prestasi Emas" },
      {
        name: "description",
        content:
          "Terima kasih atas dukunganmu untuk program Beasiswa Prestasi Emas. Donasimu menjaga mimpi pelajar Indonesia tetap menyala.",
      },
      { property: "og:title", content: "Terima Kasih — Donasi Beasiswa Prestasi Emas" },
      {
        property: "og:description",
        content: "Bersama, kita menjaga mimpi pelajar Indonesia tetap menyala.",
      },
    ],
  }),
  component: ThanksPage,
});

type Donor = { name: string; amount: number; paid_at: string | null };

function ThanksPage() {
  const [message, setMessage] = useState(
    "Terima kasih atas dukunganmu! Setiap rupiah yang kamu titipkan menjadi bahan bakar untuk pelajar berprestasi di seluruh Indonesia.",
  );
  const [donors, setDonors] = useState<Donor[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "donation")
      .maybeSingle()
      .then(({ data }) => {
        const v = (data?.value ?? {}) as { thank_you_message?: string };
        if (v.thank_you_message) setMessage(v.thank_you_message);
      });

    supabase.functions
      .invoke("recent-donations", { method: "GET" })
      .then(({ data }) => {
        const d = (data ?? {}) as {
          ok?: boolean;
          items?: Donor[];
          total?: number;
          count?: number;
        };
        if (d.ok) {
          setDonors(d.items ?? []);
          setTotal(d.total ?? 0);
          setCount(d.count ?? 0);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const shareText =
    "Saya baru saja ikut mendukung program Beasiswa Prestasi Emas 💛. Yuk bantu juga supaya lebih banyak pelajar berprestasi bisa terus sekolah!";
  const shareUrl =
    typeof window !== "undefined" ? window.location.origin : "";
  const waShare = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;

  return (
    <main className="container-page py-12 md:py-20">
      {/* Hero */}
      <section className="relative max-w-2xl mx-auto text-center">
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft animate-in zoom-in duration-500">
          <Heart size={40} className="fill-current" />
        </div>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles size={12} /> Pahlawan Beasiswa
        </div>

        <h1 className="mt-4 text-3xl md:text-5xl font-extrabold text-foreground tracking-tight">
          Kamu luar biasa 💛
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
          {message}
        </p>

        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={waShare}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95 transition"
          >
            <Share2 size={16} /> Ajak Teman Ikut Berdonasi
          </a>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition"
          >
            Kembali ke Beranda <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Stats */}
      {!loading && count > 0 && (
        <section className="mt-12 grid grid-cols-2 gap-4 max-w-2xl mx-auto">
          <div className="card-flat p-5 text-center">
            <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Users size={18} />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-foreground">
              {count.toLocaleString("id-ID")}
            </div>
            <div className="text-xs text-muted-foreground">Donatur baik hati</div>
          </div>
          <div className="card-flat p-5 text-center">
            <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Trophy size={18} />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-foreground">
              Rp{total.toLocaleString("id-ID")}
            </div>
            <div className="text-xs text-muted-foreground">Total terkumpul</div>
          </div>
        </section>
      )}

      {/* Wall of Donors */}
      {!loading && donors.length > 0 && (
        <section className="mt-12 max-w-3xl mx-auto">
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground">
              Dinding Pahlawan Beasiswa
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Mereka sudah lebih dulu berdonasi. Terima kasih sudah ikut menjaga mimpi 🙏
            </p>
          </div>

          <ul className="mt-6 grid sm:grid-cols-2 gap-3">
            {donors.map((d, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 card-flat px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary text-sm font-bold">
                    {(d.name || "A").trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {d.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {formatRel(d.paid_at)}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-bold text-primary whitespace-nowrap">
                  Rp{d.amount.toLocaleString("id-ID")}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function formatRel(iso: string | null): string {
  if (!iso) return "Baru saja";
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
