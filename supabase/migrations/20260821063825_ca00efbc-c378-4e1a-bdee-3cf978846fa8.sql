UPDATE site_settings 
SET value = '[
  {"title": "Pendaftaran Dibuka", "desc": "Calon peserta mengisi formulir pendaftaran beasiswa secara online.", "date": "2027-02-07", "startDate": "2026-08-12"},
  {"title": "Bagikan Poster", "desc": "Peserta membagikan poster beasiswa ke media sosial sebagai bagian dari tahapan seleksi.", "date": "2027-02-07", "startDate": "2026-08-12"},
  {"title": "Pengiriman Essai", "desc": "Lengkapi pertanyaan esai yang tersedia sebagai syarat untuk melanjutkan ke tahap berkas administrasi", "date": "2027-02-07", "startDate": "2026-08-12"},
  {"title": "Berkas Administrasi", "desc": "Peserta mengunggah seluruh berkas pendukung sesuai persyaratan yang ditentukan.", "date": "2027-02-07", "startDate": "2026-08-12"},
  {"title": "Seleksi Administrasi", "desc": "Tim panitia memeriksa kelengkapan data dan keabsahan berkas pendaftar.", "date": "2027-02-12", "startDate": "2027-02-08"},
  {"title": "Verifikasi", "desc": "Validasi akhir terhadap dokumen dan data peserta yang lolos administrasi.", "date": "2027-02-26", "startDate": "2027-02-13"},
  {"title": "Pengumuman Kandidat", "desc": "Pengumuman peserta yang lolos sebagai kandidat dan berhak mengikuti TPA.", "date": "2027-02-27", "startDate": "2027-02-27", "singleDay": true},
  {"title": "Tes Potensi Akademik (TPA)", "desc": "Peserta mengikuti tes online serentak untuk mengukur kemampuan akademik.", "date": "2027-03-04", "startDate": "2027-03-04", "singleDay": true},
  {"title": "Pengumuman Finalis", "desc": "Pengumuman peserta yang lolos sebagai finalis penerima beasiswa.", "date": "2027-03-11", "startDate": "2027-03-11", "singleDay": true},
  {"title": "Awarding", "desc": "Penyerahan beasiswa dan merchandise resmi kepada para penerima.", "date": "2027-03-25", "startDate": "2027-03-25", "singleDay": true}
]'::jsonb
WHERE key = 'timeline';

UPDATE site_settings
SET value = '"2027-02-07"'::jsonb
WHERE key = 'countdown_deadline';