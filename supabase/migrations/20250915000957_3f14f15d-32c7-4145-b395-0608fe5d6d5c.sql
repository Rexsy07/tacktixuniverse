-- Allow users to create their own transactions
CREATE POLICY IF NOT EXISTS "Users can create their own transactions"
ON public.transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Optional: ensure users cannot update transactions (admins already can). No change needed.

-- Recreate user_stats view policies to be safe (idempotent)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_stats' AND policyname='Users can view their own stats'
  ) THEN
    DROP POLICY "Users can view their own stats" ON public.user_stats;
  END IF;
END $$;

CREATE POLICY "Users can view their own stats"
ON public.user_stats
FOR SELECT
USING (auth.uid() = user_id);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_stats' AND policyname='Admins can view all user stats'
  ) THEN
    CREATE POLICY "Admins can view all user stats"
    ON public.user_stats
    FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;