// Client-side API wrappers — sebelumnya pakai TanStack server functions.
// Sekarang panggil Supabase Edge Functions yang dideploy terpisah.
import { supabase } from "@/integrations/supabase/client";

type InvokeResult<T> = { data: T };

async function invoke<T>(fn: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fn, { body: body as Record<string, unknown> });
  if (error) {
    // Coba ambil pesan dari response body kalau ada
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.text === "function") {
      try {
        const txt = await ctx.text();
        try {
          const j = JSON.parse(txt);
          throw new Error(j.error || j.message || txt || error.message);
        } catch {
          throw new Error(txt || error.message);
        }
      } catch (e) {
        if (e instanceof Error) throw e;
      }
    }
    throw new Error(error.message);
  }
  return data as T;
}

// ─── Registration ───────────────────────────────────────────────────────────

export type SubmitRegistrationInput = {
  kind: "prestasi" | "ekonomi" | "umum" | "yatim";
  full_name: string;
  birth_place: string;
  birth_date: string;
  gender: string;
  address: string;
  whatsapp: string;
  email: string;
  education_level: string;
  school_name: string;
  grade: string;
  main_achievement?: string | null;
  parent_income?: string | null;
  dependents?: number | null;
  photo_url?: string | null;
  student_card_url?: string | null;
  fast_track?: boolean;
  payment_url?: string;
  extra?: Record<string, unknown>;
};

export async function submitRegistration(
  input: SubmitRegistrationInput,
): Promise<{ token: string }> {
  return invoke<{ token: string }>("submit-registration", input);
}

// Backwards-compat dengan signature lama (useServerFn-style `{ data }`)
export async function submitRegistrationFn(args: { data: SubmitRegistrationInput }) {
  return submitRegistration(args.data);
}

// ─── Berkas ────────────────────────────────────────────────────────────────

export type SubmitBerkasInput = {
  token: string;
  kind: "prestasi" | "ekonomi" | "umum" | "yatim";
  documents: { key: string; label: string; url: string }[];
  essays?: { question: string; answer: string }[];
};

export async function submitBerkasDocuments(
  input: SubmitBerkasInput,
): Promise<{ count: number }> {
  return invoke<{ count: number }>("submit-berkas", input);
}

// ─── Email ─────────────────────────────────────────────────────────────────

export type SendAppEmailInput = {
  templateName: string;
  recipientEmail: string;
  idempotencyKey: string;
  templateData?: Record<string, unknown>;
};

export async function sendAppEmail(args: { data: SendAppEmailInput }) {
  return invoke<{ ok: boolean; messageId?: string; skipped?: string }>(
    "send-app-email",
    args.data,
  );
}

export type SendTestEmailInput = {
  templateName: "registration-confirmation" | "berkas-confirmation";
  recipientEmail: string;
  subject: string;
  html: string;
};

export async function sendTestEmail(args: { data: SendTestEmailInput }) {
  return invoke<{ ok: boolean; messageId?: string }>("send-app-email", {
    ...args.data,
    idempotencyKey: `test-${args.data.templateName}-${Date.now()}`,
    _isTest: true,
  });
}

// ─── AI Content ─────────────────────────────────────────────────────────────

export type GenerateAiArticleInput = {
  topic: string;
  category?: string;
  tone?: "informal" | "professional" | "persuasive";
  language?: "id" | "en";
};

export async function generateAiArticle(input: GenerateAiArticleInput): Promise<{
  title: string;
  excerpt: string;
  content: string;
  category: string;
}> {
  return invoke<{
    title: string;
    excerpt: string;
    content: string;
    category: string;
  }>("ai-article-generator", input);
}

export type _InvokeResult<T> = InvokeResult<T>;
