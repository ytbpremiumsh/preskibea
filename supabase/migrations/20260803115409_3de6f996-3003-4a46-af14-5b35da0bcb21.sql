ALTER TYPE public.scholarship_kind ADD VALUE IF NOT EXISTS 'yatim';

CREATE OR REPLACE FUNCTION public.generate_registration_token(p_kind text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  prefix text;
  chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  candidate text;
  i int;
BEGIN
  prefix := CASE
    WHEN p_kind = 'prestasi' THEN 'KP-PRE-'
    WHEN p_kind = 'ekonomi' THEN 'KP-EKO-'
    WHEN p_kind = 'umum' THEN 'KP-UMU-'
    WHEN p_kind = 'yatim' THEN 'KP-YAT-'
    ELSE 'KP-PRE-'
  END;
  LOOP
    candidate := prefix;
    FOR i IN 1..6 LOOP
      candidate := candidate || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.registrations WHERE token = candidate);
  END LOOP;
  RETURN candidate;
END$function$;