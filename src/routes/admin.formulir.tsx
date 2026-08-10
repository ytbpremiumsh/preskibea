import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Save, FileText, Upload, GraduationCap, Briefcase, Users, Heart } from "lucide-react";
import { toast } from "sonner";
import { FormBuilder } from "@/components/admin/FormBuilder";
import { BerkasBuilder } from "@/components/admin/BerkasBuilder";
import type { BerkasSchema, DocSlot, FormField, FormSchema } from "@/lib/form-schema";

export const Route = createFileRoute("/admin/formulir")({
  component: AdminFormulir,
});

const CATEGORIES = [
  { id: "prestasi", label: "Prestasi", icon: GraduationCap },
  { id: "ekonomi", label: "Ekonomi", icon: Briefcase },
  { id: "umum", label: "Umum", icon: Users },
  { id: "yatim", label: "Yatim", icon: Heart },
];

function AdminFormulir() {
  const [activeTab, setActiveTab] = useState("pendaftaran");
  const [activeCategory, setActiveCategory] = useState("prestasi");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [berkasFields, setBerkasFields] = useState<DocSlot[]>([]);

  const activeKey = `form_${activeTab}_${activeCategory}`;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    
    const fetchSchema = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", activeKey)
          .maybeSingle();

        if (!mounted) return;

        if (error) {
          console.error("Error fetching form schema:", error);
          toast.error("Gagal memuat data formulir");
        }

        if (activeTab === "pendaftaran") {
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
  }, [activeKey, activeTab]);

  const save = async () => {
    setSaving(true);
    const value = activeTab === "pendaftaran" ? { fields: formFields } : { fields: berkasFields };
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: activeKey, value: value as never }, { onConflict: "key" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Formulir disimpan");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Pengaturan Formulir</h1>
        <p className="text-sm text-muted-foreground">Sesuaikan kolom pendaftaran dan persyaratan berkas untuk setiap kategori.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar Controls */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-2 border-2 border-navy shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] overflow-hidden">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setActiveTab("pendaftaran")}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all rounded-xl ${
                  activeTab === "pendaftaran"
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <FileText className="h-4 w-4" />
                Form Pendaftaran
              </button>
              <button
                onClick={() => setActiveTab("berkas")}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all rounded-xl ${
                  activeTab === "berkas"
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Upload className="h-4 w-4" />
                Persyaratan Berkas
              </button>
            </div>
          </Card>

          <Card className="p-4 border-2 border-navy shadow-[4px_4px_0px_0px_rgba(30,58,138,1)]">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3 px-1">Kategori Beasiswa</h3>
            <div className="grid grid-cols-1 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all font-bold text-sm ${
                    activeCategory === cat.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-transparent text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <cat.icon className="h-4 w-4" />
                    {cat.label}
                  </div>
                  {activeCategory === cat.id && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          </Card>

          <Button 
            onClick={save} 
            disabled={saving || loading}
            className="w-full h-12 text-sm font-black uppercase tracking-widest border-2 border-navy bg-primary text-white shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(30,58,138,1)] transition-all"
          >
            {saving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
            Simpan Perubahan
          </Button>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9">
          <Card className="min-h-[600px] border-2 border-navy shadow-[8px_8px_0px_0px_rgba(30,58,138,1)] p-0 overflow-hidden bg-background">
            <div className="border-b-2 border-navy bg-muted/30 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary border border-primary/20">
                  {activeTab === "pendaftaran" ? <FileText className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
                </div>
                <div>
                  <h2 className="font-black text-navy leading-none">
                    {activeTab === "pendaftaran" ? "Field Pendaftaran" : "Persyaratan Dokumen"}
                  </h2>
                  <p className="text-xs font-bold text-muted-foreground mt-1">
                    Kategori: <span className="text-primary uppercase">{activeCategory}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm font-bold text-muted-foreground animate-pulse">Memuat konfigurasi formulir...</p>
                </div>
              ) : activeTab === "pendaftaran" ? (
                <FormBuilder fields={formFields} onChange={setFormFields} />
              ) : (
                <BerkasBuilder fields={berkasFields} onChange={setBerkasFields} />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}