-- Update countdown settings to reflect H-20 before registration closes (Feb 7, 2027)
-- We'll set the deadline to 2027-02-07 23:59:59
-- And update the title and subtitle to be more specific.

UPDATE public.site_settings
SET value = '{
  "deadline": "2027-02-07T23:59:59",
  "title": "Pendaftaran Batch #8",
  "subtitle": "Kesempatan terakhir untuk meraih masa depan gemilang bersama Beasiswa Prestasi Kita."
}'::jsonb
WHERE key = 'countdown';

-- If it doesn't exist, insert it (though it should based on previous context)
INSERT INTO public.site_settings (key, value)
SELECT 'countdown', '{
  "deadline": "2027-02-07T23:59:59",
  "title": "Pendaftaran Batch #8",
  "subtitle": "Kesempatan terakhir untuk meraih masa depan gemilang bersama Beasiswa Prestasi Kita."
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'countdown');
