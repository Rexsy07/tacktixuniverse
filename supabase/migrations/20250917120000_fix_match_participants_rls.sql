-- Fix infinite recursion in match_participants RLS by removing cross-table reference
-- Replace recursive SELECT policy with simple, non-recursive policies

DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'match_participants'
      AND policyname = 'Users can view participants of their matches'
  ) THEN
    DROP POLICY "Users can view participants of their matches" ON public.match_participants;
  END IF;
END $$;

-- Allow admins to view all participants
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'match_participants'
      AND policyname = 'Admins can view all match participants'
  ) THEN
    CREATE POLICY "Admins can view all match participants"
    ON public.match_participants
    FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Allow users to view only their own participant rows
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'match_participants'
      AND policyname = 'Users can view their own participant rows'
  ) THEN
    CREATE POLICY "Users can view their own participant rows"
    ON public.match_participants
    FOR SELECT
    USING (user_id = auth.uid());
  END IF;
END $$;

