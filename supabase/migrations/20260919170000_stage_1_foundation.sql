-- Stage 1 foundation (applied via Supabase MCP as stage_1_foundation)
-- Removes payment columns, simplifies pro status, adds foundation profile columns.

ALTER TABLE public.professional_profiles
  DROP CONSTRAINT IF EXISTS professional_profiles_status_check;

ALTER TABLE public.guest_profiles
  ADD COLUMN IF NOT EXISTS town text,
  ADD COLUMN IF NOT EXISTS area text;

ALTER TABLE public.professional_profiles
  ADD COLUMN IF NOT EXISTS achievements text,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';

UPDATE public.professional_profiles
SET status = CASE
  WHEN status IN ('accepted', 'awaiting_payment', 'screenshot_submitted') THEN 'pending'
  WHEN status IN ('active', 'expired') THEN 'approved'
  ELSE status
END;

UPDATE public.professional_profiles
SET approved_at = now()
WHERE status = 'approved' AND approved_at IS NULL;

ALTER TABLE public.professional_profiles
  DROP COLUMN IF EXISTS terms_accepted,
  DROP COLUMN IF EXISTS months,
  DROP COLUMN IF EXISTS amount,
  DROP COLUMN IF EXISTS charge,
  DROP COLUMN IF EXISTS total,
  DROP COLUMN IF EXISTS payment_screenshot_url,
  DROP COLUMN IF EXISTS screenshot_submitted_at,
  DROP COLUMN IF EXISTS subscription_valid_until,
  DROP COLUMN IF EXISTS admin_paid_confirm;

ALTER TABLE public.professional_profiles
  ADD CONSTRAINT professional_profiles_status_check
  CHECK (status = ANY (ARRAY['pending', 'approved', 'rejected', 'suspended', 'deactivated']));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_status_check
  CHECK (account_status = ANY (ARRAY['active', 'suspended', 'deactivated']));

DROP TABLE IF EXISTS public."we-link";
