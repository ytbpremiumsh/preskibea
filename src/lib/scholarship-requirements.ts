export type ScholarshipKind = "prestasi" | "ekonomi" | "umum" | "yatim";

// Shared with the category pages so the registration summary stays in sync.
export const scholarshipRequirements = [
  "Warga Negara Indonesia (WNI)",
  "Tinggal di Indonesia",
  "Pelajar aktif SMP/MTs sederajat",
  "Pelajar aktif SMA/SMK/MA sederajat",
  "Mahasiswa aktif atau calon mahasiswa D3–S2",
  "Tanpa minimal nilai rapor atau IPK",
  "Mengikuti seluruh persyaratan yang ditetapkan",
];

export const scholarshipDetails: Record<ScholarshipKind, { label: string; description: string; documents: string }> = {
  prestasi: {
    label: "Prestasi",
    description: "Untuk pelajar dan mahasiswa dengan prestasi akademik maupun non-akademik.",
    documents: "Sertifikat prestasi, CV, kartu pelajar atau mahasiswa, dan esai sesuai tema.",
  },
  ekonomi: {
    label: "Ekonomi",
    description: "Untuk pelajar dan mahasiswa yang membutuhkan dukungan finansial untuk pendidikan.",
    documents: "SKTM, bukti penghasilan, kartu pelajar atau mahasiswa, dan esai sesuai tema.",
  },
  umum: {
    label: "Umum",
    description: "Terbuka bagi pelajar dan mahasiswa tanpa syarat prestasi khusus atau kriteria ekonomi tertentu.",
    documents: "Rapor atau transkrip, kartu pelajar atau mahasiswa, dan esai sesuai tema.",
  },
  yatim: {
    label: "Yatim",
    description: "Untuk pelajar dan mahasiswa yatim, piatu, maupun yatim piatu.",
    documents: "Rapor atau transkrip, kartu pelajar atau mahasiswa, dan esai sesuai tema.",
  },
};
