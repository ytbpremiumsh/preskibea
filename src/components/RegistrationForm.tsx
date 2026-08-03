import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { FormField, FormSchema } from "@/lib/form-schema";
import { STANDARD_REG_COLUMNS } from "@/lib/form-schema";
import { AdSlot } from "@/components/ads/AdSlot";
import { sendAppEmail, submitRegistrationFn } from "@/lib/api";

const FALLBACK: Record<"prestasi" | "ekonomi", FormSchema> = {
  prestasi: { fields: [] },
  ekonomi: { fields: [] },
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

export function RegistrationForm({ kind }: { kind: "prestasi" | "ekonomi" }) {
  const navigate = useNavigate();
  const sendEmail = sendAppEmail;
  const [schema, setSchema] = useState<FormSchema>(FALLBACK[kind]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});

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
          const filtered: FormSchema = {
            ...raw,
            fields: raw.fields.filter((f) => {
              if (f.type === "file") return false;
              if (f.name === "nik") return false;
              const n = (f.name || "").toLowerCase();
              const l = (f.label || "").toLowerCase();
              if (n.includes("prestasi") || l.includes("prestasi utama")) return false;
              return true;
            }),
          };
          setSchema(filtered);
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

  const isPrestasi = kind === "prestasi";
  const title = isPrestasi ? "Pendaftaran Beasiswa Prestasi" : "Pendaftaran Beasiswa Ekonomi";

  const setVal = (name: string, v: string) => setValues((s) => ({ ...s, [name]: v }));
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
        fileUrls[f.name] = await uploadFile(file, `${kind}/${f.name}`);
      }

      // Build payload mapping standard names to columns; rest into extra
      const payload: Record<string, unknown> = { kind, status: "approved" };
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
        "address",
        "whatsapp",
        "email",
        "education_level",
        "school_name",
        "grade",
      ]) {
        if (payload[k] == null) payload[k] = "";
      }
      payload.extra = extra;

      const { token } = await submitRegistrationFn({ data: payload as never });

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
      setValues({});
      setFiles({});
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
        // Fallback hard navigation if router rejects
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
    } catch (err) {
      console.error("registration submit error", err);
      const msg = serializeError(err);
      toast.error(`Gagal mengirim pendaftaran: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const grouped = useMemo(() => {
    const fileFields = schema.fields.filter((f) => f.type === "file");
    const dataFields = schema.fields.filter((f) => f.type !== "file");
    return { dataFields, fileFields };
  }, [schema]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
              {isPrestasi ? "Beasiswa Prestasi" : "Beasiswa Ekonomi"}
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
            src="https://zmlwicrlcuqgxfaskxic.supabase.co/storage/v1/object/public/admin-media/1778938796974-Header-Kejar-Prestasi--3.jpg"
            alt={title}
            loading="lazy"
            className="w-full h-auto object-cover"
          />
        </div>
        <AdSlot placement="form_top" />

      <form onSubmit={handleSubmit} className="mt-10 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Formulir Pendaftaran">
            <div className="grid sm:grid-cols-2 gap-4">
              {grouped.dataFields.map((f) => (
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
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 h-fit">
          <div className="card-block p-6">
            <h3 className="font-semibold text-foreground">Sebelum mengirim</h3>
            <ul className="mt-4 space-y-3 text-sm text-foreground/85">
              {[
                "Pastikan data pribadi sesuai Kartu Pelajar / Kartu Mahasiswa",
                "Email & WhatsApp aktif",
                "Tidak dipungut biaya apapun",
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
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95 transition disabled:opacity-60"
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
        </aside>
      </form>
      <AdSlot placement="form_bottom" />
    </section>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-block p-6 md:p-7">
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      <div className="mt-5">{children}</div>
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
  const cls = `w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/30 ${error ? "border-destructive" : "border-border focus:border-primary"}`;
  const ph = field.placeholder || defaultPlaceholder(field);

  return (
    <label className={`block ${fullWidth ? "sm:col-span-2" : ""}`}>
      <span className="text-xs font-medium text-foreground/80">
        {field.label}
        {field.required && <span className="text-destructive"> *</span>}
      </span>
      <div className="mt-1.5">
        {field.type === "textarea" ? (
          <textarea
            rows={3}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={ph}
            className={cls}
          />
        ) : field.type === "select" ? (
          <select value={value} onChange={(e) => onChange(e.target.value)} className={cls}>
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
      <span className="text-xs font-medium text-foreground/80">
        {field.label}
        {field.required && <span className="text-destructive"> *</span>}
      </span>
      <div
        className={`mt-1.5 flex items-center gap-3 rounded-xl border border-dashed bg-background px-3.5 py-3 hover:border-primary transition cursor-pointer ${error ? "border-destructive" : "border-border"}`}
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
