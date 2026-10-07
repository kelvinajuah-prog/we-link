-- Multiple skills for professionals (comma-separated list; primary remains in skill)

ALTER TABLE public.professional_profiles
  ADD COLUMN IF NOT EXISTS skills text NOT NULL DEFAULT '';

UPDATE public.professional_profiles
SET skills = skill
WHERE (skills IS NULL OR trim(skills) = '') AND skill IS NOT NULL AND trim(skill) <> '';
