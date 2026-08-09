import { useEffect, useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
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
    { id: "achievement_certs", key: "achievement_certs", label: "Sertifikat Prestasi (Akademik/Non-Akademik)", required: true },
    { id: "org_certs", key: "org_certs", label: "Sertifikat Organisasi/Kepanitiaan", required: false },
    { id: "essay", key: "essay", label: "Esai: 'Kontribusiku untuk Indonesia Melalui Prestasi'", required: true },
    { id: "cv", key: "cv", label: "Curriculum Vitae (CV) Kreatif", required: true },
  ],
  ekonomi: [
    { id: "identity", key: "identity", label: "Kartu Pelajar / Kartu Mahasiswa", required: true },
    { id: "income_statement", key: "income_statement", label: "Surat Keterangan Penghasilan Orang Tua / Slip Gaji", required: true },
    { id: "sktm", key: "sktm", label: "Surat Keterangan Tidak Mampu (SKTM)", required: true },
    { id: "house_photos", key: "house_photos", label: "Foto Rumah (Tampak Depan & Ruang Tamu)", required: true },
    { id: "utility_bill", key: "utility_bill", label: "Bukti Pembayaran Listrik/PBB", required: true },
    { id: "essay", key: "essay", label: "Esai: 'Pentingnya Pendidikan untuk Merubah Ekonomi Keluarga'", required: true },
  ],
  umum: [
    { id: "identity", key: "identity", label: "Kartu Pelajar / Kartu Mahasiswa", required: true },
    { id: "transcript", key: "transcript", label: "Rapor / Transkrip Nilai Terakhir", required: true },
    { id: "essay", key: "essay", label: "Esai: 'Peranku dalam Memajukan Pendidikan di Lingkungan Sekitar'", required: true },
    { id: "supporting", key: "supporting", label: "Sertifikat Pendukung Lainnya", required: false },
  ],
  yatim: [
    { id: "identity", key: "identity", label: "Kartu Pelajar / Kartu Mahasiswa", required: true },
    { id: "orphan_letter", key: "orphan_letter", label: "Surat Keterangan Yatim / Piatu / Yatim Piatu", required: true },
    { id: "death_cert", key: "death_cert", label: "Akta Kematian Orang Tua", required: true },
    { id: "family_card", key: "family_card", label: "Kartu Keluarga (KK)", required: true },
    { id: "essay", key: "essay", label: "Esai: 'Harapanku untuk Masa Depan Melalui Pendidikan'", required: true },
    { id: "supporting", key: "supporting", label: "Sertifikat Pendukung Lainnya", required: false },
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
  essay_submitted?: boolean | null;
};

const tokenPrefix = (k: "prestasi" | "ekonomi" | "umum" | "yatim") =>
  k === "prestasi" ? "PK-PRE-" : k === "ekonomi" ? "PK-EKO-" : k === "yatim" ? "PK-YAT-" : "PK-UMU-";

