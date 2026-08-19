import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  open: boolean;
  token: string;
  paymentUrl: string;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
};

/**
 * Overlay pembayaran (iframe). Melakukan polling status pembayaran dan
 * otomatis menutup + memanggil onSuccess ketika pembayaran valid.
 */
export function PaymentIframeModal({ open, token, paymentUrl, onClose, onSuccess, title }: Props) {
  const [paid, setPaid] = useState(false);

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-3xl border-2 border-foreground bg-background shadow-card flex flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <p className="text-sm font-extrabold text-foreground">{title ?? "Pembayaran Fast Track"}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
              BEASISWA PENDIDIKAN PRESTASI KITA #8 - PEMBAYARAN QRIS
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 transition hover:bg-muted" aria-label="Tutup">
            ✕
          </button>
        </div>

        {paid ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <p className="text-lg font-extrabold text-foreground">Pembayaran Berhasil</p>
            <p className="text-sm text-muted-foreground">Mengalihkan ke halaman sukses…</p>
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-[60vh]">
              <iframe src={paymentUrl} className="h-full w-full border-0" title="Pembayaran" allow="payment" />
            </div>
            <div className="flex items-center gap-2 border-t border-border p-3 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Jangan tutup jendela ini. Sistem otomatis memverifikasi pembayaran Anda.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
