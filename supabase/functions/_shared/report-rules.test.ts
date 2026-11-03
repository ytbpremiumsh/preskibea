import test from "node:test";
import assert from "node:assert/strict";
import { canAccessReport, imageExtension } from "./report-rules.ts";
test("peserta hanya dapat melihat tiket miliknya setelah kode diverifikasi", () => {
  assert.equal(canAccessReport("a", "a", false), true);
  assert.equal(canAccessReport("a", "b", false), false);
  assert.equal(canAccessReport("a", null, false), false);
});
test("admin terverifikasi dapat mengelola tiket peserta", () => {
  assert.equal(canAccessReport("a", null, true), true);
});
test("screenshot harus berupa gambar bukan konten teks atau SVG", () => {
  assert.equal(imageExtension(new TextEncoder().encode("<svg>test</svg>")), null);
  assert.equal(imageExtension(new Uint8Array([255,216,255,224])), "jpg");
});