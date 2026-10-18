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
