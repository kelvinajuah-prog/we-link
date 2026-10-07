-- Admin may delete ended communication records (UI cleanup; does not grant access)

DROP POLICY IF EXISTS communication_requests_delete_admin ON public.communication_requests;
CREATE POLICY communication_requests_delete_admin ON public.communication_requests
  FOR DELETE TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS conversations_delete_admin ON public.conversations;
CREATE POLICY conversations_delete_admin ON public.conversations
  FOR DELETE TO authenticated
  USING (is_admin());
