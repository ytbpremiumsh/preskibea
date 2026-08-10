import { useEffect, useState } from "react";
import { Wrench, Clock, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MaintenanceGame } from "@/components/MaintenanceGame";


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
      {/* Ambient background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-24 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-[30rem] w-[30rem] rounded-full bg-gold/25 blur-3xl" />
      </div>
      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)",
        }}
      />

      <main className="container-page flex min-h-screen flex-col items-center justify-center py-16">
        <div className="card-block w-full max-w-2xl p-7 text-center sm:p-10">
          {/* Icon badge */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-ink bg-gold text-ink shadow-block-sm">
            <Wrench className="h-9 w-9 animate-[spin_7s_linear_infinite]" />
          </div>

          <span className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-background px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
            </span>
            Status: Maintenance
          </span>

          <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            {title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            {message}
          </p>

          <div className="mt-6 text-left">
            <MaintenanceGame />
          </div>



          {cd && (
            <div className="mt-8">
              <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Estimasi kembali online
              </p>
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {[
                  { v: cd.d, l: "Hari" },
                  { v: cd.h, l: "Jam" },
                  { v: cd.m, l: "Menit" },
                  { v: cd.s, l: "Detik" },
                ].map((it) => (
                  <div key={it.l} className="card-flat px-1.5 py-3">
                    <div className="font-display text-2xl font-extrabold tabular-nums sm:text-4xl">
                      {String(it.v).padStart(2, "0")}
                    </div>
                    <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {it.l}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(config.contact_email || config.contact_whatsapp) && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {config.contact_whatsapp && (
                <Button asChild size="lg" className="btn-block rounded-full">
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
                <Button asChild size="lg" variant="outline" className="btn-block rounded-full">
                  <a href={`mailto:${config.contact_email}`}>
                    <Mail className="mr-1 h-4 w-4" /> {config.contact_email}
                  </a>
                </Button>
              )}
            </div>
          )}



        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Beasiswa Prestasi Kita
        </p>
      </main>
    </div>
  );
}
