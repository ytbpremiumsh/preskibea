import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  open: boolean;
  token: string;
  paymentUrl: string;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  /** Buat link pembayaran baru otomatis saat modal dibuka (menghindari link expired). */
  renewOnOpen?: boolean;
};

/**
 * Overlay pembayaran (iframe). Melakukan polling status pembayaran dan
 * otomatis menutup + memanggil onSuccess ketika pembayaran valid.
 */
export function PaymentIframeModal({ open, token, paymentUrl, onClose, onSuccess, title, renewOnOpen }: Props) {
  const [paid, setPaid] = useState(false);
  const [url, setUrl] = useState(paymentUrl);
  const [renewing, setRenewing] = useState(false);
  const [frameKey, setFrameKey] = useState(0);
  const renewedFor = useRef<string | null>(null);

  useEffect(() => {
    setUrl(paymentUrl);
  }, [paymentUrl]);

  const renewLink = useCallback(async () => {
    if (!token) return;
    setRenewing(true);
    try {
      const { data, error } = await supabase.functions.invoke("renew-payment-link", {
        body: { token },
      });
      const res = data as { payment_url?: string; status?: string; error?: string } | null;
      if (error || res?.error || !res?.payment_url) {
        if (res?.status === "paid") {
          setPaid(true);
          setTimeout(() => onSuccess(), 1000);
          return;
        }
        toast.error(res?.error || "Gagal membuat link pembayaran baru. Coba lagi.");
        return;
      }
      setUrl(res.payment_url);
      setFrameKey((k) => k + 1);
    } finally {
      setRenewing(false);
    }
  }, [token, onSuccess]);

  // Setiap kali modal dibuka lewat tombol "Selesaikan Pembayaran", buat link baru
  useEffect(() => {
    if (!open || !renewOnOpen || !token) return;
    if (renewedFor.current === token) return;
    renewedFor.current = token;
    renewLink();
  }, [open, renewOnOpen, token, renewLink]);

  useEffect(() => {
    if (!open) renewedFor.current = null;
  }, [open]);


  useEffect(() => {
    if (!open || !token) return;
    let stopped = false;
    let attempts = 0;

    const finish = () => {
      if (stopped) return;
      stopped = true;
      setPaid(true);
      setTimeout(() => onSuccess(), 1200);
    };

    const check = async () => {
      if (stopped) return;
      attempts += 1;
      const { data } = await supabase
        .from("registrations")
        .select("payment_status")
        .eq("token", token)
        .maybeSingle();
      if (data?.payment_status === "paid") return finish();

      if (attempts % 2 === 0) {
        try {
          const { data: res } = await supabase.functions.invoke("check-payment-status", {
            body: { token },
          });
          if ((res as { status?: string } | null)?.status === "paid") return finish();
        } catch {
          /* ignore */
        }
      }
    };

    const interval = setInterval(check, 3000);
    check();

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
  }, [open, token, onSuccess]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-foreground/60 backdrop-blur-sm p-0 sm:items-center sm:p-4">
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden border-foreground bg-background shadow-card sm:h-[96dvh] sm:max-w-2xl sm:rounded-3xl sm:border-2">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border p-3 sm:p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-foreground">{title ?? "Pembayaran Fast Track"}</p>
            <p className="truncate text-[10px] font-bold uppercase tracking-wider text-primary">
              BEASISWA PENDIDIKAN PRESTASI KITA #8 - PEMBAYARAN QRIS
            </p>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-full p-2 transition hover:bg-muted" aria-label="Tutup">
            ✕
          </button>
        </div>

        {paid ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <p className="text-lg font-extrabold text-foreground">Pembayaran Berhasil</p>
            <p className="text-sm text-muted-foreground">Mengalihkan ke halaman sukses…</p>
          </div>
        ) : renewing ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-bold text-foreground">Menyiapkan link pembayaran baru…</p>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-auto">
              <iframe
                key={frameKey}
                src={url}
                className="h-full min-h-[560px] w-full border-0"
                title="Pembayaran"
                allow="payment"
              />
            </div>
            <div className="flex shrink-0 items-center gap-2 border-t border-border p-3 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Jangan tutup jendela ini. Sistem otomatis memverifikasi pembayaran Anda.
            </div>
          </>
        )}

      </div>
    </div>
  );
}
