-- Stage 2: Auth RLS rewrite — least-privilege policies aligned to role matrix.
-- Replaces over-broad SELECT policies (e.g. profiles_select_authenticated, guest/pro SELECT true).

-- ---------------------------------------------------------------------------
-- Helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS profiles_select_authenticated ON public.profiles;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS profiles_select_admin ON public.profiles;
CREATE POLICY profiles_select_admin ON public.profiles
  FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS profiles_select_connection_peer ON public.profiles;
CREATE POLICY profiles_select_connection_peer ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE (c.guest_id = auth.uid() AND c.pro_id = profiles.id)
         OR (c.pro_id = auth.uid() AND c.guest_id = profiles.id)
    )
  );

-- profiles_insert_own, profiles_update_own, profiles_delete_admin, profiles_public_active unchanged

-- ---------------------------------------------------------------------------
-- guest_profiles
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS guest_profiles_select ON public.guest_profiles;

DROP POLICY IF EXISTS guest_profiles_select_own ON public.guest_profiles;
CREATE POLICY guest_profiles_select_own ON public.guest_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS guest_profiles_select_admin ON public.guest_profiles;
CREATE POLICY guest_profiles_select_admin ON public.guest_profiles
  FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS guest_profiles_select_participant ON public.guest_profiles;
CREATE POLICY guest_profiles_select_participant ON public.guest_profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.guest_id = guest_profiles.profile_id AND c.pro_id = auth.uid()
    )
  );

-- guest_profiles_insert, guest_profiles_update unchanged

-- ---------------------------------------------------------------------------
-- professional_profiles
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS pro_profiles_select ON public.professional_profiles;

DROP POLICY IF EXISTS pro_profiles_select_own ON public.professional_profiles;
CREATE POLICY pro_profiles_select_own ON public.professional_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS pro_profiles_select_admin ON public.professional_profiles;
CREATE POLICY pro_profiles_select_admin ON public.professional_profiles
  FOR SELECT TO authenticated
  USING (is_admin());

-- pro_profiles_insert, pro_profiles_update, pro_public_active unchanged

-- ---------------------------------------------------------------------------
-- connections
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS connections_insert ON public.connections;
CREATE POLICY connections_insert ON public.connections
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin()
    OR guest_id = auth.uid()
    OR (
      pro_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.professional_profiles pp
        WHERE pp.profile_id = auth.uid() AND pp.status = 'approved'
      )
    )
  );

-- connections_select unchanged

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS messages_insert ON public.messages;
CREATE POLICY messages_insert ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    from_id = auth.uid()
    AND (
      is_admin()
      OR (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'guest'
        )
        AND (
          connection_id IS NULL
          OR EXISTS (
            SELECT 1 FROM public.connections c
            WHERE c.id = connection_id AND c.guest_id = auth.uid()
          )
        )
      )
      OR (
        EXISTS (
          SELECT 1 FROM public.professional_profiles pp
          WHERE pp.profile_id = auth.uid() AND pp.status = 'approved'
        )
        AND (
          connection_id IS NULL
          OR EXISTS (
            SELECT 1 FROM public.connections c
            WHERE c.id = connection_id AND c.pro_id = auth.uid()
          )
        )
      )
    )
  );

-- messages_select unchanged

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY notifications_update ON public.notifications
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR is_admin())
  WITH CHECK (owner_id = auth.uid() OR is_admin());

-- notifications_insert (true), notifications_select unchanged

-- whatsapp_requests policies unchanged (already least-privilege)
