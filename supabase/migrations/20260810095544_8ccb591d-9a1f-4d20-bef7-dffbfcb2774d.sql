-- Update Ekonomi track requirements
UPDATE public.site_settings 
SET value = jsonb_set(
  value, 
  '{fields}', 
  (
    SELECT jsonb_agg(
      CASE 
        WHEN field->>'key' = 'utility_bill' THEN 
          field || '{"label": "Foto Pembayaran Listrik Terakhir ( Wajib )", "required": true}'::jsonb
        ELSE field
      END
    )
    FROM jsonb_array_elements(value->'fields') AS field
  )
)
WHERE key = 'form_berkas_ekonomi';

-- Ensure it exists in Ekonomi if for some reason it wasn't there
UPDATE public.site_settings
SET value = jsonb_set(
  value,
  '{fields}',
  (value->'fields') || '[{"id": "utility_bill", "key": "utility_bill", "label": "Foto Pembayaran Listrik Terakhir ( Wajib )", "required": true}]'::jsonb
)
WHERE key = 'form_berkas_ekonomi' 
  AND NOT (value->'fields' @> '[{"key": "utility_bill"}]');


-- Update Yatim track requirements
UPDATE public.site_settings
SET value = jsonb_set(
  value,
  '{fields}',
  (value->'fields') || '[{"id": "utility_bill", "key": "utility_bill", "label": "Foto Pembayaran Listrik Terakhir ( Wajib )", "required": true}]'::jsonb
)
WHERE key = 'form_berkas_yatim'
  AND NOT (value->'fields' @> '[{"key": "utility_bill"}]');

-- If it already exists in Yatim but with different label/required status, update it
UPDATE public.site_settings 
SET value = jsonb_set(
  value, 
  '{fields}', 
  (
    SELECT jsonb_agg(
      CASE 
        WHEN field->>'key' = 'utility_bill' THEN 
          field || '{"label": "Foto Pembayaran Listrik Terakhir ( Wajib )", "required": true}'::jsonb
        ELSE field
      END
    )
    FROM jsonb_array_elements(value->'fields') AS field
  )
)
WHERE key = 'form_berkas_yatim'
  AND (value->'fields' @> '[{"key": "utility_bill"}]');
