import { useEffect, useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { PaymentIframeModal } from "@/components/PaymentIframeModal";
import {
  ArrowRight,
  CheckCircle2,
  LinkIcon,
  Loader2,
  KeyRound,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { BerkasSchema, DocSlot } from "@/lib/form-schema";
import { submitBerkasDocuments, sendAppEmail } from "@/lib/api";
import { AdSlot } from "@/components/ads/AdSlot";
import { KetentuanBerkasCard } from "@/components/KetentuanBerkasCard";

const defaultDocs: Record<"prestasi" | "ekonomi" | "umum" | "yatim", DocSlot[]> = {
  prestasi: [
    { id: "identity", key: "identity", label: "Kartu Pelajar / Kartu Mahasiswa", required: true },
    { id: "khs", key: "khs", label: "Kartu Hasil Studi (KHS)", required: true },
    { id: "transcript_custom", key: "transcript_custom", label: "Transkrip Nilai", required: true },
    {
      id: "achievement_academic_text",
      key: "achievement_academic_text",
      label: "Prestasi Akademik (Tuliskan prestasi akademik kamu)",
      required: true,
      type: "textarea",
      placeholder: "1. Juara 1 Olimpiade Matematika tingkat Kabupaten 2025\n2. Juara 2 Lomba Sains Nasional 2024",
    },
    {
      id: "achievement_nonacademic_text",
      key: "achievement_nonacademic_text",
      label: "Prestasi Non Akademik (Tuliskan prestasi non akademik kamu)",
      required: true,
      type: "textarea",
      placeholder: "1. Juara 1 Lomba Futsal tingkat Provinsi 2025\n2. Juara 2 Lomba Cerdas Cermat 2024",
    },
    {
      id: "organization_text",
      key: "organization_text",
      label: "Organisasi (Tuliskan pengalaman organisasi kamu)",
      required: true,
      type: "textarea",
      placeholder: "1. Ketua OSIS 2024-2025\n2. Anggota Pramuka 2023-2024",
    },
    { id: "achievement_certs", key: "achievement_certs", label: "Sertifikat Prestasi (Akademik maupun Non-Akademik)", required: true },
    { id: "additional_docs", key: "additional_docs", label: "Berkas Pendukung Lainnya (Optional)", required: false },

  ],
  ekonomi: [
    { id: "identity", key: "identity", label: "Kartu Pelajar / Kartu Mahasiswa", required: true },
    { id: "income_statement", key: "income_statement", label: "Surat Keterangan Penghasilan Orang Tua / Slip Gaji", required: true },
    {
      id: "parent_income",
      key: "parent_income",
      label: "Penghasilan Orang Tua per Bulan",
      required: true,
      type: "select",
      options: [
        { label: "Rp 0 - Rp 1.000.000", value: "0-1jt" },
        { label: "Rp 1.000.001 - Rp 2.500.000", value: "1jt-2.5jt" },
        { label: "Rp 2.500.001 - Rp 5.000.000", value: "2.5jt-5jt" },
        { label: "Rp 5.000.001 - Rp 10.000.000", value: "5jt-10jt" },
        { label: "> Rp 10.000.000", value: ">10jt" },
      ]
    },
    {
      id: "dependents",
      key: "dependents",
      label: "Jumlah Tanggungan Keluarga",
      required: true,
      type: "select",
      options: [
        { label: "1 Orang", value: "1" },
        { label: "2 Orang", value: "2" },
        { label: "3 Orang", value: "3" },
        { label: "4 Orang", value: "4" },
        { label: "5 Orang", value: "5" },
        { label: "> 5 Orang", value: ">5" },
      ]
    },
    { id: "sktm", key: "sktm", label: "Surat Keterangan Tidak Mampu (SKTM)", required: true },
    { id: "house_photos", key: "house_photos", label: "Foto Rumah (Tampak Depan & Ruang Tamu)", required: true },
    { id: "utility_bill", key: "utility_bill", label: "Foto Pembayaran Listrik Terakhir ( Wajib )", required: true },
  ],
  umum: [
    { id: "identity", key: "identity", label: "Kartu Pelajar / Kartu Mahasiswa", required: true },
    { id: "khs", key: "khs", label: "Kartu Hasil Studi (KHS)", required: true },
    { id: "transcript_custom", key: "transcript_custom", label: "Transkrip Nilai", required: true },
    { id: "tiktok_video", key: "tiktok_video", label: "Video Tiktok 1 Menit (Menjelaskan Beasiswa Prestasi Kita)", required: true },
    {
      id: "who_are_you_text",
      key: "who_are_you_text",
      label: "Siapa Kamu? (Tuliskan tentang dirimu sendiri)",
      required: true,
      type: "textarea",
      placeholder: "Halo, nama saya Andi. Saat ini saya bersekolah di SMA Negeri 1 dan memiliki ketertarikan di bidang teknologi serta menulis. Saya aktif dalam kegiatan organisasi sekolah...",
    },
    {
      id: "organization_training_text",
      key: "organization_training_text",
      label: "Organisasi / Pelatihan yang pernah diikuti (Optional)",
      required: false,
      type: "textarea",
      placeholder: "1. Ketua OSIS 2024-2025\n2. Pelatihan Kepemimpinan Nasional 2024",
    },
    { id: "additional_docs", key: "additional_docs", label: "Berkas Pendukung Lainnya (Optional)", required: false },
  ],
  yatim: [
    { id: "identity", key: "identity", label: "Kartu Pelajar / Kartu Mahasiswa", required: true },
    { id: "orphan_letter", key: "orphan_letter", label: "Surat Keterangan Yatim / Piatu / Yatim Piatu", required: true },
    { id: "death_cert", key: "death_cert", label: "Akta Kematian Orang Tua", required: true },
    
    {
      id: "income_source",
      key: "income_source",
      label: "Penghasilan dari Siapa (Ibu / Kakak / Saudara)",
      required: true,
      type: "select",
      placeholder: "Pilih Sumber Penghasilan",
      options: [
        { label: "Ibu", value: "ibu" },
        { label: "Kakak", value: "kakak" },
        { label: "Saudara", value: "saudara" },
      ],
    },
    {
      id: "income_per_month",
      key: "income_per_month",
      label: "Penghasilan Per Bulan",
      required: true,
      type: "select",
      placeholder: "Pilih Range Penghasilan",
      options: [
        { label: "Rp 0 - Rp 1.000.000", value: "0-1jt" },
        { label: "Rp 1.000.001 - Rp 2.500.000", value: "1jt-2.5jt" },
        { label: "Rp 2.500.001 - Rp 5.000.000", value: "2.5jt-5jt" },
        { label: "Rp 5.000.001 - Rp 10.000.000", value: "5jt-10jt" },
        { label: "> Rp 10.000.000", value: ">10jt" },
      ],
    },
    { id: "utility_bill", key: "utility_bill", label: "Foto Pembayaran Listrik Terakhir ( Wajib )", required: true },
  ],
};

function isValidUrl(v: string) {
  try {
    const u = new URL(v.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

type RegInfo = {
  id?: string;
  full_name: string;
  email?: string | null;
  whatsapp: string;
  school_name?: string | null;
  education_level?: string | null;
  gender?: string | null;
  birth_place?: string | null;
  birth_date?: string | null;
  address?: string | null;
  grade?: string | null;
  token?: string | null;
  fast_track?: boolean | null;
  payment_status?: string | null;
  payment_url?: string | null;
  essay_submitted?: boolean | null;
};

const tokenPrefix = (k: "prestasi" | "ekonomi" | "umum" | "yatim") =>
  k === "prestasi" ? "PK-PRE-" : k === "ekonomi" ? "PK-EKO-" : k === "yatim" ? "PK-YAT-" : "PK-UMU-";

export function BerkasPage({ kind }: { kind: "prestasi" | "ekonomi" | "umum" | "yatim" }) {
  const navigate = useNavigate();
  const [payOpen, setPayOpen] = useState(false);
  const submitBerkas = submitBerkasDocuments;
  const sendEmail = sendAppEmail;
  const search = useSearch({ strict: false }) as { token?: string };
  const [token, setToken] = useState((search.token ?? "").toUpperCase());
  const [docs, setDocs] = useState<DocSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [registrant, setRegistrant] = useState<RegInfo | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const isFastTrack = !!registrant?.fast_track;
  const paymentDue = isFastTrack && registrant?.payment_status !== "paid";
  const essayDone = !paymentDue && (isFastTrack || !!registrant?.essay_submitted);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const level = registrant?.education_level?.toLowerCase() || "";
    const isMahasiswa = level.includes("mahasiswa") || level.includes("s1") || level.includes("diploma");
    const isPelajarOrGapyear = level.includes("smp") || level.includes("sma") || level.includes("smk") || level.includes("ma") || level.includes("gap year") || level.includes("lulusan");
    
    let baseDocs = [...defaultDocs[kind]];
    
    // Adjust label and visibility based on education level
    baseDocs = baseDocs.map(d => {
      if (d.key === "transcript") {
        return { 
          ...d, 
          label: isMahasiswa ? "KHS / Transkrip Nilai Terakhir" : "Rapor Terakhir" 
        };
      }
      if (d.key === "identity") {
        return { 
          ...d, 
          label: isMahasiswa ? "Kartu Tanda Mahasiswa (KTM)" : "Kartu Pelajar / Kartu Identitas" 
        };
      }
      return d;
    }).filter(d => {
      // Logic from user: 
      // KHS only for Mahasiswa
      // Transkrip Nilai only for Pelajar and Gapyear
      // Berkas Pendukung (additional_docs) for everyone
      if (kind === "prestasi" || kind === "umum") {
        if (d.key === "khs" && !isMahasiswa) return false;
        if (d.key === "transcript_custom" && !isPelajarOrGapyear) return false;
      }
      return true;
    });

    setDocs(baseDocs);

    setValues({});

    (async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", `form_berkas_${kind}`)
          .maybeSingle();
        if (!mounted) return;
        if (data?.value && Array.isArray((data.value as BerkasSchema).fields)) {
          const configured = (data.value as BerkasSchema).fields;
          if (configured.length > 0) setDocs(configured);
        }
      } catch {
        /* ignore */
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [kind]);

  const setVal = (key: string, v: string) => setValues((s) => ({ ...s, [key]: v }));

  const handleVerify = async (silent = false) => {
    const t = token.trim().toUpperCase();
    if (!t) {
      if (!silent) toast.error("Masukkan kode pendaftar Anda");
      return;
    }
    if (!t.startsWith(tokenPrefix(kind))) {
      setSearchError(
        `Kode tidak sesuai jenis beasiswa. Kode ${kind === "prestasi" ? "Prestasi" : kind === "ekonomi" ? "Ekonomi" : kind === "yatim" ? "Yatim" : "Umum"} diawali ${tokenPrefix(kind)}`,
      );
      return;
    }
    setVerifying(true);
    setSearchError(null);
    setRegistrant(null);
    try {
      const { data, error } = await supabase.functions.invoke("lookup-pendaftar", {
        body: { token: t, kind },
      });
      if (error) throw error;
      const payload = data as { ok: boolean; data?: RegInfo; error?: string };
      if (!payload?.ok || !payload.data) {
        const msg =
          payload?.error === "not_found"
            ? "Kode tidak ditemukan. Periksa kembali kode dari WhatsApp / halaman sukses pendaftaran kamu."
            : "Gagal memverifikasi kode.";
        setSearchError(msg);
        return;
      }
      setRegistrant(payload.data);
      if (!silent) toast.success(`Selamat datang, ${payload.data.full_name}`);
    } catch (err) {
      console.error(err);
      setSearchError("Terjadi kesalahan saat memverifikasi kode.");
    } finally {
      setVerifying(false);
    }
  };

  // Auto-verify if token came from URL or update docs when registrant data changes
  useEffect(() => {
    if (search.token && !registrant && !verifying) {
      handleVerify(true);
    }
    
    if (registrant) {
      const level = registrant.education_level?.toLowerCase() || "";
      const isMahasiswa = level.includes("mahasiswa") || level.includes("s1") || level.includes("diploma");
      const isPelajarOrGapyear = level.includes("smp") || level.includes("sma") || level.includes("smk") || level.includes("ma") || level.includes("gap year") || level.includes("lulusan");
      
      let baseDocs = [...defaultDocs[kind]];
      
      baseDocs = baseDocs.map(d => {
        if (d.key === "transcript") {
          return { 
            ...d, 
            label: isMahasiswa ? "KHS / Transkrip Nilai Terakhir" : "Rapor Terakhir" 
          };
        }
        if (d.key === "identity") {
          return { 
            ...d, 
            label: isMahasiswa ? "Kartu Tanda Mahasiswa (KTM)" : "Kartu Pelajar / Kartu Identitas" 
          };
        }
        return d;
      }).filter(d => {
        if (kind === "prestasi" || kind === "umum") {
          if (d.key === "khs" && !isMahasiswa) return false;
          if (d.key === "transcript_custom" && !isPelajarOrGapyear) return false;
        }
        return true;
      });

      setDocs(baseDocs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.token, kind, registrant]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrant) {
      toast.error("Verifikasi kode pendaftar terlebih dahulu");
      return;
    }
    if (paymentDue) {
      toast.error("Selesaikan pembayaran Fast Track terlebih dahulu");
      return;
    }
    if (!essayDone) {
      toast.error("Selesaikan Esai Singkat terlebih dahulu di halaman Esai");
      return;
    }
    const missing = docs.filter((d) => d.required && !(values[d.key] ?? "").trim());
    if (missing.length > 0) {
      toast.error(`Lengkapi: ${missing.map((d) => d.label).join(", ")}`);
      return;
    }
    const invalid = docs.filter((d) => {
      if (d.type === "select" || d.type === "textarea") return false;
      const v = (values[d.key] ?? "").trim();
      if (!v) return false;
      return !isValidUrl(v);
    });
    if (invalid.length > 0) {
      toast.error(`URL tidak valid: ${invalid.map((d) => d.label).join(", ")}`);
      return;
    }

    setSubmitting(true);
    try {
      const regEmail = (registrant.email ?? "").trim();
      if (!regEmail || !regEmail.includes("@")) {
        toast.error("Email pendaftar tidak ditemukan. Hubungi admin.");
        setSubmitting(false);
        return;
      }
      const submittedDocs = docs
        .map((d) => ({ d, v: (values[d.key] ?? "").trim() }))
        .filter(({ v }) => v.length > 0)
        .map(({ d, v }) => ({
          key: d.key,
          label: d.label,
          url: v,
        }));

      const result = await submitBerkas({
        token: token.trim().toUpperCase(),
        kind,
        documents: submittedDocs,
        registration_updates: {
          khs_url: (values["khs"] ?? "").trim() || null,
          transcript_custom_url: (values["transcript_custom"] ?? "").trim() || null,
          additional_docs_url: (values["additional_docs"] ?? "").trim() || null,
          tiktok_video_url: (values["tiktok_video"] ?? "").trim() || null,
          status: "verified" // Set status to verified after docs are submitted
        }
      });

      supabase.functions
        .invoke("send-whatsapp", {
          body: {
            type: "berkas",
            full_name: registrant.full_name,
            email: regEmail,
            whatsapp: "",
            kind,
            doc_count: result.count,
            token: registrant.token ?? token,
          },
        })
        .catch(() => {
          /* ignore */
        });

      // Fire-and-forget email confirmation
      sendEmail({
        data: {
          templateName: "berkas-confirmation",
          recipientEmail: regEmail,
          idempotencyKey: `berkas-${registrant.token ?? token}-${result.count}`,
          templateData: {
            fullName: registrant.full_name,
            token: registrant.token ?? token,
            kind,
            count: result.count,
          },
        },
      }).catch(() => { /* ignore */ });

      toast.success("Berkas berhasil dikirim!");
      try {
        navigate({ to: "/berkas/terkirim", search: { kind, count: result.count } });
      } catch (navErr) {
        console.error("navigate error", navErr);
        if (typeof window !== "undefined") {
          window.location.href = `/berkas/terkirim?kind=${kind}&count=${result.count}`;
        }
      }
    } catch (err) {
      console.error("berkas submit error", err);
      const e = err as { message?: unknown; error?: unknown; details?: unknown; hint?: unknown; code?: unknown } | null;
      const parts = e ? [e.message, e.error, e.details, e.hint, e.code].filter((v) => typeof v === "string" && v.length > 0) : [];
      const msg = err instanceof Error ? err.message : (parts.length ? parts.join(" — ") : (() => { try { return JSON.stringify(err); } catch { return "Error"; } })());
      toast.error(`Gagal mengirim berkas: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!registrant) {
    return (
      <section className="container-page py-12 md:py-16 flex flex-col items-center">
        <div className="w-full max-w-xl">
          <Link to="/" className="text-xs font-semibold text-primary hover:underline">
            ← Kembali ke Beranda
          </Link>
          <div className="mt-4">
            <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              Berkas {kind === "prestasi" ? "Beasiswa Prestasi" : kind === "ekonomi" ? "Beasiswa Ekonomi" : "Beasiswa Umum"}
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-foreground">Verifikasi Berkas</h1>
            <p className="mt-2 text-muted-foreground">
              Masukkan kode pendaftar kamu untuk melanjutkan ke tahap Berkas Administrasi.
            </p>
          </div>
        </div>

        <div className="mt-10 w-full max-w-xl">
          <div className="card-block p-6 md:p-7">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <KeyRound size={16} className="text-primary" /> Kode Pendaftar
            </h2>
            <div className="mt-5 grid sm:grid-cols-[1fr_auto] gap-3 items-end">
              <label className="block w-full">
                <span className="text-xs font-medium text-foreground/80">
                  Kode Pendaftar<span className="text-destructive"> *</span>
                </span>
                <div className="mt-1.5 relative">
                  <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => {
                      setToken(e.target.value.toUpperCase());
                      setSearchError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleVerify();
                      }
                    }}
                    placeholder={`${tokenPrefix(kind)}XXXXXX`}
                    className="w-full rounded-xl border border-border bg-background pl-9 pr-3.5 py-2.5 text-sm font-mono tracking-wider outline-none transition focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </label>
              <button
                type="button"
                onClick={() => handleVerify()}
                disabled={verifying}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 transition disabled:opacity-60"
              >
                {verifying ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                Lanjut
              </button>
            </div>
            {searchError && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <div>{searchError}</div>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container-page py-12 md:py-16">
      <Link to="/" className="text-xs font-semibold text-primary hover:underline">
        ← Kembali ke Beranda
      </Link>
      <div className="mt-4 max-w-3xl">
        <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
          Berkas {kind === "prestasi" ? "Beasiswa Prestasi" : kind === "ekonomi" ? "Beasiswa Ekonomi" : "Beasiswa Umum"}
        </span>
        <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-foreground">
          Pengiriman Berkas Pendukung
        </h1>
        <p className="mt-2 text-muted-foreground">
          Lengkapi berkas pendukung sesuai persyaratan beasiswa kamu.
        </p>
      </div>

      <AdSlot placement="berkas_top" />

      <form onSubmit={handleSubmit} className="mt-10 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {registrant && (
            <div className="rounded-2xl border border-primary/30 bg-primary-soft/40 p-5">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                  <UserCheck size={16} className="shrink-0" /> Terverifikasi: {registrant.full_name}
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-primary/10">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-primary/60 block">Jenjang Pendidikan</span>
                    <span className="text-xs font-semibold text-foreground uppercase">{registrant.education_level || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-primary/60 block">Kode Pendaftaran</span>
                    <span className="text-xs font-mono font-bold text-primary tracking-wider">{registrant.token || token}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {registrant && paymentDue && (
            <div className="mb-6 card-block p-6 md:p-7 border-destructive/30 bg-destructive/5">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-destructive uppercase tracking-wider">Pembayaran Fast Track Belum Lunas</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Kamu terdaftar pada jalur <strong>Fast Track</strong> namun pembayaran belum terkonfirmasi. Selesaikan pembayaran terlebih dahulu untuk dapat melanjutkan ke tahapan berikutnya.
                  </p>
                  {registrant.payment_url && (
                    <button
                      type="button"
                      onClick={() => setPayOpen(true)}
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-xs font-semibold text-white shadow-soft hover:opacity-90 transition"
                    >
                      Selesaikan Pembayaran <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {registrant?.payment_url && (
            <PaymentIframeModal
              open={payOpen}
              token={(registrant.token ?? token).trim().toUpperCase()}
              paymentUrl={registrant.payment_url}
              onClose={() => setPayOpen(false)}
              onSuccess={() => {
                setPayOpen(false);
                const t = (registrant.token ?? token).trim().toUpperCase();
                window.location.href = `/pendaftaran/sukses?token=${encodeURIComponent(t)}&kind=${kind}&name=${encodeURIComponent(registrant.full_name ?? "")}`;
              }}
            />
          )}

          {registrant && !paymentDue && !essayDone && (
            <div className="mb-6 card-block p-6 md:p-7 border-destructive/30 bg-destructive/5">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-destructive uppercase tracking-wider">Peringatan: Esai Belum Diisi</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Maaf, Anda belum bisa mengirimkan berkas administrasi. Anda wajib menyelesaikan tahap <strong>Pengiriman Esai</strong> terlebih dahulu.
                  </p>
                  <Link
                    to="/esai"
                    search={{ token: token.trim().toUpperCase() }}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-xs font-semibold text-white shadow-soft hover:opacity-90 transition"
                  >
                    Lengkapi Esai Sekarang <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          )}


          <KetentuanBerkasCard kind={kind} />

          {registrant && essayDone && (
            <div className="card-block p-6 md:p-7">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-foreground">Form Pengiriman Berkas</h2>
              </div>
              <div className="mt-5 space-y-6">
                {docs.map((d) => {
                  const v = values[d.key] ?? "";
                  const showError = d.type !== "select" && d.type !== "textarea" && v.trim().length > 0 && !isValidUrl(v);
                  
                  if (d.type === "textarea") {
                    return (
                      <label key={d.id} className="block">
                        <span className="flex items-center gap-2 flex-wrap text-xs font-medium text-foreground/80">
                          <span>
                            {d.label}
                            {d.required && <span className="text-destructive"> *</span>}
                          </span>
                          {!d.required && (
                            <span className="text-[10px] font-semibold uppercase rounded-full bg-secondary text-muted-foreground px-2 py-0.5">
                              Opsional
                            </span>
                          )}
                        </span>
                        <textarea
                          value={v}
                          onChange={(e) => setVal(d.key, e.target.value)}
                          placeholder={d.placeholder || "Tuliskan di sini..."}
                          rows={4}
                          maxLength={1500}
                          disabled={!registrant || !essayDone}
                          required={d.required}
                          className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                        <div className="mt-1 text-right text-[10px] text-muted-foreground">{v.length}/1500</div>
                      </label>
                    );
                  }

                  if (d.type === "select") {
                    return (
                      <label key={d.id} className="block">
                        <span className="flex items-center gap-2 flex-wrap text-xs font-medium text-foreground/80">
                          <span>
                            {d.label}
                            {d.required && <span className="text-destructive"> *</span>}
                          </span>
                        </span>
                        <div className="mt-1.5">
                          <select
                            value={v}
                            onChange={(e) => setVal(d.key, e.target.value)}
                            disabled={!registrant || !essayDone}
                            required={d.required}
                            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          >
                            <option value="">{d.placeholder || "Pilih salah satu"}</option>
                            {(d.options || []).map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      </label>
                    );
                  }

                  return (
                    <label key={d.id} className="block">
                      <span className="flex items-center gap-2 flex-wrap text-xs font-medium text-foreground/80">
                        <span>
                          {d.label}
                          {d.required && <span className="text-destructive"> *</span>}
                        </span>
                        {!d.required && (
                          <span className="text-[10px] font-semibold uppercase rounded-full bg-secondary text-muted-foreground px-2 py-0.5">
                            Opsional
                          </span>
                        )}
                      </span>
                      <div className="mt-1.5 relative">
                        <LinkIcon
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                          type="url"
                          value={v}
                          onChange={(e) => setVal(d.key, e.target.value)}
                          placeholder="https://drive.google.com/..."
                          disabled={!registrant || !essayDone}
                          className={`w-full rounded-xl border bg-background pl-9 pr-3.5 py-2.5 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/30 ${showError ? "border-destructive" : "border-border focus:border-primary"}`}
                          required={d.required}
                        />
                      </div>
                      {showError && (
                        <div className="mt-1 text-[11px] text-destructive">
                          URL tidak valid (gunakan http/https)
                        </div>
                      )}
                    </label>
                  );
                })}
                {docs.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Belum ada daftar berkas. Admin belum mengonfigurasi.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>




        <aside className="space-y-4 lg:sticky lg:top-24 h-fit">
          <div className="card-block p-6">
            <h3 className="font-semibold text-foreground">Catatan</h3>
            <ul className="mt-4 space-y-3 text-sm text-foreground/85">
              {[
                "Gunakan tautan publik (Google Drive/Dropbox/OneDrive)",
                "Atur izin akses ke 'Siapa saja dengan link'",
                "Pastikan tautan benar dan dapat dibuka",
                "Berkas akan diverifikasi oleh tim",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 text-primary shrink-0" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <button
            type="submit"
            disabled={submitting || !registrant || !essayDone}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95 transition disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Mengirim…
              </>
            ) : (
              <>
                Kirim Berkas <ArrowRight size={16} />
              </>
            )}
          </button>
        </aside>
      </form>
      <AdSlot placement="berkas_bottom" />
    </section>
  );
}
