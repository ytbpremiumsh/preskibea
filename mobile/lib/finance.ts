export type Period = "day" | "week" | "month";
export const PAID_STATUSES = [
  "paid",
  "success",
  "SUCCESS",
  "settlement",
  "SETTLEMENT",
  "PAID",
  "Success",
  "Settlement",
];
const DAY = 86_400_000;
const WIB = 7 * 3_600_000;
export function jakartaDay(now = new Date()) {
  return new Date(now.getTime() + WIB).toISOString().slice(0, 10);
}
export function periodRange(period: Period, now = new Date()) {
  const midnight = new Date(`${jakartaDay(now)}T00:00:00+07:00`).getTime();
  let start = midnight,
    end = midnight + DAY;
  if (period === "week") {
    const weekday = new Date(midnight + WIB).getUTCDay() || 7;
    start -= (weekday - 1) * DAY;
    end = start + 7 * DAY;
  }
  if (period === "month") {
    const [year, month] = jakartaDay(now).split("-").map(Number);
    start = Date.UTC(year, month - 1, 1) - WIB;
    end = Date.UTC(year, month, 1) - WIB;
  }
  return { start: new Date(start), end: new Date(end) };
}
export function successful(status: string) {
  return ["paid", "success", "settlement"].includes(status.toLowerCase());
}
export function inPeriod(createdAt: string, period: Period, now = new Date()) {
  const { start, end } = periodRange(period, now);
  const time = new Date(createdAt).getTime();
  return time >= start.getTime() && time < end.getTime();
}
export function chartPoints(
  payments: { created_at: string; amount: number }[],
  period: Period,
  now = new Date(),
) {
  const { start, end } = periodRange(period, now);
  const step = period === "day" ? 3 * 3_600_000 : DAY;
  const count = Math.round((end.getTime() - start.getTime()) / step);
  const points = Array.from({ length: count }, (_, i) => ({
    label:
      period === "day"
        ? String(i * 3).padStart(2, "0")
        : String(new Date(start.getTime() + i * step + WIB).getUTCDate()),
    total: 0,
  }));
  for (const payment of payments) {
    const index = Math.floor((new Date(payment.created_at).getTime() - start.getTime()) / step);
    if (index >= 0 && index < count) points[index].total += Number(payment.amount) || 0;
  }
  return points;
}

export type DateFilter = { period: Period | "all" | "custom"; from?: string; to?: string };
export function validDateKey(key: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const d = new Date(`${key}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === key;
}
export function selectionRange(filter: DateFilter, now = new Date(), firstDate?: string) {
  if (filter.period === "all")
    return {
      start: new Date(
        `${firstDate && validDateKey(firstDate) ? firstDate : "1970-01-01"}T00:00:00+07:00`,
      ),
      end: periodRange("day", now).end,
    };
  if (filter.period !== "custom") return periodRange(filter.period, now);
  if (
    !filter.from ||
    !filter.to ||
    !validDateKey(filter.from) ||
    !validDateKey(filter.to) ||
    filter.from > filter.to
  )
    throw new Error("Pilih tanggal mulai dan akhir yang valid.");
  return {
    start: new Date(`${filter.from}T00:00:00+07:00`),
    end: new Date(new Date(`${filter.to}T00:00:00+07:00`).getTime() + DAY),
  };
}
export function matchesDate(
  createdAt: string,
  filter: DateFilter,
  now = new Date(),
  firstDate?: string,
) {
  const { start, end } = selectionRange(filter, now, firstDate);
  const time = new Date(createdAt).getTime();
  return time >= start.getTime() && time < end.getTime();
}
export function dateLabel(key: string) {
  return new Date(`${key}T00:00:00Z`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
export function filterLabel(filter: DateFilter, now = new Date(), firstDate?: string) {
  const { start, end } = selectionRange(filter, now, firstDate);
  const from = jakartaDay(start),
    to = jakartaDay(new Date(end.getTime() - 1));
  return filter.period === "all"
    ? `Sejak ${firstDate ? dateLabel(firstDate) : "pendaftaran pertama"} · sekarang`
    : from === to
      ? dateLabel(from)
      : `${dateLabel(from)} — ${dateLabel(to)}`;
}
export function selectionPoints(
  payments: { created_at: string; amount: number }[],
  filter: DateFilter,
  now = new Date(),
  firstDate?: string,
) {
  const selected = payments.filter((p) => matchesDate(p.created_at, filter, now, firstDate));
  let { start, end } = selectionRange(filter, now, firstDate);
  if (filter.period === "all" && !firstDate) {
    start = selected.length
      ? new Date(
          `${jakartaDay(new Date(Math.min(...selected.map((p) => new Date(p.created_at).getTime()))))}T00:00:00+07:00`,
        )
      : periodRange("day", now).start;
  }
  const days = Math.round((end.getTime() - start.getTime()) / DAY);
  if (days <= 31) {
    const period = filter.period === "day" ? "day" : null;
    if (period) return chartPoints(selected, "day", now);
    const pts = Array.from({ length: Math.max(days, 1) }, (_, i) => ({
      label: new Date(start.getTime() + i * DAY).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        timeZone: "Asia/Jakarta",
      }),
      total: 0,
    }));
    for (const p of selected) {
      const i = Math.floor((new Date(p.created_at).getTime() - start.getTime()) / DAY);
      if (pts[i]) pts[i].total += Number(p.amount) || 0;
    }
    return pts;
  }
  const from = jakartaDay(start),
    to = jakartaDay(new Date(end.getTime() - 1));
  const [fy, fm] = from.split("-").map(Number),
    [ty, tm] = to.split("-").map(Number);
  const months = (ty - fy) * 12 + tm - fm + 1;
  const yearly = months > 36;
  const pts = Array.from({ length: yearly ? ty - fy + 1 : months }, (_, i) => {
    const d = new Date(Date.UTC(yearly ? fy + i : fy, yearly ? 0 : fm - 1 + i, 1));
    return {
      label: d.toLocaleDateString("id-ID", {
        ...(yearly ? {} : { month: "short" }),
        year: "numeric",
        timeZone: "UTC",
      }),
      total: 0,
    };
  });
  for (const p of selected) {
    const [y, m] = jakartaDay(new Date(p.created_at)).split("-").map(Number);
    const index = yearly ? y - fy : (y - fy) * 12 + m - fm;
    if (pts[index]) pts[index].total += Number(p.amount) || 0;
  }
  return pts;
}
