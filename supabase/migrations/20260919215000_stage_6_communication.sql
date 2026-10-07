-- Stage 6: communication requests + conversations (prerequisite for Stage 7 Realtime)

DROP TABLE IF EXISTS public.communication_requests CASCADE;

CREATE TABLE public.communication_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pro_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  rejected_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX communication_requests_guest_pro_idx
  ON public.communication_requests (guest_id, pro_id);

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  communication_request_id uuid UNIQUE REFERENCES public.communication_requests(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pro_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'closed')),
  monitoring_consent_guest boolean NOT NULL DEFAULT false,
  monitoring_consent_pro boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX conversations_guest_pro_idx ON public.conversations (guest_id, pro_id);

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL;

-- Legacy connections → conversations (empty DB safe; preserves future rows)
INSERT INTO public.communication_requests (guest_id, pro_id, status, responded_at, created_at)
SELECT c.guest_id, c.pro_id, 'accepted', c.created_at, c.created_at
FROM public.connections c
WHERE NOT EXISTS (
  SELECT 1 FROM public.communication_requests cr
  WHERE cr.guest_id = c.guest_id AND cr.pro_id = c.pro_id
);

INSERT INTO public.conversations (
  communication_request_id, guest_id, pro_id, status,
  monitoring_consent_guest, monitoring_consent_pro, created_at
)
SELECT cr.id, cr.guest_id, cr.pro_id, 'active', false, false, cr.created_at
FROM public.communication_requests cr
WHERE cr.status = 'accepted'
  AND NOT EXISTS (
    SELECT 1 FROM public.conversations cv WHERE cv.communication_request_id = cr.id
  );

UPDATE public.messages m
SET conversation_id = cv.id
FROM public.connections c
JOIN public.conversations cv ON cv.guest_id = c.guest_id AND cv.pro_id = c.pro_id
WHERE m.connection_id = c.id AND m.conversation_id IS NULL;

ALTER TABLE public.communication_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- communication_requests policies
CREATE POLICY communication_requests_select ON public.communication_requests
  FOR SELECT TO authenticated
  USING (
    is_admin()
    OR guest_id = auth.uid()
    OR pro_id = auth.uid()
  );

CREATE POLICY communication_requests_insert ON public.communication_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    guest_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'guest')
  );

CREATE POLICY communication_requests_update ON public.communication_requests
  FOR UPDATE TO authenticated
  USING (
    is_admin()
    OR (guest_id = auth.uid() AND status = 'pending')
    OR (pro_id = auth.uid())
  )
  WITH CHECK (
    is_admin()
    OR guest_id = auth.uid()
    OR pro_id = auth.uid()
  );

-- conversations policies
CREATE POLICY conversations_select ON public.conversations
  FOR SELECT TO authenticated
  USING (
    is_admin()
    OR guest_id = auth.uid()
    OR pro_id = auth.uid()
  );

CREATE POLICY conversations_update ON public.conversations
  FOR UPDATE TO authenticated
  USING (guest_id = auth.uid() OR pro_id = auth.uid() OR is_admin())
  WITH CHECK (guest_id = auth.uid() OR pro_id = auth.uid() OR is_admin());

CREATE POLICY conversations_insert ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin()
    OR pro_id = auth.uid()
  );

-- messages: admin read when dual consent; participants always
DROP POLICY IF EXISTS messages_select ON public.messages;
CREATE POLICY messages_select ON public.messages
  FOR SELECT TO authenticated
  USING (
    from_id = auth.uid()
    OR to_id = auth.uid()
    OR (
      is_admin()
      AND conversation_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.conversations cv
        WHERE cv.id = conversation_id
          AND cv.monitoring_consent_guest = true
          AND cv.monitoring_consent_pro = true
      )
    )
    OR (
      conversation_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.conversations cv
        WHERE cv.id = conversation_id
          AND (cv.guest_id = auth.uid() OR cv.pro_id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS messages_insert ON public.messages;
CREATE POLICY messages_insert ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    from_id = auth.uid()
    AND (
      is_admin()
      OR (
        conversation_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.conversations cv
          WHERE cv.id = conversation_id
            AND cv.status = 'active'
            AND (cv.guest_id = auth.uid() OR cv.pro_id = auth.uid())
        )
      )
      OR (
        connection_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.connections c
          WHERE c.id = connection_id
            AND (c.guest_id = auth.uid() OR c.pro_id = auth.uid())
        )
      )
    )
  );
