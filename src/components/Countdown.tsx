import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarClock } from "lucide-react";

type CountdownSetting = {
  deadline: string;
  title: string;
  subtitle: string;
};

function diff(target: Date) {
  const now = new Date().getTime();
  const ms = Math.max(0, target.getTime() - now);
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms / 3600000) % 24);
  const m = Math.floor((ms / 60000) % 60);
  const s = Math.floor((ms / 1000) % 60);
  return { d, h, m, s, done: ms === 0 };
}

export function Countdown() {
  const [data, setData] = useState<CountdownSetting | null>(null);
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0, done: false });

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "countdown")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setData(data.value as CountdownSetting);
      });
  }, []);

  useEffect(() => {
    if (!data?.deadline) return;
    const target = new Date(data.deadline);
    if (isNaN(target.getTime())) return;

    // Only show countdown if we are within 20 days of the deadline
    const now = new Date().getTime();
    const diffMs = target.getTime() - now;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays > 20) {
      setT((prev) => ({ ...prev, done: false, hidden: true }));
      return;
    }

    const tick = () => {
      const currentDiff = diff(target);
      setT({ ...currentDiff, hidden: false } as any);
    };
    
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [data?.deadline]);

  if (!data || (t as any).hidden) return null;

  const items = [
    { label: "Hari", value: t.d },
    { label: "Jam", value: t.h },
    { label: "Menit", value: t.m },
    { label: "Detik", value: t.s },
  ];

  return (
    <div
      className="card-block relative overflow-hidden p-6 md:p-8"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative flex flex-col items-center text-center gap-5">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
          <CalendarClock size={14} /> {data.title}
        </span>
        {t.done ? (
          <p className="text-2xl font-bold text-foreground">Pendaftaran telah ditutup</p>
        ) : (
          <div className="grid grid-cols-4 gap-3 md:gap-5 w-full max-w-2xl">
            {items.map((i) => (
              <div
                key={i.label}
                className="card-block px-2 py-4 md:py-5"
              >
                <div className="text-3xl md:text-5xl font-extrabold text-primary tabular-nums">
                  {String(i.value).padStart(2, "0")}
                </div>
                <div className="mt-1 text-[11px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {i.label}
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-sm text-muted-foreground max-w-xl">{data.subtitle}</p>
      </div>
    </div>
  );
}
