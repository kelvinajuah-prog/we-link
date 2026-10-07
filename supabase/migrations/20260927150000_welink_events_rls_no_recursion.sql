-- Break RLS cycle: welink_events <-> welink_event_invitees policies referenced each other.

CREATE OR REPLACE FUNCTION public.welink_event_owned_by_user(p_event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.welink_events e
    WHERE e.id = p_event_id AND e.pro_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.welink_user_invited_to_event(p_event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.welink_event_invitees ei
    WHERE ei.event_id = p_event_id AND ei.guest_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.welink_event_owned_by_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.welink_user_invited_to_event(uuid) TO authenticated;

DROP POLICY IF EXISTS welink_event_invitees_select ON public.welink_event_invitees;
CREATE POLICY welink_event_invitees_select ON public.welink_event_invitees
  FOR SELECT TO authenticated
  USING (
    is_admin()
    OR guest_id = auth.uid()
    OR welink_event_owned_by_user(event_id)
  );

DROP POLICY IF EXISTS welink_event_invitees_insert ON public.welink_event_invitees;
CREATE POLICY welink_event_invitees_insert ON public.welink_event_invitees
  FOR INSERT TO authenticated
  WITH CHECK (welink_event_owned_by_user(event_id));

DROP POLICY IF EXISTS welink_event_invitees_delete ON public.welink_event_invitees;
CREATE POLICY welink_event_invitees_delete ON public.welink_event_invitees
  FOR DELETE TO authenticated
  USING (
    is_admin()
    OR welink_event_owned_by_user(event_id)
  );

DROP POLICY IF EXISTS welink_events_select ON public.welink_events;
CREATE POLICY welink_events_select ON public.welink_events
  FOR SELECT TO authenticated
  USING (
    is_admin()
    OR pro_id = auth.uid()
    OR welink_user_invited_to_event(id)
  );