export function BerkasPage({ kind }: { kind: "prestasi" | "ekonomi" | "umum" | "yatim" }) {
  const navigate = useNavigate();
  const submitBerkas = submitBerkasDocuments;
  const sendEmail = sendAppEmail;
  const search = useSearch({ strict: false }) as { token?: string };
  const [token, setToken] = useState((search.token ?? "").toUpperCase());
  const [docs, setDocs] = useState<DocSlot[]>(defaultDocs[kind]);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [registrant, setRegistrant] = useState<RegInfo | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const isFastTrack = !!registrant?.fast_track;
  const essayDone = isFastTrack || !!registrant?.essay_submitted;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setDocs(defaultDocs[kind]);
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

  // Auto-verify if token came from URL
  useEffect(() => {
    if (search.token && !registrant && !verifying) {
      handleVerify(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.token, kind]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrant) {
      toast.error("Verifikasi kode pendaftar terlebih dahulu");
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
          Masukkan tautan (URL) berkas-berkas pendukung sesuai persyaratan. Pastikan dokumen dapat
          diakses (Google Drive, Dropbox, dsb. — atur izin "Siapa saja dengan link").
        </p>
      </div>

      <AdSlot placement="berkas_top" />

      <form onSubmit={handleSubmit} className="mt-10 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-block p-6 md:p-7">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <KeyRound size={16} className="text-primary" /> Verifikasi Kode Pendaftar
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Masukkan kode pendaftar (format{" "}
              <span className="font-mono font-semibold">{tokenPrefix(kind)}XXXXXX</span>) yang Anda
              terima saat mendaftar (lihat WhatsApp atau halaman sukses).
            </p>
            <div className="mt-5 grid sm:grid-cols-[1fr_auto] gap-3 items-end">
              <label className="block">
                <span className="text-xs font-medium text-foreground/80">
                  Kode Pendaftar<span className="text-destructive"> *</span>
                </span>
                <div className="mt-1.5 relative">
                  <KeyRound
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => {
                      setToken(e.target.value.toUpperCase());
                      setRegistrant(null);
                      setSearchError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleVerify();
                      }
                    }}
                    placeholder={`${tokenPrefix(kind)}XXXXXX`}
                    maxLength={20}
                    autoCapitalize="characters"
                    className="w-full rounded-xl border border-border bg-background pl-9 pr-3.5 py-2.5 text-sm font-mono tracking-wider text-foreground outline-none transition focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    required
                  />
                </div>
              </label>
              <button
                type="button"
                onClick={() => handleVerify()}
                disabled={verifying}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 transition disabled:opacity-60"
              >
                {verifying ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <KeyRound size={14} />
                )}
                Verifikasi
              </button>
            </div>

            {searchError && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <div>
                  {searchError}{" "}
                  <Link
                    to={kind === "prestasi" ? "/pendaftaran/prestasi" : kind === "ekonomi" ? "/pendaftaran/ekonomi" : kind === "yatim" ? "/pendaftaran/yatim" : "/pendaftaran/umum"}
                    className="font-semibold underline"
                  >
                    Daftar dulu
                  </Link>
                </div>
              </div>
            )}

            {registrant && (
              <div className="mt-5 rounded-2xl border border-primary/30 bg-primary-soft/40 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <UserCheck size={14} /> Data ditemukan
                </div>
                <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Nama Lengkap
                    </div>
                    <div className="font-semibold text-foreground">{registrant.full_name}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      WhatsApp
                    </div>
                    <div className="font-semibold text-foreground">
                      {registrant.whatsapp || "-"}
                    </div>
                  </div>
                  {registrant.gender && (
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Jenis Kelamin
                      </div>
                      <div className="font-semibold text-foreground">{registrant.gender}</div>
                    </div>
                  )}
                  {(registrant.birth_place || registrant.birth_date) && (
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Tempat / Tanggal Lahir
                      </div>
                      <div className="font-semibold text-foreground">
                        {[registrant.birth_place, registrant.birth_date].filter(Boolean).join(", ")}
                      </div>
                    </div>
                  )}
                  {registrant.school_name && (
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Sekolah / Kampus
                      </div>
                      <div className="font-semibold text-foreground">{registrant.school_name}</div>
                    </div>
                  )}
                  {registrant.education_level && (
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Jenjang
                      </div>
                      <div className="font-semibold text-foreground">
                        {registrant.education_level}
                      </div>
                    </div>
                  )}
                  {registrant.grade && (
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Kelas / Tingkat
                      </div>
                      <div className="font-semibold text-foreground">{registrant.grade}</div>
                    </div>
                  )}
                  {registrant.address && (
                    <div className="sm:col-span-2">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Alamat
                      </div>
                      <div className="font-semibold text-foreground">{registrant.address}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <KetentuanBerkasCard kind={kind} />

          <div
            className={`card-block p-6 md:p-7 ${!registrant ? "opacity-60 pointer-events-none select-none" : ""}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-foreground">Tautan Berkas</h2>
              {!registrant && (
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Verifikasi kode dulu
                </span>
              )}
            </div>
            <div className="mt-5 space-y-6">
              {docs.map((d) => {
                const v = values[d.key] ?? "";
                const showError = v.trim().length > 0 && !isValidUrl(v);
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
                        disabled={!registrant}
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
        </div>

        {registrant && (
          <div className="lg:col-span-2 card-block p-6 md:p-7">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <UserCheck size={16} className="text-primary" /> Esai Singkat (Wajib)
            </h2>
            {isFastTrack ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-primary/30 bg-primary-soft/40 p-4 text-sm text-foreground">
                <CheckCircle2 size={16} className="mt-0.5 text-primary shrink-0" />
                <div>
                  <span className="font-semibold">Kamu jalur Fast Track — esai otomatis lolos.</span>
                  <div className="text-xs text-muted-foreground mt-1">
                    Tidak perlu mengisi esai singkat. Silakan langsung lengkapi berkas di bawah.
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="mt-1 text-xs text-muted-foreground">
                  Jawab 3 pertanyaan berikut dengan jujur dan singkat (minimal {MIN_ESSAY_CHARS} karakter per jawaban).
                </p>
                <div className="mt-5 space-y-5">
                  {ESSAY_QUESTIONS.map((q, i) => {
                    const val = essays[i];
                    const len = val.trim().length;
                    return (
                      <label key={q} className="block">
                        <span className="text-xs font-medium text-foreground/80">
                          {i + 1}. {q}<span className="text-destructive"> *</span>
                        </span>
                        <textarea
                          value={val}
                          onChange={(e) =>
                            setEssays((s) => s.map((v, idx) => (idx === i ? e.target.value : v)))
                          }
                          rows={4}
                          maxLength={3000}
                          placeholder="Tulis jawabanmu di sini…"
                          className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                        <div className={`mt-1 text-[11px] ${len < MIN_ESSAY_CHARS ? "text-muted-foreground" : "text-primary"}`}>
                          {len}/{MIN_ESSAY_CHARS} karakter minimum
                        </div>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

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
            disabled={submitting || !registrant}
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
