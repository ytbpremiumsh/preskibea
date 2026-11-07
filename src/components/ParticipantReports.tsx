import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2, MessageSquare, RefreshCw, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ReportThread } from "@/components/ReportThread";
import { reportRequest, reportStage, type ParticipantReport } from "@/lib/reports";

export function ParticipantReports({ token }: { token: string }) {
  const [filter, setFilter] = useState<"all" | "new" | "progress" | "resolved">("all");
  const [reports, setReports] = useState<ParticipantReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const hasActive = reports.some((r) => r.status === "open");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await reportRequest({ action: "list", token });
      setReports(result.reports || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat laporan.");
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim() || sending) return;
    if (hasActive) {
      toast.error("Masih ada tiket aktif. Silakan balas di tiket tersebut.");
      return;
    }
    setSending(true);
    try {
      const image = file
        ? await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
        : undefined;
      await reportRequest({
        action: "create",
        token,
        subject: subject.trim(),
        message: message.trim(),
        image,
      });
      setSubject("");
      setMessage("");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      toast.success("Laporan terkirim. Tim admin akan menindaklanjuti.");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Laporan gagal dikirim.");
    } finally {
      setSending(false);
    }
  };
  return (
    <section id="laporan-kendala" className="border-t pt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <MessageSquare className="text-primary" />
          <h2 className="text-xl font-bold">Laporan Kendala</h2>
        </div>
        <Button variant="outline" size="sm" disabled={loading} onClick={() => void load()}>
          <RefreshCw className={loading ? "animate-spin" : ""} />
          Muat ulang
        </Button>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm md:p-6"
        >
          <h3 className="font-semibold">Kirim laporan baru</h3>
          {hasActive && (
            <p className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
              Anda masih memiliki tiket aktif. Lanjutkan percakapan dengan membalas di tiket tersebut sampai selesai.
            </p>
          )}
          <label className="block space-y-2 text-sm font-medium">
            Judul kendala
            <Input
              required
              maxLength={120}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Contoh: Berkas tidak berhasil diunggah"
            />
          </label>
          <label className="block space-y-2 text-sm font-medium">
            Pesan
            <textarea
              required
              maxLength={4000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ceritakan kendala yang Anda alami…"
              className="min-h-32 w-full rounded-md border bg-background p-3 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <input
            ref={inputRef}
            type="file"
            aria-label="Screenshot kendala"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (!selected) return;
              if (
                !["image/jpeg", "image/png", "image/webp"].includes(selected.type) ||
                selected.size > 5 * 1024 * 1024
              ) {
                toast.error("Gunakan JPG, PNG, atau WebP maksimal 5 MB.");
                e.target.value = "";
                return;
              }
              setFile(selected);
            }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
              <ImagePlus />
              Tambah screenshot
            </Button>
            <span className="text-xs text-muted-foreground">
              Opsional · JPG, PNG, WebP · maks. 5 MB
            </span>
          </div>
          {preview && (
            <div className="relative w-fit max-w-full">
              <img
                src={preview}
                alt="Screenshot yang akan dikirim"
                className="max-h-48 max-w-full rounded-md border object-contain"
              />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute right-2 top-2"
                aria-label="Hapus screenshot"
                onClick={() => {
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
              >
                <X />
              </Button>
              <p className="mt-1 break-all text-xs text-muted-foreground">{file?.name}</p>
            </div>
          )}
          <Button type="submit" disabled={hasActive || sending || !subject.trim() || !message.trim()}>
            {sending ? <Loader2 className="animate-spin" /> : <Send />}Kirim laporan
          </Button>
        </form>
        <div className="min-w-0 space-y-4 rounded-2xl border bg-muted/30 p-5 md:p-6">
          <h3 className="font-semibold">
            Riwayat laporan <span className="text-muted-foreground">({reports.length})</span>
          </h3>
          <div role="group" aria-label="Filter riwayat laporan" className="flex flex-wrap gap-2">
            {(
              [
                ["all", "Semua"],
                ["new", "Baru"],
                ["progress", "Aktif"],
                ["resolved", "Selesai"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={`rounded-full px-3 py-2 text-xs font-semibold ${filter === value ? "bg-primary text-primary-foreground" : "border bg-background text-muted-foreground"}`}
              >
                {label} (
                {value === "all"
                  ? reports.length
                  : reports.filter((r) => reportStage(r) === value).length}
                )
              </button>
            ))}
          </div>
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat laporan…
            </p>
          ) : error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : !reports.filter((r) => filter === "all" || reportStage(r) === filter).length ? (
            <div className="border-y py-10 text-center">
              <CheckCircle2 className="mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Tidak ada laporan pada kategori ini.</p>
            </div>
          ) : (
            reports
              .filter((r) => filter === "all" || reportStage(r) === filter)
              .map((report) => (
                <article key={report.id} className="rounded-2xl border bg-background p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h4 className="min-w-0 break-words font-semibold">{report.subject}</h4>
                    <span
                      className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${report.status === "resolved" ? "bg-accent text-accent-foreground" : "bg-gold/15 text-gold-foreground"}`}
                    >
                      {report.status === "resolved"
                        ? "Selesai"
                        : report.admin_reply
                          ? "Sedang ditangani"
                          : "Menunggu tindak lanjut"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    #{report.id.slice(0, 8).toUpperCase()} ·{" "}
                    {new Date(report.created_at).toLocaleString("id-ID")}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">
                    {report.message}
                  </p>
                  {report.image_url && (
                    <a href={report.image_url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={report.image_url}
                        alt={`Screenshot ${report.subject}`}
                        className="mt-3 max-h-44 max-w-full rounded-md border object-contain"
                      />
                    </a>
                  )}
                  <ReportThread messages={report.messages} />
                  {report.status === "open" ? (
                    <ReplyBox token={token} id={report.id} onSent={load} />
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">Tiket selesai. Buat laporan baru bila masih ada kendala.</p>
                  )}
                </article>
              ))
          )}
        </div>
      </div>
    </section>
  );
}

function ReplyBox({ token, id, onSent }: { token: string; id: string; onSent: () => Promise<void> }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const send = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const image = file
        ? await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(String(r.result).split(",")[1] || "");
            r.onerror = reject;
            r.readAsDataURL(file);
          })
        : undefined;
      await reportRequest({ action: "reply", token, id, message: text.trim(), image });
      setText("");
      setFile(null);
      if (ref.current) ref.current.value = "";
      await onSent();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Balasan gagal dikirim.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mt-4 space-y-2">
      <textarea
        aria-label="Balas tiket"
        maxLength={4000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Tulis balasan…"
        className="min-h-20 w-full rounded-md border bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <input
        ref={ref}
        type="file"
        aria-label="Screenshot balasan"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && (!["image/jpeg", "image/png", "image/webp"].includes(f.type) || f.size > 5 * 1024 * 1024)) {
            toast.error("Gunakan JPG, PNG, atau WebP maksimal 5 MB.");
            e.target.value = "";
            return;
          }
          setFile(f || null);
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => ref.current?.click()}>
          <ImagePlus />
          {file ? file.name.slice(0, 20) : "Screenshot"}
        </Button>
        <Button type="button" size="sm" disabled={busy || !text.trim()} onClick={() => void send()}>
          {busy ? <Loader2 className="animate-spin" /> : <Send />}Kirim balasan
        </Button>
      </div>
    </div>
  );
}
