export type FieldType = "text" | "email" | "tel" | "textarea" | "select" | "date" | "number" | "file";

export type FormField = {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  standard?: boolean; // mapped to a real DB column on registrations
  placeholder?: string;
  options?: string[]; // for select
  accept?: string; // for file
  maxSize?: number; // MB for file
};

export type FormSchema = { fields: FormField[] };

export type DocSlot = {
  id: string;
  key: string;
  label: string;
  required?: boolean;
  accept?: string;
  maxSize?: number; // MB
  type?: "url" | "select";
  options?: { label: string; value: string }[];
  placeholder?: string;
};

export type BerkasSchema = { fields: DocSlot[] };

export const STANDARD_REG_COLUMNS = new Set([
  "full_name", "birth_place", "birth_date", "gender", "address", "whatsapp", "email",
  "education_level", "school_name", "grade", "main_achievement", "parent_income", "dependents",
  "photo_url", "student_card_url",
]);

export function genId(prefix = "f") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
