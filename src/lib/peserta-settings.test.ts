import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PESERTA_SETTINGS, normalizePesertaSettings } from "./peserta-settings.ts";

test("missing settings preserve usable default tabs", () => {
  assert.deepEqual(normalizePesertaSettings(null), DEFAULT_PESERTA_SETTINGS);
});
test("admin can turn off each tab and change benefit content", () => {
  const settings = normalizePesertaSettings({ status_enabled: false, reports_enabled: false, benefits_enabled: false, benefits_text: "Materi dan pendampingan" });
  assert.equal(settings.status_enabled, false);
  assert.equal(settings.reports_enabled, false);
  assert.equal(settings.benefits_enabled, false);
  assert.equal(settings.benefits_text, "Materi dan pendampingan");
});
test("partial or malformed settings retain default values", () => {
  const settings = normalizePesertaSettings({ reports_enabled: "false", title: 123 });
  assert.equal(settings.reports_enabled, false);
  assert.equal(settings.title, "Dashboard Peserta");
});
