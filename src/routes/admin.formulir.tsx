import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { FormBuilder } from "@/components/admin/FormBuilder";
import { BerkasBuilder } from "@/components/admin/BerkasBuilder";
import type { BerkasSchema, DocSlot, FormField, FormSchema } from "@/lib/form-schema";

export const Route = createFileRoute("/admin/formulir")({
  component: AdminFormulir,
});

const TABS = [
  { key: "form_pendaftaran_prestasi", label: "Pendaftaran Prestasi", kind: "form" as const },
  { key: "form_pendaftaran_ekonomi", label: "Pendaftaran Ekonomi", kind: "form" as const },
  { key: "form_pendaftaran_umum", label: "Pendaftaran Umum", kind: "form" as const },
  { key: "form_pendaftaran_yatim", label: "Pendaftaran Yatim", kind: "form" as const },
  { key: "form_berkas_prestasi", label: "Berkas Prestasi", kind: "berkas" as const },
  { key: "form_berkas_ekonomi", label: "Berkas Ekonomi", kind: "berkas" as const },
  { key: "form_berkas_umum", label: "Berkas Umum", kind: "berkas" as const },
  { key: "form_berkas_yatim", label: "Berkas Yatim", kind: "berkas" as const },
];

function AdminFormulir() {
  const [active, setActive] = useState(TABS[0].key);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [berkasFields, setBerkasFields] = useState<DocSlot[]>([]);

  const tab = TABS.find((t) => t.key === active)!;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    
    const fetchSchema = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", active)
          .maybeSingle();

        if (!mounted) return;

        if (error) {
          console.error("Error fetching form schema:", error);
          toast.error("Gagal memuat data formulir");
        }

        if (tab.kind === "form") {
          const v = (data?.value ?? { fields: [] }) as FormSchema;
          setFormFields(Array.isArray(v.fields) ? v.fields : []);
        } else {
          const v = (data?.value ?? { fields: [] }) as BerkasSchema;
          setBerkasFields(Array.isArray(v.fields) ? v.fields : []);
        }
      } catch (err) {
        console.error("Exception fetching form schema:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSchema();
    return () => { mounted = false; };
  }, [active, tab.kind]);

  const save = async () => {
    setSaving(true);
    const value = tab.kind === "form" ? { fields: formFields } : { fields: berkasFields };
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: active, value: value as never }, { onConflict: "key" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Formulir disimpan");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Formulir</h1>
        <p className="text-sm text-muted-foreground">Atur form pendaftaran & pengiriman berkas dengan drag-and-drop.</p>
      </div>

      <Card className="rounded-2xl p-2 shadow-soft">
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${active === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="rounded-2xl p-4 md:p-6 shadow-soft">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : tab.kind === "form" ? (
          <FormBuilder fields={formFields} onChange={setFormFields} />
        ) : (
          <BerkasBuilder fields={berkasFields} onChange={setBerkasFields} />
        )}
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving || loading}>
          {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          Simpan Perubahan
        </Button>
      </div>
    </div>
  );
}
