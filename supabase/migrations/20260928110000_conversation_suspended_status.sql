-- Admin can suspend granted guest ↔ pro conversations

ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_status_check;

ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_status_check
  CHECK (status IN ('active', 'closed', 'suspended'));
