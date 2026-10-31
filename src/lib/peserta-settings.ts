export type PesertaSettings = {
  title: string;
  welcome: string;
  status_enabled: boolean;
  reports_enabled: boolean;
  benefits_enabled: boolean;
  benefits_title: string;
  benefits_text: string;
};
export const DEFAULT_PESERTA_SETTINGS: PesertaSettings = {
  title: "Dashboard Peserta",
  welcome: "Pantau proses beasiswa dan temukan informasi untuk peserta.",
  status_enabled: true,
  reports_enabled: false,
  benefits_enabled: true,
  benefits_title: "Benefit Peserta",
  benefits_text: "Informasi benefit akan diumumkan oleh admin.",
};
export function normalizePesertaSettings(value: unknown): PesertaSettings {
  const v = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const defaults = DEFAULT_PESERTA_SETTINGS;
  return {
    title: typeof v.title === "string" ? v.title : defaults.title,
    welcome: typeof v.welcome === "string" ? v.welcome : defaults.welcome,
    status_enabled:
      typeof v.status_enabled === "boolean" ? v.status_enabled : defaults.status_enabled,
    reports_enabled:
      typeof v.reports_enabled === "boolean" ? v.reports_enabled : defaults.reports_enabled,
    benefits_enabled:
      typeof v.benefits_enabled === "boolean" ? v.benefits_enabled : defaults.benefits_enabled,
    benefits_title:
      typeof v.benefits_title === "string" ? v.benefits_title : defaults.benefits_title,
    benefits_text: typeof v.benefits_text === "string" ? v.benefits_text : defaults.benefits_text,
  };
}
