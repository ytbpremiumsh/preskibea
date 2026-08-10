INSERT INTO public.site_settings (key, value) VALUES 
('form_pendaftaran_prestasi', '{
  "fields": [
    {"id": "full_name", "name": "full_name", "label": "Nama Lengkap", "type": "text", "required": true, "standard": true},
    {"id": "email", "name": "email", "label": "Email Aktif", "type": "email", "required": true, "standard": true},
    {"id": "whatsapp", "name": "whatsapp", "label": "Nomor WhatsApp", "type": "tel", "required": true, "standard": true},
    {"id": "birth_place", "name": "birth_place", "label": "Tempat Lahir", "type": "text", "required": true, "standard": true},
    {"id": "birth_date", "name": "birth_date", "label": "Tanggal Lahir", "type": "date", "required": true, "standard": true},
    {"id": "gender", "name": "gender", "label": "Jenis Kelamin", "type": "select", "required": true, "standard": true, "options": ["Laki-laki", "Perempuan"]},
    {"id": "education_level", "name": "education_level", "label": "Jenjang Pendidikan", "type": "select", "required": true, "standard": true, "options": ["SMP/MTs", "SMA/SMK/MA", "Mahasiswa"]},
    {"id": "school_name", "name": "school_name", "label": "Nama Sekolah / Kampus", "type": "text", "required": true, "standard": true},
    {"id": "grade", "name": "grade", "label": "Kelas / Semester", "type": "text", "required": true, "standard": true}
  ]
}'::jsonb),
('form_pendaftaran_ekonomi', '{
  "fields": [
    {"id": "full_name", "name": "full_name", "label": "Nama Lengkap", "type": "text", "required": true, "standard": true},
    {"id": "email", "name": "email", "label": "Email Aktif", "type": "email", "required": true, "standard": true},
    {"id": "whatsapp", "name": "whatsapp", "label": "Nomor WhatsApp", "type": "tel", "required": true, "standard": true},
    {"id": "birth_place", "name": "birth_place", "label": "Tempat Lahir", "type": "text", "required": true, "standard": true},
    {"id": "birth_date", "name": "birth_date", "label": "Tanggal Lahir", "type": "date", "required": true, "standard": true},
    {"id": "gender", "name": "gender", "label": "Jenis Kelamin", "type": "select", "required": true, "standard": true, "options": ["Laki-laki", "Perempuan"]},
    {"id": "education_level", "name": "education_level", "label": "Jenjang Pendidikan", "type": "select", "required": true, "standard": true, "options": ["SMP/MTs", "SMA/SMK/MA", "Mahasiswa"]},
    {"id": "school_name", "name": "school_name", "label": "Nama Sekolah / Kampus", "type": "text", "required": true, "standard": true},
    {"id": "grade", "name": "grade", "label": "Kelas / Semester", "type": "text", "required": true, "standard": true},
    {"id": "parent_income", "name": "parent_income", "label": "Penghasilan Orang Tua per Bulan", "type": "select", "required": true, "standard": true, "options": ["< Rp1.000.000", "Rp1.000.000 – Rp2.500.000", "Rp2.500.000 – Rp5.000.000", "> Rp5.000.000"]},
    {"id": "dependents", "name": "dependents", "label": "Jumlah Tanggungan Keluarga", "type": "number", "required": true, "standard": true}
  ]
}'::jsonb),
('form_pendaftaran_umum', '{
  "fields": [
    {"id": "full_name", "name": "full_name", "label": "Nama Lengkap", "type": "text", "required": true, "standard": true},
    {"id": "email", "name": "email", "label": "Email Aktif", "type": "email", "required": true, "standard": true},
    {"id": "whatsapp", "name": "whatsapp", "label": "Nomor WhatsApp", "type": "tel", "required": true, "standard": true},
    {"id": "birth_place", "name": "birth_place", "label": "Tempat Lahir", "type": "text", "required": true, "standard": true},
    {"id": "birth_date", "name": "birth_date", "label": "Tanggal Lahir", "type": "date", "required": true, "standard": true},
    {"id": "gender", "name": "gender", "label": "Jenis Kelamin", "type": "select", "required": true, "standard": true, "options": ["Laki-laki", "Perempuan"]},
    {"id": "education_level", "name": "education_level", "label": "Jenjang Pendidikan", "type": "select", "required": true, "standard": true, "options": ["SMP/MTs", "SMA/SMK/MA", "Mahasiswa"]},
    {"id": "school_name", "name": "school_name", "label": "Nama Sekolah / Kampus", "type": "text", "required": true, "standard": true},
    {"id": "grade", "name": "grade", "label": "Kelas / Semester", "type": "text", "required": true, "standard": true}
  ]
}'::jsonb),
('form_pendaftaran_yatim', '{
  "fields": [
    {"id": "full_name", "name": "full_name", "label": "Nama Lengkap", "type": "text", "required": true, "standard": true},
    {"id": "email", "name": "email", "label": "Email Aktif", "type": "email", "required": true, "standard": true},
    {"id": "whatsapp", "name": "whatsapp", "label": "Nomor WhatsApp", "type": "tel", "required": true, "standard": true},
    {"id": "birth_place", "name": "birth_place", "label": "Tempat Lahir", "type": "text", "required": true, "standard": true},
    {"id": "birth_date", "name": "birth_date", "label": "Tanggal Lahir", "type": "date", "required": true, "standard": true},
    {"id": "gender", "name": "gender", "label": "Jenis Kelamin", "type": "select", "required": true, "standard": true, "options": ["Laki-laki", "Perempuan"]},
    {"id": "education_level", "name": "education_level", "label": "Jenjang Pendidikan", "type": "select", "required": true, "standard": true, "options": ["SMP/MTs", "SMA/SMK/MA", "Mahasiswa"]},
    {"id": "school_name", "name": "school_name", "label": "Nama Sekolah / Kampus", "type": "text", "required": true, "standard": true},
    {"id": "grade", "name": "grade", "label": "Kelas / Semester", "type": "text", "required": true, "standard": true},
    {"id": "orphan_status", "name": "orphan_status", "label": "Status", "type": "select", "required": true, "standard": false, "options": ["Yatim", "Yatim & Piatu"]},
    {"id": "guardian_name", "name": "guardian_name", "label": "Nama Wali / Pengasuh", "type": "text", "required": true, "standard": false},
    {"id": "guardian_relation", "name": "guardian_relation", "label": "Hubungan dengan Wali", "type": "text", "required": true, "standard": false}
  ]
}'::jsonb),
('form_berkas_prestasi', '{
  "fields": [
    {"id": "identity", "key": "identity", "label": "Kartu Pelajar / Kartu Mahasiswa", "required": true},
    {"id": "achievement_certs", "key": "achievement_certs", "label": "Sertifikat Prestasi (Akademik maupun Non-Akademik)", "required": true},
    {"id": "transcript", "key": "transcript", "label": "Rapor / Transkrip Nilai Terakhir", "required": true},
    {"id": "cv", "key": "cv", "label": "Curriculum Vitae (CV) Kreatif", "required": true}
  ]
}'::jsonb),
('form_berkas_ekonomi', '{
  "fields": [
    {"id": "identity", "key": "identity", "label": "Kartu Pelajar / Kartu Mahasiswa", "required": true},
    {"id": "income_statement", "key": "income_statement", "label": "Surat Keterangan Penghasilan Orang Tua / Slip Gaji", "required": true},
    {"id": "sktm", "key": "sktm", "label": "Surat Keterangan Tidak Mampu (SKTM)", "required": true},
    {"id": "house_photos", "key": "house_photos", "label": "Foto Rumah (Tampak Depan & Ruang Tamu)", "required": true},
    {"id": "utility_bill", "key": "utility_bill", "label": "Bukti Pembayaran Listrik/PBB", "required": true}
  ]
}'::jsonb),
('form_berkas_umum', '{
  "fields": [
    {"id": "identity", "key": "identity", "label": "Kartu Pelajar / Kartu Mahasiswa", "required": true},
    {"id": "transcript", "key": "transcript", "label": "Rapor / Transkrip Nilai Terakhir", "required": true},
    {"id": "cv", "key": "cv", "label": "Curriculum Vitae (CV) / Portofolio Singkat", "required": true},
    {"id": "video_motivation", "key": "video_motivation", "label": "Video Motivasi Diri (Link)", "required": true}
  ]
}'::jsonb),
('form_berkas_yatim', '{
  "fields": [
    {"id": "identity", "key": "identity", "label": "Kartu Pelajar / Kartu Mahasiswa", "required": true},
    {"id": "orphan_letter", "key": "orphan_letter", "label": "Surat Keterangan Yatim / Piatu / Yatim Piatu", "required": true},
    {"id": "death_cert", "key": "death_cert", "label": "Akta Kematian Orang Tua", "required": true},
    {"id": "family_card", "key": "family_card", "label": "Kartu Keluarga (KK)", "required": true}
  ]
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
