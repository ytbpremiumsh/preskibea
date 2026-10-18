import { test } from "node:test";
import assert from "node:assert/strict";
// @ts-ignore Node's type stripping resolves this source extension directly.
import { periodRange, inPeriod, chartPoints } from "./finance.ts";
test("month boundaries use WIB even when the phone uses UTC", () => {
  const now = new Date("2026-10-01T00:01:00+07:00");
  const range = periodRange("month", now);
  assert.equal(range.start.toISOString(), "2026-09-30T17:00:00.000Z");
  assert.equal(range.end.toISOString(), "2026-10-31T17:00:00.000Z");
  assert.equal(inPeriod("2026-09-30T16:59:59Z", "month", now), false);
  assert.equal(inPeriod("2026-09-30T17:00:00Z", "month", now), true);
  assert.equal(inPeriod("2026-10-31T17:00:00Z", "month", now), false);
});
test("all monthly chart bars equal monthly revenue, beyond the former 2000-row limit", () => {
  const now = new Date("2026-10-18T12:00:00+07:00");
  const payments = Array.from({ length: 3500 }, (_, i) => ({
    created_at: `2026-10-${String((i % 18) + 1).padStart(2, "0")}T03:00:00Z`,
    amount: 125000,
  }));
  payments.push({ created_at: "2026-09-30T16:59:59Z", amount: 999999 });
  const selected = payments.filter((p) => inPeriod(p.created_at, "month", now));
  const points = chartPoints(payments, "month", now);
  assert.equal(points.length, 31);
  assert.equal(
    points.reduce((s, p) => s + p.total, 0),
    selected.reduce((s, p) => s + p.amount, 0),
  );
  assert.equal(selected.length, 3500);
});
test("weekly range starts Monday WIB, including cross-month and cross-year weeks", () => {
  const range = periodRange("week", new Date("2027-01-01T01:00:00+07:00"));
  assert.equal(range.start.toISOString(), "2026-12-27T17:00:00.000Z");
  assert.equal(range.end.toISOString(), "2027-01-03T17:00:00.000Z");
});
test("daily bins include the full WIB day, including 23:59", () => {
  const now = new Date("2026-10-18T12:00:00+07:00");
  const points = chartPoints(
    [{ created_at: "2026-10-18T23:59:59+07:00", amount: 100 }],
    "day",
    now,
  );
  assert.equal(points.length, 8);
  assert.equal(points[7].total, 100);
});
