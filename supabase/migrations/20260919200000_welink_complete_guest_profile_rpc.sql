-- Secure profile completion RPC for authenticated guests missing guest_profiles rows.
CREATE OR REPLACE FUNCTION public.complete_guest_profile(
  p_name text,
  p_age integer,
  p_town text,
  p_area text,
  p_specialization text,
  p_skills text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = uid AND role = 'guest') THEN
    INSERT INTO public.profiles (id, email, name, role)
    SELECT uid, u.email, COALESCE(NULLIF(trim(p_name), ''), u.email), 'guest'
    FROM auth.users u
    WHERE u.id = uid;
  ELSE
    UPDATE public.profiles
    SET name = COALESCE(NULLIF(trim(p_name), ''), name)
    WHERE id = uid;
  END IF;

  INSERT INTO public.guest_profiles (profile_id, age, town, area, specialization, skills)
  VALUES (
    uid,
    p_age,
    NULLIF(trim(p_town), ''),
    NULLIF(trim(p_area), ''),
    NULLIF(trim(p_specialization), ''),
    COALESCE(NULLIF(trim(p_skills), ''), '')
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    age = EXCLUDED.age,
    town = EXCLUDED.town,
    area = EXCLUDED.area,
    specialization = EXCLUDED.specialization,
    skills = EXCLUDED.skills;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_guest_profile(text, integer, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_guest_profile(text, integer, text, text, text, text) TO authenticated;
