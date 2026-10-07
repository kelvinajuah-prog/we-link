-- Event invitation workflow: username, invite status, searchable guests, notification meta

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text;

UPDATE public.profiles
SET username = lower(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'))
WHERE username IS NULL AND email IS NOT NULL AND trim(email) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL AND trim(username) <> '';

ALTER TABLE public.welink_event_invitees
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined'));

ALTER TABLE public.welink_event_invitees
  ADD COLUMN IF NOT EXISTS responded_at timestamptz;

UPDATE public.welink_event_invitees SET status = 'accepted' WHERE status = 'pending';

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS kind text;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS meta jsonb;

DROP POLICY IF EXISTS welink_event_invitees_update_guest ON public.welink_event_invitees;
CREATE POLICY welink_event_invitees_update_guest ON public.welink_event_invitees
  FOR UPDATE TO authenticated
  USING (guest_id = auth.uid())
  WITH CHECK (guest_id = auth.uid());

CREATE OR REPLACE FUNCTION public.search_guests_for_invite(p_query text DEFAULT '')
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  username text,
  photo_url text,
  specialization text,
  location text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q text := trim(coalesce(p_query, ''));
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.professional_profiles pp ON pp.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.role = 'professional'
      AND pp.status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Only approved professionals can search guests';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.email,
    coalesce(nullif(trim(p.username), ''), split_part(p.email, '@', 1)) AS username,
    p.photo_url,
    gp.specialization,
    coalesce(nullif(trim(gp.town), ''), nullif(trim(gp.area), ''), '—') AS location
  FROM public.profiles p
  INNER JOIN public.guest_profiles gp ON gp.profile_id = p.id
  WHERE p.role = 'guest'
    AND coalesce(p.account_status, 'active') = 'active'
    AND (
      q = ''
      OR p.name ILIKE '%' || q || '%'
      OR p.email ILIKE '%' || q || '%'
      OR coalesce(p.username, split_part(p.email, '@', 1)) ILIKE '%' || q || '%'
    )
  ORDER BY p.name
  LIMIT 48;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_guests_for_invite(text) TO authenticated;
