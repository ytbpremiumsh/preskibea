import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Calendar, CheckCircle2, Loader2, UploadCloud, Zap, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { FormField, FormSchema } from "@/lib/form-schema";
import { STANDARD_REG_COLUMNS } from "@/lib/form-schema";
import { AdSlot } from "@/components/ads/AdSlot";
import { sendAppEmail, submitRegistrationFn } from "@/lib/api";

function f(
  name: string,
  label: string,
  type: FormField["type"],
  opts: Partial<FormField> & { standard?: boolean } = {},
): FormField {
  return { id: name, name, label, type, standard: opts.standard ?? STANDARD_REG_COLUMNS.has(name), ...opts };
}

const EDUCATION_LEVELS = ["SMP/MTs", "SMA/SMK/MA", "Mahasiswa", "Gap Year"];

const GRADE_OPTIONS: Record<string, string[]> = {
  "SMP/MTs": ["Kelas 7", "Kelas 8", "Kelas 9"],
  "SMA/SMK/MA": ["Kelas 10", "Kelas 11", "Kelas 12", "Kelas 13 (SMK 4 Tahun)"],
  Mahasiswa: Array.from({ length: 14 }, (_, i) => `Semester ${i + 1}`),
  "Gap Year": [
    "Lulusan SMP/MTs",
    "Lulusan SMA/SMK/MA",
    "Lulusan D3",
    "Lulusan S1",
    "Calon Mahasiswa Baru",
  ],
};

const BASE_FIELDS: FormField[] = [
  f("full_name", "Nama Lengkap", "text", { required: true }),
  f("email", "Email Aktif", "email", { required: true }),
  f("whatsapp", "Nomor WhatsApp", "tel", { required: true }),
  f("birth_place", "Tempat Lahir", "text", { required: true }),
  f("birth_date", "Tanggal Lahir", "date", { required: true }),
  f("gender", "Jenis Kelamin", "select", { required: true, options: ["Laki-laki", "Perempuan"] }),
  f("education_level", "Jenjang Pendidikan", "select", {
    required: true,
    options: EDUCATION_LEVELS,
  }),
  f("school_name", "Nama Sekolah / Kampus", "text", { required: true }),
  f("grade", "Kelas / Semester", "select", { required: true }),
];


const FALLBACK: Record<"prestasi" | "ekonomi" | "umum" | "yatim", FormSchema> = {
  prestasi: { fields: [...BASE_FIELDS] },
  ekonomi: {
    fields: [
      ...BASE_FIELDS,
    ],
  },
  umum: {
    fields: [...BASE_FIELDS],
  },
  yatim: {
    fields: [
      ...BASE_FIELDS,
      f("orphan_status", "Status", "select", {
        required: true,
        options: ["Yatim", "Yatim & Piatu"],
      }),
      f("guardian_name", "Nama Wali / Pengasuh", "text", { required: true }),
      f("guardian_relation", "Hubungan dengan Wali", "text", { required: true }),
    ],
  },
};

async function uploadFile(file: File, prefix: string): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("kp-uploads").upload(path, file, { upsert: false });
  if (error) throw error;
  return supabase.storage.from("kp-uploads").getPublicUrl(path).data.publicUrl;
}

function serializeError(err: unknown): string {
  if (!err) return "Terjadi kesalahan";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message || err.name || "Error";
  if (typeof err === "object") {
    const e = err as Record<string, unknown>;
    const parts = [e.message, e.error_description, e.error, e.details, e.hint, e.code].filter(
      (v) => typeof v === "string" && v.length > 0,
    );
    if (parts.length > 0) return parts.join(" — ");
    try {
      return JSON.stringify(err);
    } catch {
      return "Error";
    }
  }
  return String(err);
}

function validate(field: FormField, value: unknown): string | null {
  if (
    field.required &&
    (value === "" || value == null || (Array.isArray(value) && value.length === 0))
  ) {
    return `${field.label} wajib diisi`;
  }
  if (!value) return null;
  if (
    field.type === "email" &&
    typeof value === "string" &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  ) {
    return "Email tidak valid";
  }
  if (field.type === "tel" && typeof value === "string" && !/^[+\d\s-]{6,25}$/.test(value)) {
    return "Nomor tidak valid";
  }
  if (field.name === "nik" && typeof value === "string" && !/^\d{5,32}$/.test(value)) {
    return "NIK harus berupa angka";
  }
  return null;
}

