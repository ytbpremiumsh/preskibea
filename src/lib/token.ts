export type RegKind = "prestasi" | "ekonomi" | "umum" | "yatim";

const KIND_BY_CODE: Record<string, RegKind> = {
  PRE: "prestasi",
  EKO: "ekonomi",
  UMU: "umum",
  YAT: "yatim",
};

/**
 * Bersihkan kode pendaftaran yang diketik/ditempel peserta.
 * Menangani huruf kecil, spasi, karakter tak terlihat, dan pemisah selain "-".
 */
export function normalizeToken(raw: string): string {
  let t = (raw || "")
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "") // karakter tak terlihat
    .trim()
    .toUpperCase()
    .replace(/[\s_–—]+/g, "-") // spasi / underscore / dash panjang -> "-"
    .replace(/-+/g, "-");

  // Ambil hanya bagian kode kalau ada teks lain ikut tertempel
  const m = /((?:PK|KP)-?(?:PRE|EKO|UMU|YAT)-?[A-Z0-9]{4,10})/.exec(t.replace(/[^A-Z0-9-]/g, ""));
  if (m) t = m[1];

  // Sisipkan tanda "-" jika peserta mengetik tanpa pemisah
  const compact = /^(PK|KP)-?(PRE|EKO|UMU|YAT)-?([A-Z0-9]{4,10})$/.exec(t);
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}`;

  return t;
}

export function kindFromToken(raw: string): RegKind | null {
  const m = /^(?:PK|KP)-(PRE|EKO|UMU|YAT)-[A-Z0-9]{4,10}$/.exec(normalizeToken(raw));
  return m ? KIND_BY_CODE[m[1]] : null;
}

export function isValidToken(raw: string): boolean {
  return kindFromToken(raw) !== null;
}

export function kindLabel(k: RegKind): string {
  return k === "prestasi" ? "Prestasi" : k === "ekonomi" ? "Ekonomi" : k === "yatim" ? "Yatim" : "Umum";
}

export function berkasPathFor(k: RegKind): string {
  return `/berkas/${k}/upload`;
}
