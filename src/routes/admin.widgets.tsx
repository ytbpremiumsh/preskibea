import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Layout, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/widgets")({
  component: AdminWidgets,
});

type HomeWidgets = {
  widget1?: string;
  widget2?: string;
  widget3?: string;
};

type GlobalWidgets = {
  top?: string;
  bottom?: string;
};

type ArticleWidgets = {
  top?: string;
  bottom?: string;
};

type CategoryWidgets = {
  top?: string;
  bottom?: string;
};

type PageTab = "global" | "home" | "article" | "category";

function AdminWidgets() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<PageTab>("global");
  const [widgets, setWidgets] = useState<HomeWidgets>({
    widget1: "",
    widget2: "",
    widget3: "",
  });
  const [globalWidgets, setGlobalWidgets] = useState<GlobalWidgets>({
    top: "",
    bottom: "",
  });
  const [articleWidgets, setArticleWidgets] = useState<ArticleWidgets>({
    top: "",
    bottom: "",
  });
  const [categoryWidgets, setCategoryWidgets] = useState<CategoryWidgets>({
    top: "",
    bottom: "",
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "branding")
        .maybeSingle();
      
      if (data?.value) {
        const branding = data.value as any;
        if (branding.home_widgets) {
          setWidgets({
            widget1: branding.home_widgets.widget1 || "",
            widget2: branding.home_widgets.widget2 || "",
            widget3: branding.home_widgets.widget3 || "",
          });
        }
        if (branding.global_widgets) {
          setGlobalWidgets({
            top: branding.global_widgets.top || "",
            bottom: branding.global_widgets.bottom || "",
          });
        }
        if (branding.article_widgets) {
          setArticleWidgets({
            top: branding.article_widgets.top || "",
            bottom: branding.article_widgets.bottom || "",
          });
        }
        if (branding.category_widgets) {
          setCategoryWidgets({
            top: branding.category_widgets.top || "",
            bottom: branding.category_widgets.bottom || "",
          });
        }
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      // Get current branding first to avoid overwriting other branding settings
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "branding")
        .maybeSingle();
      
      const currentBranding = (data?.value as any) || {};
      const newBranding = {
        ...currentBranding,
        home_widgets: widgets,
        global_widgets: globalWidgets,
        article_widgets: articleWidgets,
        category_widgets: categoryWidgets,
      };

      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: "branding", value: newBranding }, { onConflict: "key" });
        
      if (error) throw error;
      toast.success("Widget berhasil disimpan");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Layout className="h-6 w-6 text-primary" /> Pengaturan Widget & Iklan
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola kode HTML/Scripts untuk widget yang muncul di seluruh halaman situs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={activeTab} onValueChange={(v: PageTab) => setActiveTab(v)}>
            <SelectTrigger className="w-[200px] bg-card">
              <SelectValue placeholder="Pilih Halaman" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global (Semua Halaman)</SelectItem>
              <SelectItem value="home">Halaman Utama</SelectItem>
              <SelectItem value="article">Halaman Artikel</SelectItem>
              <SelectItem value="category">Halaman Kategori</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Simpan Perubahan
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {activeTab === "global" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Widget Global (Semua Halaman)</h2>
            <div className="grid gap-6">
              <WidgetEditor
                title="Global Top (Header)"
                description="Slot ini muncul di bagian paling atas di SEMUA halaman (setelah header)."
                value={globalWidgets.top}
                onChange={(v) => setGlobalWidgets({ ...globalWidgets, top: v })}
              />
              <WidgetEditor
                title="Global Bottom (Footer)"
                description="Slot ini muncul di bagian paling bawah di SEMUA halaman (sebelum footer)."
                value={globalWidgets.bottom}
                onChange={(v) => setGlobalWidgets({ ...globalWidgets, bottom: v })}
              />
            </div>
          </div>
        )}

        {activeTab === "home" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Widget Halaman Utama (Beranda)</h2>
            <div className="grid gap-6">
              <WidgetEditor
                title="Widget 1 (Di bawah Hero)"
                description="Slot ini muncul tepat setelah bagian hero di halaman utama."
                value={widgets.widget1}
                onChange={(v) => setWidgets({ ...widgets, widget1: v })}
              />
              <WidgetEditor
                title="Widget 2 (Di bawah Kategori)"
                description="Slot ini muncul setelah daftar kategori beasiswa."
                value={widgets.widget2}
                onChange={(v) => setWidgets({ ...widgets, widget2: v })}
              />
              <WidgetEditor
                title="Widget 3 (Di bawah Benefit)"
                description="Slot ini muncul setelah bagian keuntungan beasiswa."
                value={widgets.widget3}
                onChange={(v) => setWidgets({ ...widgets, widget3: v })}
              />
            </div>
          </div>
        )}

        {activeTab === "article" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Widget Halaman Artikel</h2>
            <div className="grid gap-6">
              <WidgetEditor
                title="Article List Top"
                description="Slot ini muncul di bagian atas daftar artikel."
                value={articleWidgets.top}
                onChange={(v) => setArticleWidgets({ ...articleWidgets, top: v })}
              />
              <WidgetEditor
                title="Article List Bottom"
                description="Slot ini muncul di bagian bawah daftar artikel."
                value={articleWidgets.bottom}
                onChange={(v) => setArticleWidgets({ ...articleWidgets, bottom: v })}
              />
            </div>
          </div>
        )}

        {activeTab === "category" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Widget Halaman Kategori</h2>
            <div className="grid gap-6">
              <WidgetEditor
                title="Category Middle"
                description="Slot ini muncul di tengah halaman kategori (setelah info persyaratan)."
                value={categoryWidgets.top}
                onChange={(v) => setCategoryWidgets({ ...categoryWidgets, top: v })}
              />
              <WidgetEditor
                title="Category Bottom"
                description="Slot ini muncul di bagian bawah halaman kategori."
                value={categoryWidgets.bottom}
                onChange={(v) => setCategoryWidgets({ ...categoryWidgets, bottom: v })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WidgetEditor({ title, description, value, onChange }: { title: string; description: string; value?: string; onChange: (v: string) => void }) {
  return (
    <Card className="p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-mono">HTML / JavaScript Code</Label>
        <Textarea
          rows={10}
          spellCheck={false}
          className="font-mono text-xs"
          placeholder="<!-- Paste your HTML or AdSense code here -->"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </Card>
  );
}