function defaultPlaceholder(field: FormField): string {
  const n = (field.name || "").toLowerCase();
  const l = (field.label || "").toLowerCase();
  if (field.type === "email" || n.includes("email")) return "contoh: nama@email.com";
  if (field.type === "tel" || n.includes("whatsapp") || n.includes("phone") || n.includes("hp"))
    return "contoh: 0812xxxxxxxx";
  if (field.type === "date") return "";
  if (field.type === "number") return "Masukkan angka";
  if (n === "nik") return "16 digit NIK";
  if (n.includes("full_name") || l.includes("nama")) return "Masukkan nama lengkap";
  if (n.includes("birth_place") || l.includes("tempat lahir")) return "contoh: Jakarta";
  if (n.includes("address") || l.includes("alamat")) return "Tulis alamat lengkap…";
  if (n.includes("school") || l.includes("sekolah") || l.includes("kampus"))
    return "Nama sekolah / kampus";
  if (n.includes("grade") || l.includes("kelas") || l.includes("semester"))
    return "contoh: Kelas 10 / Semester 3";
  if (field.type === "select") return "Pilih salah satu";
  if (field.type === "textarea") return `Tulis ${field.label.toLowerCase()}…`;
  return `Masukkan ${field.label.toLowerCase()}`;
}

export function RegistrationForm({ 
  kind, 
  initialType = "reguler" 
}: { 
  kind: "prestasi" | "ekonomi" | "umum" | "yatim";
  initialType?: "reguler" | "fast_track";
}) {
  const navigate = useNavigate();
  const sendEmail = sendAppEmail;
  const [schema, setSchema] = useState<FormSchema>(FALLBACK[kind]);
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [registrationType, setRegistrationType] = useState<"reguler" | "fast_track">(initialType);
  const [activePaymentLink, setActivePaymentLink] = useState<string | null>(null);
  const [aulaaPaymentId, setAulaaPaymentId] = useState<string | null>(null);
  const [dokuPaymentUrl, setDokuPaymentUrl] = useState<string | null>(null);
  const [showPaymentIframe, setShowPaymentIframe] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<string>("doku");
  const [fastTrackFee, setFastTrackFee] = useState<number>(15000);
  const [submittedToken, setSubmittedToken] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<any>(null);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["mayar_fast_track_link", "payment_provider", "aulaa_config", "fast_track_fee"])
      .then(({ data }) => {
        if (!data) return;
        
        const provider = data.find(s => s.key === "payment_provider")?.value as string;
        setPaymentProvider(provider || "doku");
        const mayarLink = data.find(s => s.key === "mayar_fast_track_link")?.value as string;
        const aulaa = data.find(s => s.key === "aulaa_config")?.value as any;
        const fee = data.find(s => s.key === "fast_track_fee")?.value;

        if (fee) setFastTrackFee(Number(fee));

        if (provider === "aulaa" && aulaa?.project_id) {
          // Fallback if Edge Function doesn't return URL
          // But usually we prefer the dynamic one from submitRegistrationFn
          setActivePaymentLink(null); 
        } else if (mayarLink) {
          setActivePaymentLink(mayarLink);
        }
      });
  }, []);


  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "timeline")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value && Array.isArray(data.value)) {
          const stages = data.value as any[];
          const regStage = stages.find((s) => s.title.toLowerCase().includes("pendaftaran"));
          if (regStage?.date) {
            const deadline = new Date(regStage.date).getTime() + 24 * 60 * 60 * 1000 - 1;
            if (new Date().getTime() > deadline) {
              setIsExpired(true);
            }
          }
        }
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", `form_pendaftaran_${kind}`)
          .maybeSingle();
        if (cancelled) return;
        if (error) console.error("load form schema error", error);
        if (data?.value && Array.isArray((data.value as FormSchema).fields)) {
          const raw = data.value as FormSchema;
          const fields = raw.fields.filter((f) => {
            if (f.type === "file") return false;
            if (f.name === "nik") return false;
            const n = (f.name || "").toLowerCase();
            const l = (f.label || "").toLowerCase();
            if (n.includes("prestasi") || l.includes("prestasi utama")) return false;
            if (kind === "ekonomi" && (n === "parent_income" || n === "dependents")) return false;
            return true;
          });
          if (fields.length > 0) setSchema({ ...raw, fields });
        }
      } catch (err) {
        console.error("load form schema exception", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind]);

  const kindLabel =
    kind === "prestasi"
      ? "Beasiswa Prestasi"
      : kind === "ekonomi"
        ? "Beasiswa Ekonomi"
        : kind === "umum"
          ? "Beasiswa Umum"
          : "Beasiswa Yatim";
  const title = `Pendaftaran ${kindLabel}`;

  const setVal = (name: string, v: string) => {
    setValues((s) => {
      const next = { ...s, [name]: v };
      if (name === "education_level") next.grade = "";
      return next;
    });

    if (name === "orphan_status" && kind === "yatim") {
      if (v && !["Yatim", "Yatim & Piatu"].includes(v)) {
        toast.error("Beasiswa Yatim hanya tersedia untuk status Yatim atau Yatim & Piatu");
      }
    }
  };
  const setFile = (name: string, f: File | null) => setFiles((s) => ({ ...s, [name]: f }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    for (const f of schema.fields) {
      if (f.type === "file") {
        if (f.required && !files[f.name]) newErrors[f.name] = `${f.label} wajib diisi`;
        const file = files[f.name];
        if (file && f.maxSize && file.size > f.maxSize * 1024 * 1024) {
          newErrors[f.name] = `Ukuran maksimum ${f.maxSize}MB`;
        }
        continue;
      }
      const err = validate(f, values[f.name] ?? "");
      if (err) newErrors[f.name] = err;
    }
    if (kind === "yatim") {
      const st = (values.orphan_status ?? "").trim();
      if (!["Yatim", "Yatim & Piatu"].includes(st)) {
        newErrors.orphan_status = "Beasiswa Yatim hanya untuk status Yatim atau Yatim & Piatu";
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Periksa kembali isian formulir");
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      // Upload files
      const fileUrls: Record<string, string> = {};
      for (const f of schema.fields) {
        if (f.type !== "file") continue;
        const file = files[f.name];
        if (!file) continue;
        
        toast.info(`Mengunggah ${f.label}...`, { duration: 2000 });
        fileUrls[f.name] = await uploadFile(file, `${kind}/${f.name}`);
      }

      // Build payload mapping standard names to columns; rest into extra
      const payload: Record<string, unknown> = { 
        kind, 
        status: registrationType === "fast_track" ? "pending" : "approved",
        fast_track: registrationType === "fast_track",
        payment_url: null,
        payment_status: registrationType === "fast_track" ? "pending" : "paid"
      };
      const extra: Record<string, unknown> = {};
      for (const f of schema.fields) {
        const isFile = f.type === "file";
        const v = isFile ? (fileUrls[f.name] ?? null) : (values[f.name] ?? "");
        if (f.standard && STANDARD_REG_COLUMNS.has(f.name)) {
          if (f.name === "dependents") payload[f.name] = v ? Number(v) : null;
          else payload[f.name] = v || null;
        } else {
          extra[f.name] = v;
        }
      }
      // Required-by-DB fallbacks (NOT NULL columns)
      for (const k of [
        "full_name",
        "birth_place",
        "birth_date",
        "gender",
        "whatsapp",
        "email",
        "education_level",
        "school_name",
        "grade",
      ]) {
        if (payload[k] == null) payload[k] = "";
      }
      if (payload.address == null) payload.address = "-";
      payload.extra = extra;

      console.log("Submitting registration payload:", payload);
      const res = await submitRegistrationFn({ data: payload as any });
      const token = res?.token;
      const invoiceUrl = (res as any)?.invoice_url;
      const paymentId = (res as any)?.aulaa_payment_id || (payload.extra as any)?.aulaa_payment_id;
      
      setSubmittedToken(token);
      setSubmittedData(payload);
      
      console.log("Registration submitted, token:", token, "invoice:", invoiceUrl, "paymentId:", paymentId);

      // Fire-and-forget WA notification (include token)
      try {
        supabase.functions
          .invoke("send-whatsapp", {
            body: {
              type: "pendaftaran",
              full_name: String(payload.full_name ?? ""),
              email: String(payload.email ?? ""),
              whatsapp: String(payload.whatsapp ?? ""),
              kind,
              token,
            },
          })
          .catch(() => {
            /* ignore */
          });
      } catch {
        /* ignore */
      }

      // Fire-and-forget email confirmation with token
      try {
        const emailAddr = String(payload.email ?? "").trim();
        if (emailAddr && emailAddr.includes("@") && token) {
          sendEmail({
            data: {
              templateName: "registration-confirmation",
              recipientEmail: emailAddr,
              idempotencyKey: `reg-${token}`,
              templateData: {
                fullName: String(payload.full_name ?? ""),
                token,
                kind,
                whatsapp: String(payload.whatsapp ?? ""),
              },
            },
          }).catch(() => {
            /* ignore */
          });
        }
      } catch {
        /* ignore */
      }

      toast.success("Pendaftaran berhasil dikirim!");
      
      // If fast track, handle payment
      if (registrationType === "fast_track") {
        // Provider yang dipakai server adalah sumber kebenaran (penting saat deploy di VPS)
        const activeProviderResp = String((res as any)?.provider || paymentProvider || "doku").toLowerCase();

        if (activeProviderResp === "aulaa") {
          if (paymentId) {
            setAulaaPaymentId(paymentId);
            setShowPaymentIframe(true);
          } else if (invoiceUrl) {
            setDokuPaymentUrl(invoiceUrl);
            setShowPaymentIframe(true);
          } else {
            toast.error("Pembayaran Aulaa.co belum dapat dibuat. Periksa konfigurasi Aulaa di dashboard admin.");
            setSubmitting(false);
          }
          return;
        }

        if (activeProviderResp === "doku") {
          if (invoiceUrl) {
            setDokuPaymentUrl(invoiceUrl);
            setShowPaymentIframe(true);
          } else {
            toast.error(
              "Pembayaran Doku belum dapat dibuat. Periksa kembali Client ID & Secret Key Doku di dashboard admin.",
            );
            setSubmitting(false);
          }
          return;
        }

        // Provider lain (Mayar) — pakai invoice dari server, fallback link statis hanya untuk Mayar
        const finalRedirectUrl = invoiceUrl || (activeProviderResp === "mayar" ? activePaymentLink : null);
        if (finalRedirectUrl) {
          toast.info("Mengarahkan ke pembayaran...");
          setTimeout(() => {
            window.location.assign(finalRedirectUrl);
          }, 800);
          return;
        }

        toast.error("Gagal membuat link pembayaran. Silakan hubungi admin.");
        setSubmitting(false);
        return;
      }

      setValues({});
      setFiles({});
      
      handleSuccessRedirect(payload, token);
    } catch (err) {
      console.error("registration submit error", err);
      const msg = serializeError(err);
      toast.error(`Gagal mengirim pendaftaran: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessRedirect = (payload: any, token: string) => {
    try {
      navigate({
        to: "/pendaftaran/sukses",
        search: {
          name: String(payload.full_name ?? ""),
          email: String(payload.email ?? ""),
          whatsapp: String(payload.whatsapp ?? ""),
          kind,
          token,
        },
      });
    } catch (navErr) {
      console.error("navigate error", navErr);
      if (typeof window !== "undefined") {
        const params = new URLSearchParams({
          name: String(payload.full_name ?? ""),
          email: String(payload.email ?? ""),
          whatsapp: String(payload.whatsapp ?? ""),
          kind,
          token,
        });
        window.location.href = `/pendaftaran/sukses?${params.toString()}`;
      }
    }
  };

  // Polling for payment status (Aulaa/Doku) — auto close popup + redirect on success
  useEffect(() => {
    if (!showPaymentIframe || !submittedToken) return;

    let stopped = false;
    let attempts = 0;

    const finish = () => {
      if (stopped) return;
      stopped = true;
      toast.success("Pembayaran berhasil diverifikasi!");
      setShowPaymentIframe(false);
      setDokuPaymentUrl(null);
      setAulaaPaymentId(null);
      setValues({});
      setFiles({});
      handleSuccessRedirect(submittedData, submittedToken);
    };

    const check = async () => {
      if (stopped) return;
      attempts += 1;

      // 1) Cek status di database (diisi oleh webhook)
      const { data } = await supabase
        .from("registrations")
        .select("payment_status")
        .eq("token", submittedToken)
        .maybeSingle();

      if (data?.payment_status === "paid") return finish();

      // 2) Fallback: tanya langsung ke payment gateway setiap ~6 detik
      if (attempts % 2 === 0) {
        try {
          const { data: res } = await supabase.functions.invoke("check-payment-status", {
            body: { token: submittedToken },
          });
          if ((res as any)?.status === "paid") return finish();
        } catch {
          /* ignore */
        }
      }
    };

    const interval = setInterval(check, 3000);
    check();

    // 3) Jika halaman pembayaran mengirim pesan sukses dari iframe
    const onMessage = (ev: MessageEvent) => {
      const raw = typeof ev.data === "string" ? ev.data : JSON.stringify(ev.data ?? "");
      if (/success|settlement|paid/i.test(raw)) check();
    };
    window.addEventListener("message", onMessage);

    return () => {
      stopped = true;
      clearInterval(interval);
      window.removeEventListener("message", onMessage);
    };
  }, [showPaymentIframe, submittedToken, submittedData]);


  const grouped = useMemo(() => {
    const level = values["education_level"] ?? "";
    const decorate = (f: FormField): FormField => {
      if (f.name === "education_level") {
        return { ...f, type: "select", options: EDUCATION_LEVELS };
      }
      if (f.name === "grade") {
        return {
          ...f,
          type: "select",
          label: level === "Mahasiswa" ? "Semester" : "Kelas / Semester",
          options: GRADE_OPTIONS[level] ?? [],
        };
      }
      return f;
    };
    const fields = schema.fields.map(decorate);
    const fileFields = fields.filter((f) => f.type === "file");
    const requiredDataFields = fields.filter((f) => f.type !== "file" && f.required);
    const optionalDataFields = fields.filter((f) => f.type !== "file" && !f.required);
    return { requiredDataFields, optionalDataFields, fileFields };
  }, [schema, values]);


  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="container-page py-24 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-6">
          <Calendar size={32} />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground">Pendaftaran Ditutup</h1>
        <p className="mt-4 text-muted-foreground max-w-md mx-auto">
          Mohon maaf, periode pendaftaran {kindLabel} telah berakhir pada 7 Februari 2027.
          Pantau terus media sosial kami untuk informasi Batch selanjutnya.
        </p>
        <Link to="/" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <>
      <section
        className="relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="container-page py-12 md:py-16">
          <Link to="/" className="text-xs font-semibold text-primary hover:underline">
            ← Kembali ke Beranda
          </Link>
          <div className="mt-4 max-w-3xl">
            <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              {kindLabel}
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-foreground">{title}</h1>
            <p className="mt-2 text-muted-foreground">
              Lengkapi formulir di bawah ini. Pastikan seluruh data benar sebelum dikirim.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-10 md:py-12">
        <div className="mb-8 overflow-hidden rounded-3xl border border-border shadow-card md:hidden">
          <img
            src="https://ltmfvbcazebowndigkyi.supabase.co/storage/v1/object/public/admin-media/1778938796974-Header-Kejar-Prestasi--3.jpg"
            alt={title}
            loading="lazy"
            className="w-full h-auto object-cover"
          />
        </div>
        <AdSlot placement="form_top" />

      <form onSubmit={handleSubmit} className="mt-10 max-w-4xl mx-auto">
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-primary-soft/30 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${registrationType === "fast_track" ? "bg-[var(--gold)]/20 text-[var(--gold)]" : "bg-primary/20 text-primary"}`}>
                {registrationType === "fast_track" ? <Zap size={20} /> : <Clock size={20} />}
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tipe Pendaftaran</div>
                <div className="text-lg font-black text-foreground uppercase tracking-tight">
                  {registrationType === "fast_track" ? "Fast Track" : "Reguler"}
                </div>
              </div>
            </div>
            
            <Link 
              to="/pendaftaran/pilih-tipe" 
              search={{ kind }}
              className="text-xs font-bold text-primary hover:underline px-4 py-2 bg-white rounded-full border border-primary/10 shadow-sm"
            >
              Ganti Tipe
            </Link>
          </div>


          <Card title="Informasi Pribadi">
            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-3">
              {grouped.requiredDataFields.slice(0, 5).map((f) => (
                <FieldRenderer
                  key={f.id}
                  field={f}
                  value={values[f.name] ?? ""}
                  error={errors[f.name]}
                  onChange={(v) => setVal(f.name, v)}
                  fullWidth={f.type === "textarea" || f.name === "address" || f.name === "email"}
                />
              ))}
            </div>
          </Card>

          <Card title="Informasi Pendidikan">
            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-3">
              {grouped.requiredDataFields.slice(5).map((f) => (
                <FieldRenderer
                  key={f.id}
                  field={f}
                  value={values[f.name] ?? ""}
                  error={errors[f.name]}
                  onChange={(v) => setVal(f.name, v)}
                  fullWidth={f.type === "textarea" || f.name === "address" || f.name === "email"}
                />
              ))}
            </div>
          </Card>

          {grouped.optionalDataFields.length > 0 && (
            <Card title="Informasi Tambahan (Opsional)">
              <div className="grid sm:grid-cols-2 gap-4">
                {grouped.optionalDataFields.map((f) => (
                  <FieldRenderer
                    key={f.id}
                    field={f}
                    value={values[f.name] ?? ""}
                    error={errors[f.name]}
                    onChange={(v) => setVal(f.name, v)}
                    fullWidth={f.type === "textarea" || f.name === "address" || f.name === "email"}
                  />
                ))}
              </div>
            </Card>
          )}

          {grouped.fileFields.length > 0 && (
            <Card title="Unggah Berkas">
              <div className="grid sm:grid-cols-2 gap-4">
                {grouped.fileFields.map((f) => (
                  <FileFieldRenderer
                    key={f.id}
                    field={f}
                    file={files[f.name] ?? null}
                    onChange={(file) => setFile(f.name, file)}
                    error={errors[f.name]}
                  />
                ))}
              </div>
            </Card>
          )}

          <div className="space-y-4">
            <div className="card-block p-5">
              <h3 className="font-semibold text-foreground">Sebelum mengirim</h3>
              <ul className="mt-3 space-y-2 text-xs text-foreground/85">
                {[
                  "Pastikan data pribadi sesuai Kartu Pelajar / Kartu Mahasiswa",
                  "Email & WhatsApp aktif",
                  "Tidak dipungut biaya apapun (Kecuali Jalur Fast Track)",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="mt-0.5 text-primary shrink-0" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95 transition disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Mengirim…
                </>
              ) : (
                <>
                  Kirim Pendaftaran <ArrowRight size={16} />
                </>
              )}
            </button>
            <p className="text-[11px] text-muted-foreground text-center">
              Pastikan seluruh data sudah benar sebelum mengirim.
            </p>
          </div>
        </div>
      </form>
      <AdSlot placement="form_bottom" />
    </section>

    {showPaymentIframe && (aulaaPaymentId || dokuPaymentUrl) && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
          <div className="p-4 border-b flex items-center justify-between bg-white shrink-0">
            <div>
              <h3 className="font-bold text-foreground">Konfirmasi Pembayaran</h3>
              {paymentProvider === "doku" && (
                <p className="text-[10px] text-primary font-bold uppercase tracking-wider">
                  Gunakan QRIS , jangan gunakan VA
                </p>
              )}
            </div>
            <button 
              onClick={() => setShowPaymentIframe(false)}
              className="p-2 hover:bg-muted rounded-full transition"
            >
              ✕
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {paymentProvider === "doku" && dokuPaymentUrl ? (
              <div className="w-full h-[600px] min-h-[50vh]">
                <iframe 
                  src={dokuPaymentUrl}
                  className="w-full h-full border-0"
                  title="Doku Payment"
                  allow="payment"
                />
              </div>
            ) : (
              <div className="p-8 text-center space-y-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <UploadCloud size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-foreground">Selesaikan Pembayaran</h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Klik tombol di bawah untuk membuka halaman pembayaran. 
                    Sistem akan otomatis mendeteksi ketika pembayaran Anda berhasil.
                  </p>
                </div>
                
                <a 
                  href={paymentProvider === "aulaa" ? `https://payment.aulaa.co/pay/${aulaaPaymentId}` : dokuPaymentUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-base font-bold text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  Bayar Sekarang
                </a>

                <div className="p-4 rounded-2xl bg-primary/5">
                  <p className="text-xs text-primary font-medium">
                    Jangan tutup halaman ini setelah membayar. Tunggu beberapa saat hingga sistem memverifikasi pembayaran Anda secara otomatis.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t p-3 text-center text-[11px] font-semibold text-muted-foreground shrink-0">
            <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse mr-2 align-middle" />
            Menunggu pembayaran… pop-up akan tertutup otomatis dan Anda diarahkan ke halaman sukses beserta kode pendaftaran.
          </div>
        </div>
      </div>
    )}

    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-block p-5 md:p-6">
      <h2 className="text-sm font-bold text-foreground border-l-4 border-primary pl-3">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
  error,
  fullWidth,
}: {
  field: FormField;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  fullWidth?: boolean;
}) {
  const cls = `w-full rounded-xl border bg-background px-3.5 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/30 ${error ? "border-destructive" : "border-border focus:border-primary"}`;
  const ph = field.placeholder || defaultPlaceholder(field);

  return (
    <label className={`block ${fullWidth ? "sm:col-span-2" : ""}`}>
      <span className="text-[11px] font-semibold text-foreground/70 uppercase tracking-tight">
        {field.label}
        {field.required && <span className="text-destructive ml-0.5">*</span>}
      </span>
      <div className="mt-1">
        {field.type === "textarea" ? (
          <textarea
            rows={2}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={ph}
            className={cls}
          />
        ) : field.type === "select" ? (
          <select value={value} onChange={(e) => onChange(e.target.value)} className={`${cls} appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10`}>
            <option value="">Pilih…</option>
            {(field.options ?? []).map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={
              field.type === "number"
                ? "number"
                : field.type === "date"
                  ? "date"
                  : field.type === "email"
                    ? "email"
                    : field.type === "tel"
                      ? "tel"
                      : "text"
            }
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={ph}
            className={cls}
          />
        )}
      </div>
      {error && <span className="mt-1 block text-[11px] text-destructive">{error}</span>}
    </label>
  );
}

function FileFieldRenderer({
  field,
  file,
  onChange,
  error,
}: {
  field: FormField;
  file: File | null;
  onChange: (f: File | null) => void;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-foreground/70 uppercase tracking-tight">
        {field.label}
        {field.required && <span className="text-destructive ml-0.5">*</span>}
      </span>
      <div
        className={`mt-1 flex items-center gap-3 rounded-xl border border-dashed bg-background px-3.5 py-2.5 hover:border-primary transition cursor-pointer ${error ? "border-destructive" : "border-border"}`}
      >
        <UploadCloud size={18} className="text-primary shrink-0" />
        <input
          type="file"
          accept={field.accept}
          className="text-xs text-foreground/80 file:mr-3 file:rounded-full file:border-0 file:bg-primary-soft file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </div>
      {file && (
        <span className="mt-1 block text-[11px] text-muted-foreground">
          {file.name} · {(file.size / 1024 / 1024).toFixed(2)}MB
        </span>
      )}
      {error && <span className="mt-1 block text-[11px] text-destructive">{error}</span>}
    </label>
  );
}
