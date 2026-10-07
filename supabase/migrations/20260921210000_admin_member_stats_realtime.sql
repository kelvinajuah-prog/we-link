-- Enable Realtime on member tables for live admin dashboard statistics

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'professional_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.professional_profiles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'guest_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.guest_profiles;
  END IF;
END $$;
