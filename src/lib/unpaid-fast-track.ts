export type FastTrackRegistration = {
  id: string;
  full_name: string;
  email: string | null;
  whatsapp: string | null;
  token: string | null;
  kind: string;
  created_at: string;
  fast_track: boolean | null;
  payment_status: string | null;
  extra: Record<string, unknown> | null;
};

export function normalizedEmail(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function normalizedWhatsapp(value: string | null | undefined): string {
  let number = (value ?? "").replace(/\D/g, "");
  if (number.startsWith("00")) number = number.slice(2);
  if (number.startsWith("0")) number = `62${number.slice(1)}`;
  else if (number.startsWith("8")) number = `62${number}`;
  return number;
}

export function isPaidStatus(status: string | null | undefined): boolean {
  return ["paid", "success", "settlement"].includes((status ?? "").trim().toLowerCase());
}

export function fastTrackTier(row: FastTrackRegistration): "standard" | "premium" {
  return row.extra?.fast_track_type === "premium" ? "premium" : "standard";
}

/** Evaluate paid identities across the complete snapshot BEFORE applying UI filters. */
export function unpaidFastTrack(
  registrations: FastTrackRegistration[],
  payments: { registration_id: string; status: string | null }[],
): FastTrackRegistration[] {
  const paidIds = new Set(
    payments.filter((p) => isPaidStatus(p.status)).map((p) => p.registration_id),
  );
  const paidEmails = new Set<string>();
  const paidPhones = new Set<string>();
  for (const row of registrations) {
    if (!row.fast_track || (!isPaidStatus(row.payment_status) && !paidIds.has(row.id))) continue;
    const email = normalizedEmail(row.email);
    const phone = normalizedWhatsapp(row.whatsapp);
    if (email) paidEmails.add(email);
    if (phone) paidPhones.add(phone);
  }
  return registrations.filter(
    (row) =>
      row.fast_track &&
      !isPaidStatus(row.payment_status) &&
      !paidIds.has(row.id) &&
      !(normalizedEmail(row.email) && paidEmails.has(normalizedEmail(row.email))) &&
      !(normalizedWhatsapp(row.whatsapp) && paidPhones.has(normalizedWhatsapp(row.whatsapp))),
  );
}
