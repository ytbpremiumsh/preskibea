import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import { RawHtmlWidget } from "@/components/ads/RawHtmlWidget";
import { useBranding } from "@/hooks/use-branding";

export const Route = createFileRoute("/artikel/")({
  head: () => ({
    meta: [
      { title: "Artikel — Prestasi Kita" },
      { name: "description", content: "Kumpulan artikel seputar beasiswa, tips persiapan, dan kisah inspiratif pendidikan." },
      { property: "og:title", content: "Artikel — Prestasi Kita" },
      { property: "og:description", content: "Kumpulan artikel seputar beasiswa Prestasi Kita." },
    ],
  }),
  component: ArtikelPage,
});

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  cover_url: string | null;
  published_at: string;
  author: string | null;
};

function ArtikelPage() {
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<string>("Semua");
  const { articleWidgets } = useBranding();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("articles")
        .select("id,title,slug,excerpt,category,cover_url,published_at,author")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      setItems((data ?? []) as Article[]);
      setLoading(false);
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>(items.map((a) => a.category));
    return ["Semua", ...Array.from(set)];
  }, [items]);

  const filtered = cat === "Semua" ? items : items.filter((a) => a.category === cat);

  return (
    <main className="container-page py-16">
      <header className="max-w-2xl">
        <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">Artikel</span>
        <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-foreground">Artikel & Kabar Beasiswa</h1>
        <p className="mt-3 text-muted-foreground">Informasi terbaru, tips, dan inspirasi seputar beasiswa Prestasi Kita.</p>
      </header>

      {!loading && items.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${
                cat === c ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <AdSlot placement="article_list_top" />
      
      {articleWidgets.top && (
        <div className="mt-8 overflow-visible">
          <RawHtmlWidget id="article-widget-top" html={articleWidgets.top} />
        </div>
      )}

      {loading ? (
        <div className="mt-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">Belum ada artikel.</p>
      ) : (
        <section className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((a) => (
            <Link
              key={a.id}
              to="/artikel/$slug"
              params={{ slug: a.slug }}
              className="card-block group overflow-hidden transition"
            >
              {a.cover_url && (
                <div className="aspect-[16/9] overflow-hidden bg-muted">
                  <img src={a.cover_url} alt={a.title} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">{a.category}</span>
                  <span className="text-muted-foreground">{new Date(a.published_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
                <h2 className="mt-2 text-lg font-semibold text-foreground group-hover:text-primary transition">{a.title}</h2>
                {a.excerpt && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{a.excerpt}</p>}
              </div>
            </Link>
          ))}
        </section>
      )}
      <AdSlot placement="article_list_bottom" />

      {articleWidgets.bottom && (
        <div className="mt-8 overflow-visible">
          <RawHtmlWidget id="article-widget-bottom" html={articleWidgets.bottom} />
        </div>
      )}
    </main>
  );
}
