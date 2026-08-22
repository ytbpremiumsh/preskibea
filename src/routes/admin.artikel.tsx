import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, X, Save, Eye, FileText, Sparkles } from "lucide-react";
import { generateAiArticle } from "@/lib/api";

export const Route = createFileRoute("/admin/artikel")({
  head: () => ({ meta: [{ title: "Admin — Artikel" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminArtikelPage,
});

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string;
  cover_url: string | null;
  status: string;
  published_at: string;
  author: string | null;
  updated_at: string;
};

const emptyArticle = (): Partial<Article> => ({
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "Umum",
  cover_url: "",
  status: "published",
  author: "",
});

function slugify(s: string) {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function AdminArtikelPage() {
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Article> | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState<string>("Semua");
  const [generating, setGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as Article[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const categories = Array.from(new Set(["Semua", ...items.map((a) => a.category)]));
  const filtered = filterCat === "Semua" ? items : items.filter((a) => a.category === filterCat);

  const save = async () => {
    if (!editing) return;
    if (!editing.title?.trim()) return toast.error("Judul wajib diisi");
    const slug = (editing.slug?.trim() || slugify(editing.title)) || slugify(editing.title);
    setSaving(true);
    const payload = {
      title: editing.title.trim(),
      slug,
      excerpt: editing.excerpt?.trim() || null,
      content: editing.content ?? "",
      category: editing.category?.trim() || "Umum",
      cover_url: editing.cover_url?.trim() || null,
      status: editing.status || "published",
      author: editing.author?.trim() || null,
      published_at: editing.published_at || new Date().toISOString(),
    };
    let error;
    if (editing.id) {
      ({ error } = await supabase.from("articles").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("articles").insert(payload));
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Artikel disimpan");
    setEditing(null);
    load();
  };

  const generateWithAi = async () => {
    if (!aiTopic.trim()) return toast.error("Masukkan topik artikel");
    setGenerating(true);
    try {
      const res = await generateAiArticle({ 
        topic: aiTopic.trim(), 
        category: editing?.category || "Tips Beasiswa",
        tone: "informal",
        language: "id"
      });
      setEditing({
        ...editing,
        title: res.title,
        excerpt: res.excerpt,
        content: res.content,
        category: res.category || editing?.category || "Tips Beasiswa",
        slug: slugify(res.title)
      });
      setAiTopic("");
      toast.success("Artikel berhasil dibuat oleh AI");
    } catch (err) {
      toast.error("Gagal membuat artikel: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setGenerating(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus artikel ini?")) return;
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Artikel dihapus");
    load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Kelola Artikel
          </h1>
          <p className="text-sm text-muted-foreground">Tambah, edit, dan hapus artikel seperti posting WordPress.</p>
        </div>
        <Button onClick={() => setEditing(emptyArticle())}>
          <Plus className="h-4 w-4 mr-1" /> Artikel Baru
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            className={`rounded-full px-3 py-1 text-xs font-medium border ${filterCat === c ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Belum ada artikel.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Judul</th>
                  <th className="text-left p-3">Kategori</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Tanggal</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="p-3">
                      <div className="font-medium text-foreground">{a.title}</div>
                      <div className="text-xs text-muted-foreground">/{a.slug}</div>
                    </td>
                    <td className="p-3"><span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs">{a.category}</span></td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${a.status === "published" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{new Date(a.published_at).toLocaleDateString("id-ID")}</td>
                    <td className="p-3 text-right">
                      <a href={`/artikel/${a.slug}`} target="_blank" rel="noreferrer" className="inline-flex"><Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button></a>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(a)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4" onClick={() => setEditing(null)}>
          <div className="my-8 w-full max-w-3xl rounded-2xl bg-background p-6 shadow-soft" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{editing.id ? "Edit Artikel" : "Artikel Baru"}</h2>
              <Button variant="ghost" size="sm" onClick={() => setEditing(null)}><X className="h-4 w-4" /></Button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-4">
                <label className="text-xs font-bold text-primary flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-3 w-3" /> Buat Konten dengan AI
                </label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Contoh: Tips lolos seleksi berkas beasiswa Batch 8..." 
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    disabled={generating}
                    className="bg-background"
                  />
                  <Button 
                    type="button" 
                    variant="default"
                    onClick={generateWithAi} 
                    disabled={generating || !aiTopic.trim()}
                    className="gap-2 shrink-0"
                  >
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Generate
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  AI akan membuat artikel SEO friendly dengan gaya bahasa manusia. Pastikan LOVABLE_API_KEY terkonfigurasi.
                </p>
              </div>

              <Field label="Judul">
                <Input
                  value={editing.title ?? ""}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })}
                />
              </Field>
              <Field label="Slug (URL)">
                <Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} />
              </Field>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Kategori">
                  <Input list="cats" value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
                  <datalist id="cats">
                    {Array.from(new Set(items.map((a) => a.category))).map((c) => <option key={c} value={c} />)}
                  </datalist>
                </Field>
                <Field label="Status">
                  <select
                    value={editing.status ?? "published"}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </Field>
              </div>
              <Field label="URL Gambar Sampul">
                <Input value={editing.cover_url ?? ""} onChange={(e) => setEditing({ ...editing, cover_url: e.target.value })} placeholder="https://..." />
              </Field>
              <Field label="Penulis">
                <Input value={editing.author ?? ""} onChange={(e) => setEditing({ ...editing, author: e.target.value })} />
              </Field>
              <Field label="Ringkasan">
                <textarea
                  rows={2}
                  value={editing.excerpt ?? ""}
                  onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Konten (Markdown: # judul, ## sub, **tebal**, - daftar)">
                <textarea
                  rows={14}
                  value={editing.content ?? ""}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                />
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Batal</Button>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-foreground/80">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
