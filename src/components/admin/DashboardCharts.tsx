import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";

const PRIMARY = "oklch(0.58 0.18 260)"; // modern indigo/blue
const PRIMARY_SOFT = "oklch(0.74 0.14 75)"; // warm amber for secondary segment
const ACCENT = "oklch(0.70 0.13 195)"; // teal
const MUTED = "hsl(var(--muted-foreground))";

function TooltipCard({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-popover/95 backdrop-blur px-3 py-2 shadow-lg text-xs">
      {label && <div className="font-medium text-foreground mb-1.5">{label}</div>}
      <div className="space-y-1">
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
            <span className="text-muted-foreground">{p.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-foreground">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LegendDots({ items }: { items: { name: string; color: string; value?: number | string }[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 pt-3 text-xs">
      {items.map((it) => (
        <div key={it.name} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: it.color }} />
          <span className="text-muted-foreground">{it.name}</span>
          {it.value !== undefined && (
            <span className="font-semibold text-foreground tabular-nums">{it.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function LineDaily({ data, showFastTrack }: { data: { label: string; count: number; fastTrack?: number }[], showFastTrack?: boolean }) {
  const FAST_TRACK_COLOR = "oklch(0.76 0.17 65)"; // orange
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 16, right: 12, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="dailyFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.28} />
            <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fastTrackFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={FAST_TRACK_COLOR} stopOpacity={0.28} />
            <stop offset="100%" stopColor={FAST_TRACK_COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={false} width={28} />
        <Tooltip content={<TooltipCard />} cursor={{ stroke: PRIMARY, strokeOpacity: 0.25, strokeWidth: 2 }} />
        <Area
          type="monotone"
          dataKey="count"
          stroke={PRIMARY}
          strokeWidth={2.5}
          fill="url(#dailyFill)"
          name="Total Pendaftar"
          dot={false}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
        />
        {showFastTrack && (
          <Area
            type="monotone"
            dataKey="fastTrack"
            stroke={FAST_TRACK_COLOR}
            strokeWidth={2.5}
            fill="url(#fastTrackFill)"
            name="Fast Track"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PieKind({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const colors = [PRIMARY, PRIMARY_SOFT];
  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            {colors.map((c, i) => (
              <linearGradient key={i} id={`pieGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c} stopOpacity={1} />
                <stop offset="100%" stopColor={c} stopOpacity={0.75} />
              </linearGradient>
            ))}
          </defs>
          <Tooltip content={<TooltipCard />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={3}
            cornerRadius={6}
            stroke="hsl(var(--background))"
            strokeWidth={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={`url(#pieGrad-${i % colors.length})`} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center -mt-4">
        <div className="text-2xl font-bold tabular-nums text-foreground">{total}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</div>
      </div>
      <div className="absolute inset-x-0 bottom-0">
        <LegendDots
          items={data.map((d, i) => ({
            name: d.name,
            color: colors[i % colors.length],
            value: total > 0 ? `${Math.round((d.value / total) * 100)}%` : "0%",
          }))}
        />
      </div>
    </div>
  );
}

export function BarJenjang({ data }: { data: { name: string; prestasi: number; ekonomi: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 16, right: 12, left: -16, bottom: 0 }} barCategoryGap="28%">
        <defs>
          <linearGradient id="barPrestasi" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PRIMARY} stopOpacity={1} />
            <stop offset="100%" stopColor={PRIMARY} stopOpacity={0.7} />
          </linearGradient>
          <linearGradient id="barEkonomi" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity={1} />
            <stop offset="100%" stopColor={ACCENT} stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: MUTED }} tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={false} width={28} />
        <Tooltip content={<TooltipCard />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
        <Bar dataKey="prestasi" stackId="a" fill="url(#barPrestasi)" name="Prestasi" maxBarSize={44} />
        <Bar dataKey="ekonomi" stackId="a" fill="url(#barEkonomi)" name="Ekonomi" maxBarSize={44} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default { LineDaily, PieKind, BarJenjang };
