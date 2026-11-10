import { supabase } from "@/integrations/supabase/client";
export type ParticipantReport = {
  id: string;
  subject: string;
  message: string;
  status: "open" | "resolved";
  admin_reply: string | null;
  image_url: string | null;
  created_at: string;
  messages?: ReportMessage[];
  registrations?: { full_name: string; token: string } | null;
};
export type ReportMessage = { id: string; sender: "participant" | "admin"; message: string; image_url: string | null; created_at: string };
export async function reportRequest(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("participant-reports", { body });
  if (error) {
    const context = (error as { context?: Response }).context;
    const detail = context
      ? await context
          .clone()
          .json()
          .catch(() => null)
      : null;
    throw new Error(detail?.error || "Laporan belum dapat diproses. Silakan coba lagi.");
  }
  if (!data?.ok) throw new Error(data?.error || "Laporan belum dapat diproses.");
  return data as { ok: boolean; reports?: ParticipantReport[]; id?: string; email_notification?: "sent" | "failed" };
}
export function reportStage(r: ParticipantReport): "new" | "progress" | "resolved" {
  return r.status === "resolved" ? "resolved" : r.admin_reply?.trim() || r.messages?.some((m) => m.sender === "admin") ? "progress" : "new";
}
