import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Upload, Image as ImageIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import defaultLogo from "@/assets/logo-kp.png";

export const Route = createFileRoute("/admin/branding")({
  component: AdminBranding,
});

type Branding = {
  header_logo_url?: string;
  footer_logo_url?: string;
};

function AdminBranding() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branding, setBranding] = useState<Branding>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "branding")
        .maybeSingle();
      if (data?.value) setBranding(data.value as Branding);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: "branding", value: branding }, { onConflict: "key" });
      if (error) throw error;
      toast.success("Logo berhasil disimpan");
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
          <h1 className="text-2xl font-bold text-foreground">Logo Situs</h1>
          <p className="text-sm text-muted-foreground">
            Atur logo yang tampil pada navbar (header) dan footer halaman publik.
          </p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Simpan Perubahan
        </Button>
      </div>

      <LogoEditor
        title="Logo Header (Navbar)"
        slot="header"
        value={branding.header_logo_url}
        onChange={(url) => setBranding({ ...branding, header_logo_url: url })}
      />

      <LogoEditor
        title="Logo Footer"
        slot="footer"
        value={branding.footer_logo_url}
        onChange={(url) => setBranding({ ...branding, footer_logo_url: url })}
        hint="Kosongkan untuk menggunakan logo header."
      />
    </div>
  );
}

function LogoEditor({
  title,
  slot,
  value,
  onChange,
  hint,
}: {
  title: string;
  slot: string;
  value?: string;
  onChange: (url: string) => void;
  hint?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `branding/${slot}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("admin-media")
        .upload(path, file, { cacheControl: "3600", upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("admin-media").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Logo berhasil diunggah");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Gagal mengunggah");
    } finally {
      setUploading(false);
    }
  };

  const preview = value || defaultLogo;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {value && (
          <Button variant="ghost" size="sm" onClick={() => onChange("")}>
            <Trash2 className="h-4 w-4 mr-1 text-destructive" /> Hapus
          </Button>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-[240px_1fr]">
        <div>
          <Label className="text-xs text-muted-foreground">Preview</Label>
          <div className="mt-2 flex h-24 items-center justify-center rounded-xl border border-border bg-muted/30 p-4">
            {preview ? (
              <img src={preview} alt="Logo" className="max-h-full w-auto object-contain" />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm">URL Gambar</Label>
            <Input
              placeholder="https://... atau unggah file di bawah"
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
            />
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          </div>

          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Unggah Logo
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
