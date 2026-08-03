import { useEffect, useState } from "react";
import { Wrench, Clock, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type MaintenanceConfig = {
  enabled?: boolean;
  title?: string;
  message?: string;
  eta?: string; // ISO string optional
  contact_email?: string;
  contact_whatsapp?: string;
};

function useCountdown(target?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return null;
  const diff = Math.max(0, new Date(target).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s, done: diff === 0 };
}

export function MaintenancePage({ config }: { config: MaintenanceConfig }) {
  const cd = useCountdown(config.eta);
  const title = config.title || "Sedang Dalam Pemeliharaan";
  const message =
    config.message ||
    "Kami sedang melakukan pembaruan untuk memberikan pengalaman yang lebih baik. Mohon kembali sebentar lagi 🙏";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/30 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-accent/20 blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-primary/20 blur-3xl animate-pulse [animation-delay:2s]" />
      </div>
      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 -z-10 rounded-full bg-primary/20 blur-2xl" />
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-2xl shadow-primary/40 ring-1 ring-primary/30">
            <Wrench className="h-11 w-11 animate-[spin_6s_linear_infinite]" />
          </div>
        </div>

        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
          Status: Maintenance
        </span>

        <h1 className="bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {message}
        </p>

        {cd && (
          <div className="mt-10 w-full max-w-md">
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> Estimasi kembali online
            </p>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {[
                { v: cd.d, l: "Hari" },
                { v: cd.h, l: "Jam" },
                { v: cd.m, l: "Menit" },
                { v: cd.s, l: "Detik" },
              ].map((it) => (
                <div
                  key={it.l}
                  className="rounded-2xl border border-border bg-card/60 px-2 py-3 shadow-sm backdrop-blur"
                >
                  <div className="text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
                    {String(it.v).padStart(2, "0")}
                  </div>
                  <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {it.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(config.contact_email || config.contact_whatsapp) && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {config.contact_whatsapp && (
              <Button asChild size="lg" className="rounded-full">
                <a
                  href={`https://wa.me/${config.contact_whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Hubungi via WhatsApp <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </Button>
            )}
            {config.contact_email && (
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <a href={`mailto:${config.contact_email}`}>
                  <Mail className="mr-1 h-4 w-4" /> {config.contact_email}
                </a>
              </Button>
            )}
          </div>
        )}

        <p className="mt-12 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Beasiswa Prestasi Kita
        </p>
      </main>
    </div>
  );
}
