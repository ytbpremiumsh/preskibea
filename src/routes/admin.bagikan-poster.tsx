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
  is_unified?: boolean;
  unified?: PosterCfg;
  prestasi: PosterCfg;
  ekonomi: PosterCfg;
  umum: PosterCfg;
  yatim: PosterCfg;
};

const DEF_CAPTION = (label: string, url: string) => `💰 TOTAL BEASISWA/SEMESTER: RP17.000.000

📢 Beasiswa Resmi Prestasi Kita (Batch #8) – DIBUKA!

🎯 35 Pendaftar Pertama mendapat jalur prioritas!
${url}

Beasiswa hanya dibuka setahun sekali

⚠️ Kuota terbatas! Ditutup lebih awal jika penuh!

———————————
📢 Tentang Kami!
Prestasi Kita adalah lembaga pemberi beasiswa yang membantu pelajar dan mahasiswa Indonesia meraih mimpi pendidikan setinggi mungkin.

🎁 BENEFIT LAINNYA:
⭐ Dana pendidikan hingga Rp17.000.000/semester
⭐ Sertifikat Partisipasi Nasional
⭐ Merchandise eksklusif & E-Book Menjemput Beasiswa

📌 PERSYARATAN:
•  Wajib lolos seleksi (online & interview)
•  Tanpa syarat minimal nilai rapor/IPK

👥 KATEGORI:
•  Mahasiswa
•  Pelajar SMA/SMK/MA
•  Pelajar SMP

Daftar di:
${url}

Cek informasi lengkap di: https://prestasikita.com

⚠️ Waspada penipuan yang mengatasnamakan lembaga resmi Prestasi Kita

📱 Instagram: https://www.instagram.com/prestasikita
🌐 Website: https://prestasikita.com
📞 0812 8001 0302`;

const DEF: SharePosterSettings = {
  is_unified: true,
  unified: {
    image_url: "",
    download_url: "",
    caption: DEF_CAPTION("Beasiswa Prestasi Kita", "https://prestasikita.com"),
    wa_number: "6281280010302",
    wa_message: "Halo, saya ingin mengirim bukti bagikan poster Beasiswa Prestasi Kita.",
  },
  prestasi: {
    image_url: "",
    download_url: "",
    caption: DEF_CAPTION("Beasiswa Prestasi", "https://prestasikita.com/beasiswa-prestasi"),
    wa_number: "6281280010302",
    wa_message: "Halo, saya ingin mengirim bukti bagikan poster Beasiswa Prestasi Kita.",
  },
  ekonomi: {
    image_url: "",
    download_url: "",
    caption: DEF_CAPTION("Beasiswa Ekonomi", "https://prestasikita.com/beasiswa-ekonomi"),
    wa_number: "6281280010302",
    wa_message: "Halo, saya ingin mengirim bukti bagikan poster Beasiswa Prestasi Kita.",
  },
  umum: {
    image_url: "",
    download_url: "",
    caption: DEF_CAPTION("Beasiswa Umum", "https://prestasikita.com/beasiswa-umum"),
    wa_number: "6281280010302",
    wa_message: "Halo, saya ingin mengirim bukti bagikan poster Beasiswa Prestasi Kita.",
  },
  yatim: {
    image_url: "",
    download_url: "",
    caption: DEF_CAPTION("Beasiswa Yatim", "https://prestasikita.com/beasiswa-yatim"),
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
          is_unified: v.is_unified ?? DEF.is_unified,
          unified: { ...DEF.unified!, ...(v.unified ?? {}) },
          prestasi: { ...DEF.prestasi, ...(v.prestasi ?? {}) },
          ekonomi: { ...DEF.ekonomi, ...(v.ekonomi ?? {}) },
          umum: { ...DEF.umum, ...(v.umum ?? {}) },
          yatim: { ...DEF.yatim, ...(v.yatim ?? {}) },
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

      <Tabs defaultValue={cfg.is_unified ? "unified" : "prestasi"} className="w-full">
        <TabsList>
          <TabsTrigger value="unified">Semua Kategori (Unified)</TabsTrigger>
          <TabsTrigger value="prestasi">Beasiswa Prestasi</TabsTrigger>
          <TabsTrigger value="ekonomi">Beasiswa Ekonomi</TabsTrigger>
          <TabsTrigger value="umum">Beasiswa Umum</TabsTrigger>
          <TabsTrigger value="yatim">Beasiswa Yatim</TabsTrigger>
        </TabsList>

        <TabsContent value="unified">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-4 text-sm text-primary flex items-center justify-between">
            <p>Gunakan satu pengaturan poster untuk semua kategori beasiswa.</p>
            <Button 
              variant={cfg.is_unified ? "default" : "outline"} 
              size="sm"
              onClick={() => setCfg({ ...cfg, is_unified: !cfg.is_unified })}
            >
              {cfg.is_unified ? "Status: Aktif" : "Aktifkan Unified"}
            </Button>
          </div>
          <PosterEditor
            value={cfg.unified!}
            onChange={(v) => setCfg({ ...cfg, unified: v })}
            kind="unified"
          />
        </TabsContent>

        {(["prestasi", "ekonomi", "umum", "yatim"] as const).map((kind) => (
          <TabsContent key={kind} value={kind}>
            {!cfg.is_unified ? null : (
              <div className="bg-muted border border-border rounded-2xl p-4 mb-4 text-xs text-muted-foreground italic">
                Mode Unified sedang aktif. Pengaturan per kategori ini mungkin tidak akan muncul di halaman publik kecuali mode Unified dinonaktifkan.
              </div>
            )}
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
  kind: "prestasi" | "ekonomi" | "umum" | "yatim" | "unified";
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `share-poster/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("admin-media").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });
    if (error) {
      setUploading(false);
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from("admin-media").getPublicUrl(path);
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
