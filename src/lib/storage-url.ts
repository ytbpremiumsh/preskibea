import { supabase } from "@/integrations/supabase/client";

const PRIVATE_BUCKET = "kp-uploads";

/** Ambil path objek di dalam bucket privat dari URL publik lama/baru. */
function extractPath(url: string): string | null {
  const marker = `/${PRIVATE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length).split("?")[0]);
}

/**
 * Buka berkas pendaftar. Bucket kp-uploads bersifat privat, jadi URL publik
 * lama tidak bisa diakses langsung — kita buat signed URL sementara (5 menit).
 */
export async function openStoredFile(url: string) {
  const path = extractPath(url);
  if (!path) {
    window.open(url, "_blank", "noopener");
    return;
  }
  const tab = window.open("", "_blank");
  const { data, error } = await supabase.storage
    .from(PRIVATE_BUCKET)
    .createSignedUrl(path, 300);
  if (error || !data?.signedUrl) {
    tab?.close();
    throw new Error(error?.message ?? "Gagal membuka berkas");
  }
  if (tab) tab.location.href = data.signedUrl;
  else window.open(data.signedUrl, "_blank", "noopener");
}
