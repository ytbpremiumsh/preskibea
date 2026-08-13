import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Layout } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/widgets")({
  component: AdminWidgets,
});

type HomeWidgets = {
  widget1?: string;
  widget2?: string;
  widget3?: string;
};

function AdminWidgets() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [widgets, setWidgets] = useState<HomeWidgets>({
    widget1: "",
    widget2: "",
    widget3: "",
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
        home_widgets: widgets
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
            <Layout className="h-6 w-6 text-primary" /> Widget Halaman Utama
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola kode HTML/Scripts untuk widget yang muncul di halaman beranda.
          </p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Simpan Semua Widget
        </Button>
      </div>

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
