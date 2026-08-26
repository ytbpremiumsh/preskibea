import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, CheckCircle2, KeyRound, Loader2, PenLine, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { submitEsai } from "@/lib/api";
import { PaymentIframeModal } from "@/components/PaymentIframeModal";
import { toast } from "sonner";

type Search = { token?: string };

export const Route = createFileRoute("/esai")({
  head: () => ({
    meta: [
      { title: "Pengiriman Esai Singkat — Prestasi Kita Batch #8" },
      {
        name: "description",
        content:
          "Isi esai singkat sebagai syarat melanjutkan ke tahap berkas administrasi. Masukkan kode pendaftar Anda.",
      },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    token: typeof s.token === "string" ? s.token : undefined,
  }),
  component: EsaiRoute,
});

const ESSAY_QUESTIONS = [
  "Kenapa kamu layak menerima beasiswa ini?",
  "Bantuan biaya pendidikan ini akan kamu gunakan untuk apa?",
  "Apa rencana atau targetmu dalam 1 tahun ke depan setelah menerima beasiswa ini?",
];
const MIN_ESSAY_CHARS = 100;

type Kind = "prestasi" | "ekonomi" | "umum" | "yatim";

const KIND_BY_CODE: Record<string, Kind> = {
  PRE: "prestasi",
  EKO: "ekonomi",
  UMU: "umum",
  YAT: "yatim",
};

const KIND_LABEL: Record<Kind, string> = {
  prestasi: "Beasiswa Prestasi",
  ekonomi: "Beasiswa Ekonomi",
  umum: "Beasiswa Umum",
  yatim: "Beasiswa Yatim",
};

const BERKAS_TO: Record<Kind, string> = {
  prestasi: "/berkas/prestasi/upload",
  ekonomi: "/berkas/ekonomi/upload",
  umum: "/berkas/umum/upload",
  yatim: "/berkas/yatim/upload",
};

type RegInfo = {
  full_name: string;
  email?: string | null;
  education_level?: string | null;
  school_name?: string | null;
  token?: string | null;
  fast_track?: boolean | null;
  payment_status?: string | null;
  payment_url?: string | null;
  essay_submitted?: boolean | null;
};

function kindFromToken(t: string): Kind | null {
  const m = /^(?:PK|KP)-(PRE|EKO|UMU|YAT)-/.exec(t.trim().toUpperCase());
  return m ? KIND_BY_CODE[m[1]] : null;
}

function EsaiRoute() {
  const search = Route.useSearch();
  const [token, setToken] = useState((search.token ?? "").toUpperCase());
  const [verifying, setVerifying] = useState(false);
  const [registrant, setRegistrant] = useState<RegInfo | null>(null);
  const [kind, setKind] = useState<Kind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [essays, setEssays] = useState<string[]>(["", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [ann, setAnn] = useState<{ published: boolean; message?: string }>({ published: false });
  const [payOpen, setPayOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "esai_announcement")
      .maybeSingle()
      .then(({ data }) => {
        const v = (data?.value ?? {}) as { published?: boolean; message?: string };
        setAnn({ published: !!v.published, message: v.message });
      });
  }, []);

  const isFastTrack = !!registrant?.fast_track;
  const paymentDue = isFastTrack && registrant?.payment_status !== "paid";

  const paymentBlock = registrant && paymentDue && (
    <div className="card-block p-6 md:p-7 border-destructive/30 bg-destructive/5">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-destructive uppercase tracking-wider">Pembayaran Fast Track Belum Lunas</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Kamu terdaftar pada jalur <strong>Fast Track</strong> namun pembayaran belum terkonfirmasi. Selesaikan pembayaran terlebih dahulu untuk melanjutkan ke tahapan Esai dan Berkas.
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
  );

  const paymentModal = registrant?.payment_url ? (
    <PaymentIframeModal
      renewOnOpen
      open={payOpen}
      token={(registrant.token ?? token).trim().toUpperCase()}
      paymentUrl={registrant.payment_url}
      onClose={() => setPayOpen(false)}
      onSuccess={() => {
        setPayOpen(false);
        const t = (registrant.token ?? token).trim().toUpperCase();
        window.location.href = `/pendaftaran/sukses?token=${encodeURIComponent(t)}${kind ? `&kind=${kind}` : ""}&name=${encodeURIComponent(registrant.full_name ?? "")}`;
      }}
    />
  ) : null;

  const handleVerify = async (silent = false) => {
    const t = token.trim().toUpperCase();
    if (!t) {
      if (!silent) toast.error("Masukkan kode pendaftar Anda");
      return;
    }
    const k = kindFromToken(t);
    if (!k) {
      setError("Format kode tidak valid. Contoh: PK-PRE-XXXXXX");
      return;
    }
    setVerifying(true);
    setError(null);
    setRegistrant(null);
    setDone(false);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("lookup-pendaftar", {
        body: { token: t, kind: k },
      });
      if (fnErr) throw fnErr;
      const payload = data as { ok: boolean; data?: RegInfo; error?: string };
      if (!payload?.ok || !payload.data) {
        setError(
          payload?.error === "not_found"
            ? "Kode tidak ditemukan. Periksa kembali kode dari WhatsApp / halaman sukses pendaftaran kamu."
            : "Gagal memverifikasi kode.",
        );
        return;
      }
      setKind(k);
      setRegistrant(payload.data);
      if (payload.data.essay_submitted) setDone(true);
      if (!silent) toast.success(`Selamat datang, ${payload.data.full_name}`);
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat memverifikasi kode.");
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (search.token && !registrant && !verifying) handleVerify(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.token]);

  if (!registrant) {
    return (
      <section className="container-page py-12 md:py-16 flex flex-col items-center">
        <div className="w-full max-w-xl">
          <Link to="/" className="text-xs font-semibold text-primary hover:underline">
            ← Kembali ke Beranda
          </Link>
          <div className="mt-4">
            <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              Tahap 3 — Pengiriman Esai
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-foreground">Verifikasi Esai</h1>
            <p className="mt-2 text-muted-foreground">
              Masukkan kode pendaftar kamu untuk melanjutkan ke tahap Pengiriman Esai.
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
                      setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleVerify();
                      }
                    }}
                    placeholder="PK-PRE-XXXXXX"
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
            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <div>{error}</div>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrant || !kind) {
      toast.error("Verifikasi kode pendaftar terlebih dahulu");
      return;
    }
    const kurang = essays.findIndex((a) => a.trim().length < MIN_ESSAY_CHARS);
    if (kurang !== -1) {
      toast.error(`Esai No. ${kurang + 1} minimal ${MIN_ESSAY_CHARS} karakter`);
      return;
    }
    setSubmitting(true);
    try {
      await submitEsai({
        token: token.trim().toUpperCase(),
        kind,
        essays: ESSAY_QUESTIONS.map((q, i) => ({ question: q, answer: essays[i].trim() })),
      });
      toast.success("Esai berhasil dikirim!");
      setDone(true);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Gagal mengirim esai");
    } finally {
      setSubmitting(false);
    }
  };

  const berkasLink = kind ? `${BERKAS_TO[kind]}?token=${encodeURIComponent(token.trim().toUpperCase())}` : "/berkas";

  return (
    <section className="container-page py-12 md:py-16">
      <Link to="/" className="text-xs font-semibold text-primary hover:underline">
        ← Kembali ke Beranda
      </Link>
      <div className="mt-4 max-w-3xl">
        <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
          Tahap 3 — Pengiriman Esai
        </span>
        <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-foreground">Pengiriman Esai</h1>
        <p className="mt-2 text-muted-foreground">
          Lengkapi esai singkat ini sebagai syarat untuk melanjutkan ke tahap Berkas Administrasi.
          Masukkan kode pendaftar kamu terlebih dahulu.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-10 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {registrant && kind && (
            <div className="rounded-2xl border border-primary/30 bg-primary-soft/40 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <UserCheck size={14} /> Terverifikasi: {registrant.full_name}
              </div>
            </div>
          )}

          {registrant && ann.published && (
            <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-4 dark:bg-emerald-950/30">
              <div className="flex items-center gap-2 text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 size={16} /> Pengumuman Hasil Esai
              </div>
              <p className="mt-1 text-xs text-emerald-900/80 dark:text-emerald-200/80">
                {ann.message ||
                  "Hasil penilaian esai telah dipublikasikan. Silakan cek status pendaftaran kamu untuk melihat hasilnya."}
              </p>
              <Link
                to="/cek-status"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                Lihat hasil di Cek Status <ArrowRight size={12} />
              </Link>
            </div>
          )}

          {paymentBlock}
          {paymentModal}

          {registrant && !paymentDue && (isFastTrack || done) && (
            <div className="card-block p-8 md:p-10 flex flex-col items-center text-center">
              <div className="mb-6 relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-full bg-primary-soft flex items-center justify-center text-primary shadow-soft border-4 border-background">
                  <CheckCircle2 size={48} className="md:hidden" />
                  <CheckCircle2 size={64} className="hidden md:block" />
                </div>
              </div>
              
              <h2 className="text-2xl font-black text-foreground">
                {isFastTrack ? "Fast Track — Esai Otomatis Lolos" : "Esai Berhasil Terkirim"}
              </h2>
              <p className="mt-3 text-base text-muted-foreground max-w-md">
                {isFastTrack
                  ? "Selamat! Kamu terdaftar di jalur Fast Track, sehingga tahap pengisian esai otomatis dilewati. Silakan lanjut ke berkas administrasi."
                  : "Terima kasih! Jawaban esaimu sudah kami terima dan tersimpan di sistem. Silakan lanjutkan ke tahap Berkas Administrasi."}
              </p>
              
              <Link
                to={berkasLink}
                className="btn-block mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-soft hover:opacity-95 transition"
              >
                Lanjut Kirim Berkas <ArrowRight size={18} />
              </Link>
            </div>
          )}

          {registrant && !paymentDue && !isFastTrack && !done && (
            <div className="card-block p-6 md:p-7">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <PenLine size={16} className="text-primary" /> Pertanyaan Esai (Wajib)
              </h2>
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
                        {i + 1}. {q}
                        <span className="text-destructive"> *</span>
                      </span>
                      <textarea
                        value={val}
                        onChange={(e) => setEssays((s) => s.map((v, idx) => (idx === i ? e.target.value : v)))}
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
            </div>
          )}
        </div>

        {!paymentDue && !isFastTrack && !done && (
          <aside className="space-y-4 lg:sticky lg:top-24 h-fit">
            <div className="card-block p-6">
              <h3 className="font-semibold text-foreground">Catatan</h3>
              <ul className="mt-4 space-y-3 text-sm text-foreground/85">
                {[
                  "Esai wajib diisi sebelum mengirim berkas administrasi",
                  "Minimal 100 karakter untuk setiap jawaban",
                  "Peserta Fast Track otomatis lolos tahap esai",
                  "Gunakan bahasa yang sopan dan jujur",
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
                  Kirim Esai <ArrowRight size={16} />
                </>
              )}
            </button>
          </aside>
        )}
      </form>
    </section>
  );
}
