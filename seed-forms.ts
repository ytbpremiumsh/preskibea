import { supabase } from "@/integrations/supabase/client";
import { FormField, DocSlot } from "@/lib/form-schema";

const BASE_FIELDS: FormField[] = [
  { id: "full_name", name: "full_name", label: "Nama Lengkap", type: "text", required: true, standard: true },
  { id: "email", name: "email", label: "Email Aktif", type: "email", required: true, standard: true },
  { id: "whatsapp", name: "whatsapp", label: "Nomor WhatsApp", type: "tel", required: true, standard: true },
  { id: "birth_place", name: "birth_place", label: "Tempat Lahir", type: "text", required: true, standard: true },
  { id: "birth_date", name: "birth_date", label: "Tanggal Lahir", type: "date", required: true, standard: true },
  { id: "gender", name: "gender", label: "Jenis Kelamin", type: "select", required: true, standard: true, options: ["Laki-laki", "Perempuan"] },
  { id: "education_level", name: "education_level", label: "Jenjang Pendidikan", type: "select", required: true, standard: true, options: ["SMP/MTs", "SMA/SMK/MA", "Mahasiswa"] },
  { id: "school_name", name: "school_name", label: "Nama Sekolah / Kampus", type: "text", required: true, standard: true },
  { id: "grade", name: "grade", label: "Kelas / Semester", type: "text", required: true, standard: true },
];

const PRESTASI_DOCS: DocSlot[] = [
  { id: "identity", key: "identity", label: "Kartu Pelajar / Kartu Mahasiswa", required: true, accept: "image/*,application/pdf", maxSize: 5 },
  { id: "achievement_certs", key: "achievement_certs", label: "Sertifikat Prestasi (Akademik maupun Non-Akademik)", required: true, accept: "image/*,application/pdf", maxSize: 10 },
  { id: "transcript", key: "transcript", label: "Rapor / Transkrip Nilai Terakhir", required: true, accept: "image/*,application/pdf", maxSize: 5 },
  { id: "cv", key: "cv", label: "Curriculum Vitae (CV) Kreatif", required: true, accept: "image/*,application/pdf", maxSize: 5 },
];

const EKONOMI_DOCS: DocSlot[] = [
  { id: "identity", key: "identity", label: "Kartu Pelajar / Kartu Mahasiswa", required: true, accept: "image/*,application/pdf", maxSize: 5 },
  { id: "income_statement", key: "income_statement", label: "Surat Keterangan Penghasilan Orang Tua / Slip Gaji", required: true, accept: "image/*,application/pdf", maxSize: 5 },
  { id: "sktm", key: "sktm", label: "Surat Keterangan Tidak Mampu (SKTM)", required: true, accept: "image/*,application/pdf", maxSize: 5 },
  { id: "house_photos", key: "house_photos", label: "Foto Rumah (Tampak Depan & Ruang Tamu)", required: true, accept: "image/*,application/pdf", maxSize: 10 },
  { id: "utility_bill", key: "utility_bill", label: "Bukti Pembayaran Listrik/PBB", required: true, accept: "image/*,application/pdf", maxSize: 5 },
];

const UMUM_DOCS: DocSlot[] = [
  { id: "identity", key: "identity", label: "Kartu Pelajar / Kartu Mahasiswa", required: true, accept: "image/*,application/pdf", maxSize: 5 },
  { id: "transcript", key: "transcript", label: "Rapor / Transkrip Nilai Terakhir", required: true, accept: "image/*,application/pdf", maxSize: 5 },
  { id: "cv", key: "cv", label: "Curriculum Vitae (CV) / Portofolio Singkat", required: true, accept: "image/*,application/pdf", maxSize: 5 },
  { id: "video_motivation", key: "video_motivation", label: "Video Motivasi Diri (Link)", required: true, accept: "text", maxSize: 0 },
];

const YATIM_DOCS: DocSlot[] = [
  { id: "identity", key: "identity", label: "Kartu Pelajar / Kartu Mahasiswa", required: true, accept: "image/*,application/pdf", maxSize: 5 },
  { id: "orphan_letter", key: "orphan_letter", label: "Surat Keterangan Yatim / Piatu / Yatim Piatu", required: true, accept: "image/*,application/pdf", maxSize: 5 },
  { id: "death_cert", key: "death_cert", label: "Akta Kematian Orang Tua", required: true, accept: "image/*,application/pdf", maxSize: 5 },
  { id: "family_card", key: "family_card", label: "Kartu Keluarga (KK)", required: true, accept: "image/*,application/pdf", maxSize: 5 },
];

async function seed() {
  const settings = [
    { key: "form_pendaftaran_prestasi", value: { fields: BASE_FIELDS } },
    { key: "form_pendaftaran_ekonomi", value: { fields: [
      ...BASE_FIELDS,
      { id: "parent_income", name: "parent_income", label: "Penghasilan Orang Tua per Bulan", type: "select", required: true, standard: true, options: ["< Rp1.000.000", "Rp1.000.000 – Rp2.500.000", "Rp2.500.000 – Rp5.000.000", "> Rp5.000.000"] },
      { id: "dependents", name: "dependents", label: "Jumlah Tanggungan Keluarga", type: "number", required: true, standard: true },
    ] } },
    { key: "form_pendaftaran_umum", value: { fields: BASE_FIELDS } },
    { key: "form_pendaftaran_yatim", value: { fields: [
      ...BASE_FIELDS,
      { id: "orphan_status", name: "orphan_status", label: "Status", type: "select", required: true, standard: false, options: ["Yatim", "Yatim & Piatu"] },
      { id: "guardian_name", name: "guardian_name", label: "Nama Wali / Pengasuh", type: "text", required: true, standard: false },
      { id: "guardian_relation", name: "guardian_relation", label: "Hubungan dengan Wali", type: "text", required: true, standard: false },
    ] } },
    { key: "form_berkas_prestasi", value: { fields: PRESTASI_DOCS } },
    { key: "form_berkas_ekonomi", value: { fields: EKONOMI_DOCS } },
    { key: "form_berkas_umum", value: { fields: UMUM_DOCS } },
    { key: "form_berkas_yatim", value: { fields: YATIM_DOCS } },
  ];

  for (const s of settings) {
    await supabase.from("site_settings").upsert(s, { onConflict: "key" });
  }
}

seed().catch(console.error);
