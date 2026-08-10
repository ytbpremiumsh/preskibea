
UPDATE public.site_settings 
SET value = jsonb_set(
  value, 
  '{fields}', 
  (
    SELECT jsonb_agg(f)
    FROM (
      SELECT f FROM jsonb_array_elements(value->'fields') f WHERE f->>'id' != 'utility_bill_mandatory'
      UNION ALL
      SELECT '{"id": "utility_bill_mandatory", "key": "utility_bill_mandatory", "label": "Foto Pembayaran Listrik Terakhir (Wajib)", "required": true}'::jsonb
    ) sub
  )
)
WHERE key = 'form_berkas_ekonomi';

UPDATE public.site_settings 
SET value = jsonb_set(
  value, 
  '{fields}', 
  (
    SELECT jsonb_agg(f)
    FROM (
      SELECT f FROM jsonb_array_elements(value->'fields') f WHERE f->>'id' != 'utility_bill_mandatory'
      UNION ALL
      SELECT '{"id": "utility_bill_mandatory", "key": "utility_bill_mandatory", "label": "Foto Pembayaran Listrik Terakhir (Wajib)", "required": true}'::jsonb
    ) sub
  )
)
WHERE key = 'form_berkas_yatim';
