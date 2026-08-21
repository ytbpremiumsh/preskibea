import json
import os
import requests
from datetime import datetime, timedelta

def add_days(date_str, days):
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        new_dt = dt + timedelta(days=days)
        return new_dt.strftime("%Y-%m-%d")
    except Exception:
        return date_str

# Fallback timeline
timeline = [
    { "title": "Pendaftaran Dibuka", "desc": "Calon peserta mengisi formulir pendaftaran beasiswa secara online.", "date": "2027-02-07", "startDate": "2026-08-12" },
    { "title": "Bagikan Poster", "desc": "Peserta membagikan poster beasiswa ke media sosial sebagai bagian dari tahapan seleksi.", "date": "2027-02-07", "startDate": "2026-08-12" },
    { "title": "Pengiriman Essai", "desc": "Lengkapi pertanyaan esai yang tersedia sebagai syarat untuk melanjutkan ke tahap berkas administrasi", "date": "2027-02-07", "startDate": "2026-08-12" },
    { "title": "Berkas Administrasi", "desc": "Peserta mengunggah seluruh berkas pendukung sesuai persyaratan yang ditentukan.", "date": "2027-02-07", "startDate": "2026-08-12" },
    { "title": "Seleksi Administrasi", "desc": "Tim panitia memeriksa kelengkapan data dan keabsahan berkas pendaftar.", "date": "2027-02-12", "startDate": "2027-02-08" },
    { "title": "Verifikasi", "desc": "Validasi akhir terhadap dokumen dan data peserta yang lolos administrasi.", "date": "2027-02-26", "startDate": "2027-02-13" },
    { "title": "Pengumuman Kandidat", "desc": "Pengumuman peserta yang lolos sebagai kandidat dan berhak mengikuti TPA.", "date": "2027-02-27", "startDate": "2027-02-27", "singleDay": True },
    { "title": "Tes Potensi Akademik (TPA)", "desc": "Peserta mengikuti tes online serentak untuk mengukur kemampuan akademik.", "date": "2027-03-04", "startDate": "2027-03-04", "singleDay": True },
    { "title": "Pengumuman Finalis", "desc": "Pengumuman peserta yang lolos sebagai finalis penerima beasiswa.", "date": "2027-03-11", "startDate": "2027-03-11", "singleDay": True },
    { "title": "Awarding", "desc": "Penyerahan beasiswa dan merchandise resmi kepada para penerima.", "date": "2027-03-25", "startDate": "2027-03-25", "singleDay": True },
]

updated_timeline = []
for stage in timeline:
    new_stage = stage.copy()
    if stage["date"] >= "2027-02-07":
        new_stage["date"] = add_days(stage["date"], 7)
    if stage["startDate"] >= "2027-02-08":
         new_stage["startDate"] = add_days(stage["startDate"], 7)
    updated_timeline.append(new_stage)

# Pendaftaran end is the 'date' of the first stage
pendaftaran_end = updated_timeline[0]["date"]

print(f"UPDATE public.site_settings SET value = '{json.dumps(updated_timeline)}' WHERE key = 'timeline';")
print(f"UPDATE public.site_settings SET value = value || '{{\"deadline\": \"{pendaftaran_end}T23:59:59\"}}'::jsonb WHERE key = 'countdown';")
