import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Share2, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/bagikan-poster")({
  component: AdminBagikanPoster,
});

type PosterCfg = {
  image_url: string;
  download_url: string;
  caption: string;
  wa_number: string;
  wa_message: string;
};

type SharePosterSettings = {
  prestasi: PosterCfg;
  ekonomi: PosterCfg;
};

const DEF_CAPTION = (label: string, url: string) => `🎓✨ BEASISWA PENDIDIKAN PRESTASI KITA — BATCH #8 ✨🎓

Halo Sobat Pejuang Pendidikan! 👋
Saatnya wujudkan mimpi pendidikanmu bersama ${label}!

💰 Total Beasiswa hingga Rp17.000.000/semester
📚 Terbuka untuk SMP, SMA/SMK/MA & Mahasiswa
🚫 100% TIDAK DIPUNGUT BIAYA

📌 Daftar sekarang di: ${url}
📷 Info lengkap: @kejarprestasi_id
📞 0812 8001 0302

#PrestasiKita #BeasiswaPendidikan`;

const DEF: SharePosterSettings = {
  prestasi: {
    image_url: "",
    download_url: "",
    caption: DEF_CAPTION("Beasiswa Prestasi", "https://kejarprestasi.id/beasiswa-prestasi"),
    wa_number: "6281280010302",
    wa_message: "Halo, saya ingin mengirim bukti bagikan poster Beasiswa Prestasi Kita.",
  },
  ekonomi: {
    image_url: "",
    download_url: "",
    caption: DEF_CAPTION("Beasiswa Ekonomi", "https://kejarprestasi.id/beasiswa-ekonomi"),
    wa_number: "6281280010302",
    wa_message: "Halo, saya ingin mengirim bukti bagikan poster Beasiswa Prestasi Kita.",
  },
};

function AdminBagikanPoster() {
  const [cfg, setCfg] = useState<SharePosterSettings>(DEF);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "share_poster")
        .maybeSingle();
      if (data?.value) {
        const v = data.value as Partial<SharePosterSettings>;
        setCfg({
          prestasi: { ...DEF.prestasi, ...(v.prestasi ?? {}) },
          ekonomi: { ...DEF.ekonomi, ...(v.ekonomi ?? {}) },
        });
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "share_poster", value: cfg as never });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Pengaturan bagikan poster tersimpan");
  };

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Share2 className="h-6 w-6 text-primary" /> Bagikan Poster
        </h1>
        <p className="text-sm text-muted-foreground">
          Atur gambar poster, link download, caption, dan tombol konfirmasi WhatsApp untuk halaman bagikan poster.
        </p>
      </div>

      <Tabs defaultValue="prestasi" className="w-full">
        <TabsList>
          <TabsTrigger value="prestasi">Beasiswa Prestasi</TabsTrigger>
          <TabsTrigger value="ekonomi">Beasiswa Ekonomi</TabsTrigger>
        </TabsList>

        {(["prestasi", "ekonomi"] as const).map((kind) => (
          <TabsContent key={kind} value={kind}>
            <PosterEditor
              value={cfg[kind]}
              onChange={(v) => setCfg({ ...cfg, [kind]: v })}
              kind={kind}
            />
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} size="lg">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Simpan Perubahan
        </Button>
      </div>
    </div>
  );
}

function PosterEditor({
  value,
  onChange,
  kind,
}: {
  value: PosterCfg;
  onChange: (v: PosterCfg) => void;
  kind: "prestasi" | "ekonomi";
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `share-poster/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("kp-uploads").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });
    if (error) {
      setUploading(false);
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from("kp-uploads").getPublicUrl(path);
    onChange({ ...value, image_url: data.publicUrl, download_url: value.download_url || data.publicUrl });
    setUploading(false);
    toast.success("Gambar berhasil diunggah");
  };

  return (
    <Card className="rounded-2xl p-6 shadow-soft space-y-5 mt-4">
      <div className="grid gap-5 md:grid-cols-[200px_1fr]">
        <div>
          <Label className="text-sm font-semibold">Preview Poster</Label>
          <div className="mt-2 aspect-[3/4] w-full overflow-hidden rounded-xl border border-border bg-muted flex items-center justify-center">
            {value.image_url ? (
              <img src={value.image_url} alt="Poster" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              if (fileRef.current) fileRef.current.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Unggah Gambar
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label>URL Gambar Poster</Label>
            <Input
              value={value.image_url}
              onChange={(e) => onChange({ ...value, image_url: e.target.value })}
              placeholder="https://..."
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Bisa diisi otomatis dari unggahan, atau tempel URL gambar manual.
            </p>
          </div>

          <div>
            <Label>URL Download Poster</Label>
            <Input
              value={value.download_url}
              onChange={(e) => onChange({ ...value, download_url: e.target.value })}
              placeholder="https://... (link file untuk diunduh)"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Biasanya sama dengan URL gambar di atas. Bisa juga ke Google Drive/dll.
            </p>
          </div>
        </div>
      </div>

      <div>
        <Label>Caption Resmi</Label>
        <Textarea
          rows={10}
          value={value.caption}
          onChange={(e) => onChange({ ...value, caption: e.target.value })}
          className="font-mono text-xs"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Nomor WhatsApp Konfirmasi</Label>
          <Input
            value={value.wa_number}
            onChange={(e) => onChange({ ...value, wa_number: e.target.value })}
            placeholder="6281280010302"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Format internasional tanpa tanda + (contoh: 6281280010302).
          </p>
        </div>
        <div>
          <Label>Pesan Awal Konfirmasi WA</Label>
          <Input
            value={value.wa_message}
            onChange={(e) => onChange({ ...value, wa_message: e.target.value })}
          />
        </div>
      </div>
    </Card>
  );
}
