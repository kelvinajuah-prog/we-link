-- Professional events + chat image attachments

CREATE TABLE IF NOT EXISTS public.welink_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  event_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'paused', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS welink_events_pro_id_idx ON public.welink_events (pro_id);
CREATE INDEX IF NOT EXISTS welink_events_event_at_idx ON public.welink_events (event_at);

ALTER TABLE public.welink_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS welink_events_select ON public.welink_events;
CREATE POLICY welink_events_select ON public.welink_events
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS welink_events_insert ON public.welink_events;
CREATE POLICY welink_events_insert ON public.welink_events
  FOR INSERT TO authenticated
  WITH CHECK (
    pro_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'professional'
    )
  );

DROP POLICY IF EXISTS welink_events_update_pro ON public.welink_events;
CREATE POLICY welink_events_update_pro ON public.welink_events
  FOR UPDATE TO authenticated
  USING (pro_id = auth.uid())
  WITH CHECK (pro_id = auth.uid());

DROP POLICY IF EXISTS welink_events_update_admin ON public.welink_events;
CREATE POLICY welink_events_update_admin ON public.welink_events
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS image_url text;
