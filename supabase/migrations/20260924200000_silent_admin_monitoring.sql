-- Silent admin monitoring: admins read active conversations without participant consent.
-- Participants only send/read in their own active conversations (view-only for admin).

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
    OR from_id = auth.uid()
    OR to_id = auth.uid()
  );

DROP POLICY IF EXISTS messages_insert ON public.messages;
CREATE POLICY messages_insert ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    from_id = auth.uid()
    AND NOT is_admin()
    AND (
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
        connection_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.connections c
          WHERE c.id = connection_id
            AND (c.guest_id = auth.uid() OR c.pro_id = auth.uid())
        )
      )
    )
  );
