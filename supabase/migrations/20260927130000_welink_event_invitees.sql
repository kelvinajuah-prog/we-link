-- Invite-only event guests + tighten event visibility

CREATE TABLE IF NOT EXISTS public.welink_event_invitees (
  event_id uuid NOT NULL REFERENCES public.welink_events(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, guest_id)
);

CREATE INDEX IF NOT EXISTS welink_event_invitees_guest_id_idx
  ON public.welink_event_invitees (guest_id);

ALTER TABLE public.welink_event_invitees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS welink_event_invitees_select ON public.welink_event_invitees;
CREATE POLICY welink_event_invitees_select ON public.welink_event_invitees
  FOR SELECT TO authenticated
  USING (
    is_admin()
    OR guest_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.welink_events e
      WHERE e.id = welink_event_invitees.event_id AND e.pro_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS welink_event_invitees_insert ON public.welink_event_invitees;
CREATE POLICY welink_event_invitees_insert ON public.welink_event_invitees
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.welink_events e
      WHERE e.id = event_id AND e.pro_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS welink_event_invitees_delete ON public.welink_event_invitees;
CREATE POLICY welink_event_invitees_delete ON public.welink_event_invitees
  FOR DELETE TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM public.welink_events e
      WHERE e.id = welink_event_invitees.event_id AND e.pro_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS welink_events_select ON public.welink_events;
CREATE POLICY welink_events_select ON public.welink_events
  FOR SELECT TO authenticated
  USING (
    is_admin()
    OR pro_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.welink_event_invitees ei
      WHERE ei.event_id = welink_events.id AND ei.guest_id = auth.uid()
    )
  );
