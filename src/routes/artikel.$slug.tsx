import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, CalendarDays, User, Tag } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string;
  cover_url: string | null;
  published_at: string;
  author: string | null;
};

export const Route = createFileRoute("/artikel/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("articles")
      .select("id,title,slug,excerpt,content,category,cover_url,published_at,author")
      .eq("slug", params.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return { article: data as Article };
  },
  head: ({ loaderData, params }) => {
    const a = loaderData?.article;
    if (!a) {
      return { meta: [{ title: "Artikel — Prestasi Kita" }] };
    }
    const url = `https://prestasi-emas.lovable.app/artikel/${params.slug}`;
    const desc = (a.excerpt ?? "").slice(0, 160);
    const meta = [
      { title: `${a.title} — Prestasi Kita` },
      { name: "description", content: desc },
      { name: "author", content: a.author ?? "Tim Prestasi Kita" },
      { name: "keywords", content: `${a.category}, beasiswa, ${a.title}, prestasi kita` },
      { property: "og:type", content: "article" },
      { property: "og:title", content: a.title },
      { property: "og:description", content: desc },
      { property: "og:url", content: url },
      { property: "article:published_time", content: a.published_at },
      { property: "article:section", content: a.category },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: a.title },
      { name: "twitter:description", content: desc },
    ];
    if (a.cover_url) {
      meta.push({ property: "og:image", content: a.cover_url });
      meta.push({ name: "twitter:image", content: a.cover_url });
    }
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: a.title,
      description: desc,
      image: a.cover_url ? [a.cover_url] : undefined,
      datePublished: a.published_at,
      dateModified: a.published_at,
      author: { "@type": "Person", name: a.author ?? "Tim Prestasi Kita" },
      publisher: {
        "@type": "Organization",
        name: "Prestasi Kita",
        logo: { "@type": "ImageObject", url: "https://prestasi-emas.lovable.app/favicon.ico" },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      articleSection: a.category,
    };
    return {
      meta,
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(jsonLd) },
      ],
    };
  },
  component: ArticleDetail,
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="text-2xl font-bold">Artikel tidak ditemukan</h1>
      <p className="mt-2 text-muted-foreground">Mungkin artikel telah dihapus atau dipindahkan.</p>
      <Link to="/artikel" className="mt-6 inline-block text-primary underline">Kembali ke daftar artikel</Link>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold">Terjadi kesalahan</h1>
        <p className="mt-2 text-muted-foreground text-sm">{error.message}</p>
        <button
          className="mt-6 text-primary underline"
          onClick={() => { router.invalidate(); reset(); }}
        >
          Coba lagi
        </button>
      </div>
    );
  },
});

function renderMarkdown(md: string) {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s: string) =>
    escape(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inList: "ul" | "ol" | null = null;
  let inQuote = false;
  const closeList = () => { if (inList) { out.push(`</${inList}>`); inList = null; } };
  const closeQuote = () => { if (inQuote) { out.push("</blockquote>"); inQuote = false; } };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^### /.test(line)) { closeList(); closeQuote(); out.push(`<h3>${inline(line.slice(4))}</h3>`); continue; }
    if (/^## /.test(line))  { closeList(); closeQuote(); out.push(`<h2>${inline(line.slice(3))}</h2>`); continue; }
    if (/^# /.test(line))   { closeList(); closeQuote(); out.push(`<h1>${inline(line.slice(2))}</h1>`); continue; }
    if (/^>\s?/.test(line)) {
      closeList();
      if (!inQuote) { out.push("<blockquote>"); inQuote = true; }
      out.push(`<p>${inline(line.replace(/^>\s?/, ""))}</p>`);
      continue;
    }
    if (/^[-*] /.test(line)) {
      closeQuote();
      if (inList !== "ul") { closeList(); out.push("<ul>"); inList = "ul"; }
      out.push(`<li>${inline(line.slice(2))}</li>`);
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      closeQuote();
      if (inList !== "ol") { closeList(); out.push("<ol>"); inList = "ol"; }
      out.push(`<li>${inline(line.replace(/^\d+\.\s/, ""))}</li>`);
      continue;
    }
    if (line.trim() === "") { closeList(); closeQuote(); continue; }
    closeList();
    closeQuote();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  closeQuote();
  return out.join("\n");
}

function ArticleDetail() {
  const { article } = Route.useLoaderData();
  const html = renderMarkdown(article.content);
  // Sisipkan AdSlot tengah setelah ~50% konten (dipisah berdasarkan </h2>)
  const parts = html.split("</h2>");
  let topHtml = html;
  let bottomHtml = "";
  if (parts.length > 3) {
    const mid = Math.floor(parts.length / 2);
    topHtml = parts.slice(0, mid).join("</h2>") + "</h2>";
    bottomHtml = parts.slice(mid).join("</h2>");
  }

  return (
    <main className="container-page py-12">
      <Link to="/artikel" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Artikel
      </Link>
      <article className="mt-6 max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 font-medium">
            <Tag className="h-3 w-3" /> {article.category}
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            {new Date(article.published_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </span>
          {article.author && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <User className="h-3 w-3" /> {article.author}
            </span>
          )}
        </div>
        <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-foreground leading-tight">{article.title}</h1>
        {article.excerpt && <p className="mt-3 text-lg text-muted-foreground">{article.excerpt}</p>}
        {article.cover_url && (
          <img
            src={article.cover_url}
            alt={article.title}
            className="mt-6 w-full rounded-2xl border border-border"
            loading="eager"
            width={1200}
            height={675}
          />
        )}

        <AdSlot placement="in_article_top" />

        <div
          className="prose prose-slate dark:prose-invert mt-6 max-w-none text-foreground
            [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mt-8 [&>h1]:mb-3
            [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-8 [&>h2]:mb-3
            [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mt-5 [&>h3]:mb-2
            [&>p]:my-4 [&>p]:leading-relaxed
            [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:my-3
            [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:my-3
            [&>ul>li]:my-1 [&>ol>li]:my-1
            [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-muted-foreground [&>blockquote]:my-4
            [&_a]:text-primary [&_a]:underline
            [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm"
          dangerouslySetInnerHTML={{ __html: topHtml }}
        />

        {bottomHtml && (
          <>
            <AdSlot placement="in_article_middle" />
            <div
              className="prose prose-slate dark:prose-invert mt-6 max-w-none text-foreground
                [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-8 [&>h2]:mb-3
                [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mt-5 [&>h3]:mb-2
                [&>p]:my-4 [&>p]:leading-relaxed
                [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:my-3
                [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:my-3
                [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-muted-foreground [&>blockquote]:my-4
                [&_a]:text-primary [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: bottomHtml }}
            />
          </>
        )}

        <AdSlot placement="in_article_bottom" />

        <div className="mt-12 rounded-2xl border border-border bg-primary/5 p-6 text-center">
          <h3 className="text-lg font-bold text-foreground">Siap meraih beasiswa impianmu?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Daftar sekarang di program beasiswa Prestasi Kita dan mulai langkah pertamamu.
          </p>
          <Link
            to="/daftar"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
          >
            Daftar Beasiswa
          </Link>
        </div>
      </article>
    </main>
  );
}
