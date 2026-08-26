import { supabase } from "@/integrations/supabase/client";

const PRIVATE_BUCKET = "kp-uploads";

/** Ambil path objek di dalam bucket privat dari URL publik lama/baru. */
function extractPath(url: string): string | null {
  const marker = `/${PRIVATE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length).split("?")[0]);
}

function openInNewTab(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Buka berkas pendaftar. Bucket kp-uploads bersifat privat, jadi URL publik
 * lama tidak bisa diakses langsung — kita buat signed URL sementara (5 menit).
 * Untuk tautan eksternal (Google Drive dll) langsung dibuka.
 */
export async function openStoredFile(url: string) {
  const clean = (url ?? "").trim();
  const path = extractPath(clean);
  if (!path) {
    const href = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
    openInNewTab(href);
    return;
  }
  const { data, error } = await supabase.storage
    .from(PRIVATE_BUCKET)
    .createSignedUrl(path, 300);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Gagal membuka berkas");
  }
  openInNewTab(data.signedUrl);
}

