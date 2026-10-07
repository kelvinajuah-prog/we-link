-- Guest / professional ↔ admin support requests and conversations

CREATE TABLE public.admin_support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requester_role text NOT NULL CHECK (requester_role IN ('guest', 'professional')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'ended')),
  rejected_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX admin_support_requests_requester_idx
  ON public.admin_support_requests (requester_id, created_at DESC);

CREATE TABLE public.admin_support_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid UNIQUE REFERENCES public.admin_support_requests(id) ON DELETE SET NULL,
  participant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_role text NOT NULL CHECK (participant_role IN ('guest', 'professional')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'closed')),
  initiated_by text NOT NULL DEFAULT 'request'
    CHECK (initiated_by IN ('request', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX admin_support_conversations_participant_idx
  ON public.admin_support_conversations (participant_id, created_at DESC);

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS admin_support_conversation_id uuid
  REFERENCES public.admin_support_conversations(id) ON DELETE SET NULL;

CREATE INDEX messages_admin_support_conversation_idx
  ON public.messages (admin_support_conversation_id, created_at);

ALTER TABLE public.admin_support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_support_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_support_requests_select ON public.admin_support_requests
  FOR SELECT TO authenticated
  USING (is_admin() OR requester_id = auth.uid());

CREATE POLICY admin_support_requests_insert ON public.admin_support_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    requester_id = auth.uid()
    AND requester_role IN ('guest', 'professional')
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = requester_role
    )
  );

CREATE POLICY admin_support_requests_update ON public.admin_support_requests
  FOR UPDATE TO authenticated
  USING (
    is_admin()
    OR (requester_id = auth.uid() AND status = 'pending')
  )
  WITH CHECK (
    is_admin()
    OR requester_id = auth.uid()
  );

CREATE POLICY admin_support_conversations_select ON public.admin_support_conversations
  FOR SELECT TO authenticated
  USING (is_admin() OR participant_id = auth.uid());

CREATE POLICY admin_support_conversations_insert ON public.admin_support_conversations
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY admin_support_conversations_update ON public.admin_support_conversations
  FOR UPDATE TO authenticated
  USING (is_admin() OR participant_id = auth.uid())
  WITH CHECK (is_admin() OR participant_id = auth.uid());

CREATE OR REPLACE FUNCTION public.admin_support_conversations_block_participant_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Only administrators can change support conversation status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_support_conversations_status_guard ON public.admin_support_conversations;
CREATE TRIGGER admin_support_conversations_status_guard
  BEFORE UPDATE ON public.admin_support_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.admin_support_conversations_block_participant_status_change();

DROP POLICY IF EXISTS messages_select ON public.messages;
CREATE POLICY messages_select ON public.messages
  FOR SELECT TO authenticated
  USING (
    (
      conversation_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.conversations cv
        WHERE cv.id = conversation_id
          AND cv.status = 'active'
          AND (cv.guest_id = auth.uid() OR cv.pro_id = auth.uid())
      )
    )
    OR (
      is_admin()
      AND conversation_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.conversations cv
        WHERE cv.id = conversation_id
          AND cv.status = 'active'
      )
    )
    OR (
      admin_support_conversation_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.admin_support_conversations sc
        WHERE sc.id = admin_support_conversation_id
          AND (sc.participant_id = auth.uid() OR is_admin())
      )
    )
    OR from_id = auth.uid()
    OR to_id = auth.uid()
  );

DROP POLICY IF EXISTS messages_insert ON public.messages;
CREATE POLICY messages_insert ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    from_id = auth.uid()
    AND (
      (
        NOT is_admin()
        AND conversation_id IS NOT NULL
        AND admin_support_conversation_id IS NULL
        AND EXISTS (
          SELECT 1 FROM public.conversations cv
          WHERE cv.id = conversation_id
            AND cv.status = 'active'
            AND (cv.guest_id = auth.uid() OR cv.pro_id = auth.uid())
        )
      )
      OR (
        NOT is_admin()
        AND admin_support_conversation_id IS NOT NULL
        AND conversation_id IS NULL
        AND EXISTS (
          SELECT 1 FROM public.admin_support_conversations sc
          WHERE sc.id = admin_support_conversation_id
            AND sc.status = 'active'
            AND sc.participant_id = auth.uid()
        )
      )
      OR (
        is_admin()
        AND admin_support_conversation_id IS NOT NULL
        AND conversation_id IS NULL
        AND EXISTS (
          SELECT 1 FROM public.admin_support_conversations sc
          WHERE sc.id = admin_support_conversation_id
            AND sc.status = 'active'
        )
      )
      OR (
        NOT is_admin()
        AND connection_id IS NOT NULL
        AND conversation_id IS NULL
        AND admin_support_conversation_id IS NULL
        AND EXISTS (
          SELECT 1 FROM public.connections c
          WHERE c.id = connection_id
            AND (c.guest_id = auth.uid() OR c.pro_id = auth.uid())
        )
      )
    )
  );
