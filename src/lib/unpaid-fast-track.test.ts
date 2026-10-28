import test from "node:test";
import assert from "node:assert/strict";
import {
  unpaidFastTrack,
  normalizedWhatsapp,
  type FastTrackRegistration,
} from "./unpaid-fast-track.ts";
const row = (id: string, values: Partial<FastTrackRegistration> = {}): FastTrackRegistration => ({
  id,
  full_name: id,
  email: `${id}@example.com`,
  whatsapp: null,
  token: id,
  kind: "umum",
  created_at: "2026-10-28T00:00:00Z",
  fast_track: true,
  payment_status: "pending",
  extra: {},
  ...values,
});
test("paid premium excludes unpaid standard with same normalized email", () => {
  assert.deepEqual(
    unpaidFastTrack(
      [
        row("a", {
          email: " A@EXAMPLE.COM ",
          payment_status: "paid",
          extra: { fast_track_type: "premium" },
        }),
        row("b", { email: "a@example.com" }),
      ],
      [],
    ),
    [],
  );
});
test("all Indonesian phone formats match without matching empty contacts", () => {
  for (const phone of [
    "0812-3456-7890",
    "+62 812 3456 7890",
    "6281234567890",
    "81234567890",
    "006281234567890",
  ])
    assert.equal(normalizedWhatsapp(phone), "6281234567890");
  const rows = [
    row("a", { whatsapp: "081234567890" }),
    row("b", { whatsapp: "+6281234567890" }),
    row("c", { email: null }),
    row("d", { email: null }),
  ];
  assert.deepEqual(
    unpaidFastTrack(rows, [{ registration_id: "a", status: "SUCCESS" }]).map((r) => r.id),
    ["c", "d"],
  );
});
test("pending and failed payments remain, non-fast-track paid status does not suppress FT", () => {
  const rows = [
    row("a"),
    row("b"),
    row("c", { fast_track: false, payment_status: "paid", email: "a@example.com" }),
  ];
  assert.deepEqual(
    unpaidFastTrack(rows, [
      { registration_id: "a", status: "pending" },
      { registration_id: "b", status: "failed" },
    ]).map((r) => r.id),
    ["a", "b"],
  );
});
test("paid ledger overrides stale registration status and matches across scholarship categories", () => {
  const rows = [
    row("a", { kind: "ekonomi" }),
    row("b", { kind: "prestasi", email: "a@example.com" }),
    row("c"),
  ];
  assert.deepEqual(
    unpaidFastTrack(rows, [{ registration_id: "a", status: "Settlement" }]).map((r) => r.id),
    ["c"],
  );
});
