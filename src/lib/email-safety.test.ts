import test from "node:test";
import assert from "node:assert/strict";
import { canSendEmail, notificationKey, safeEmailFailure } from "../../supabase/functions/_shared/email-safety.ts";

test("anonymous and ordinary users cannot send emails", () => {
  assert.equal(canSendEmail(false, false, false), false);
  assert.equal(canSendEmail(false, true, false), false);
});
test("logged-in admins can send only test emails", () => {
  assert.equal(canSendEmail(false, true, true), true);
  assert.equal(canSendEmail(false, false, true), false);
});
test("transactional sends require internal authentication", () => {
  assert.equal(canSendEmail(true, false, false), true);
  assert.equal(canSendEmail(true, true, false), false);
});
test("FT Standard payment webhook and polling use the same deduplication key", () => {
  const webhook = notificationKey("registration", "PK-PRE-STNDRD", "approved");
  const polling = notificationKey("registration", "PK-PRE-STNDRD", "approved");
  assert.equal(webhook, "participant-registration-PK-PRE-STNDRD-approved-");
  assert.equal(webhook, polling);
});
test("FT Premium payment retries share a key distinct from Standard", () => {
  assert.equal(notificationKey("registration", "PK-PRE-PREMUM", "approved"), "participant-registration-PK-PRE-PREMUM-approved-");
  assert.notEqual(notificationKey("registration", "PK-PRE-PREMUM", "approved"), notificationKey("registration", "PK-PRE-STNDRD", "approved"));
});
test("untrusted provider errors are never displayed", () => {
  assert.deepEqual(safeEmailFailure("secret-token-provider-details"), { code: "send_failed", message: "Pengiriman gagal. Silakan periksa layanan email atau coba lagi nanti." });
  assert.equal(safeEmailFailure("domain_not_verified").code, "domain_not_verified");
});