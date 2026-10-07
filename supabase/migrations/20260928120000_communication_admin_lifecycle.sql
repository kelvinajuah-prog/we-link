-- Admin-only communication lifecycle: ended requests + block participant status tampering

UPDATE public.communication_requests
SET status = 'accepted'
WHERE status NOT IN ('pending', 'accepted', 'rejected', 'cancelled', 'ended');

ALTER TABLE public.communication_requests
  DROP CONSTRAINT IF EXISTS communication_requests_status_check;

ALTER TABLE public.communication_requests
  ADD CONSTRAINT communication_requests_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'ended'));

CREATE OR REPLACE FUNCTION public.conversations_block_participant_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Only administrators can change conversation status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS conversations_status_guard ON public.conversations;
CREATE TRIGGER conversations_status_guard
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.conversations_block_participant_status_change();
