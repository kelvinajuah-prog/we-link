-- Sign-up RLS (applied via Supabase MCP as welink_signup_rls)
-- Ensures authenticated users can insert own profile rows during registration.
-- Fixes legacy 'active' status policies to use 'approved'.

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS guest_profiles_insert ON public.guest_profiles;
CREATE POLICY guest_profiles_insert ON public.guest_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS pro_profiles_insert ON public.professional_profiles;
CREATE POLICY pro_profiles_insert ON public.professional_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS pro_public_active ON public.professional_profiles;
CREATE POLICY pro_public_active ON public.professional_profiles
  FOR SELECT TO anon, authenticated
  USING (status = 'approved');

DROP POLICY IF EXISTS profiles_public_active ON public.profiles;
CREATE POLICY profiles_public_active ON public.profiles
  FOR SELECT TO anon, authenticated
  USING (
    role = 'professional'
    AND id IN (
      SELECT profile_id FROM public.professional_profiles WHERE status = 'approved'
    )
  );
