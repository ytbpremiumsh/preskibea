export function canSendEmail(internal: boolean, isTest: boolean, authenticatedAdmin: boolean) {
  return isTest ? authenticatedAdmin : internal;
}

export function notificationKey(type: string, token: string, status = "", count?: number) {
  return `participant-${type}-${token.trim().toUpperCase()}-${status}-${count ?? ""}`;
}

const reasons: Record<string, string> = {
  domain_not_verified: "Domain pengirim belum terverifikasi.",
  no_matching_sender: "Domain pengirim tidak cocok dengan layanan email.",
  emails_disabled: "Pengiriman email sedang dinonaktifkan.",
  recipient_suppressed: "Penerima diblokir layanan email; pengiriman dilewati.",
  rate_limited: "Batas pengiriman tercapai; tunggu sebelum mencoba lagi.",
  invalid_test_content: "Subjek dan isi email uji wajib diisi.",
  log_unavailable: "Pencatatan tidak tersedia; email tidak dikirim.",
};

export function safeEmailFailure(code?: string, status?: number) {
  const key = status === 429 ? "rate_limited" : code ?? "send_failed";
  return { code: Object.hasOwn(reasons, key) ? key : "send_failed", message: reasons[key] ?? "Pengiriman gagal. Silakan periksa layanan email atau coba lagi nanti." };
}