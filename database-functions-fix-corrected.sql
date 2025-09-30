-- =====================================================
-- COMPREHENSIVE FIX FOR DUPLICATE TRANSACTION ISSUE
-- =====================================================
-- This SQL script fixes the root cause of duplicate transactions
-- by adding proper checks and constraints to prevent duplicates

-- 1. CREATE IMPROVED settle_match_escrow FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.settle_match_escrow(
  p_match_id uuid, 
  p_winner_id uuid, 
  p_fee_percentage numeric DEFAULT NULL::numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_loser_id uuid;
  v_stake numeric;
  v_fee_pct numeric;
  v_fee numeric;
  v_existing_tx_count integer;
BEGIN
  -- ✅ DUPLICATE PREVENTION: Check if settlement already exists
  SELECT COUNT(*) INTO v_existing_tx_count
  FROM public.transactions
  WHERE metadata->>'match_id' = p_match_id::text
    AND type = 'match_win'
    AND status = 'completed';
  
  IF v_existing_tx_count > 0 THEN
    RAISE EXCEPTION 'MATCH_ALREADY_SETTLED: Match % has already been settled', p_match_id;
  END IF;

  -- Get match info and determine loser
  SELECT 
    stake_amount,
    CASE 
      WHEN creator_id = p_winner_id THEN opponent_id 
      ELSE creator_id 
    END
  INTO v_stake, v_loser_id
  FROM public.matches
  WHERE id = p_match_id;

  IF v_stake IS NULL THEN
    RAISE EXCEPTION 'MATCH_NOT_FOUND';
  END IF;

  -- Determine fee percentage
  SELECT fee_percentage INTO v_fee_pct
  FROM public.platform_settings
  ORDER BY updated_at DESC
  LIMIT 1;
  IF v_fee_pct IS NULL THEN v_fee_pct := 5.00; END IF;
  IF p_fee_percentage IS NOT NULL THEN v_fee_pct := p_fee_percentage; END IF;

  -- Cancel all pending loss transactions
  UPDATE public.transactions
  SET status = 'cancelled', processed_at = now()
  WHERE metadata->>'match_id' = p_match_id::text
    AND status = 'pending'
    AND type = 'match_loss';

  -- Release all holds
  UPDATE public.wallet_holds
  SET status = 'released', released_at = now()
  WHERE match_id = p_match_id;

  -- Calculate fee and winner prize (total pot minus fee)
  v_fee := round((v_stake * 2) * (v_fee_pct / 100.0), 2);

  -- Give winner the full pot minus fee (NO REFUND)
  UPDATE public.user_wallets
  SET balance = balance + ((v_stake * 2) - v_fee), updated_at = now()
  WHERE user_id = p_winner_id;

  -- ✅ IMPROVED: Create unique transaction with timestamp-based reference
  INSERT INTO public.transactions(
    user_id, 
    amount, 
    type, 
    reference_code, 
    description, 
    status, 
    metadata,
    processed_at
  )
  VALUES (
    p_winner_id, 
    ((v_stake * 2) - v_fee), 
    'match_win', 
    'WIN-' || p_match_id || '-' || extract(epoch from now())::bigint, -- ✅ UNIQUE REFERENCE
    'Match winnings (full pot after fee)', 
    'completed', 
    jsonb_build_object(
      'match_id', p_match_id, 
      'total_pot', v_stake * 2, 
      'fee', v_fee, 
      'fee_pct', v_fee_pct
    ),
    now()
  );

  -- Finalize loser transaction (stake forfeited - NO REFUND)
  UPDATE public.transactions
  SET status = 'completed', processed_at = now(), description = 'Stake forfeited (match loss)'
  WHERE user_id = v_loser_id
    AND metadata->>'match_id' = p_match_id::text
    AND status = 'cancelled'
    AND type = 'match_loss';

  -- Record platform fee
  BEGIN
    INSERT INTO public.platform_fees(match_id, fee_amount, fee_percentage, match_stake_amount)
    VALUES (p_match_id, v_fee, v_fee_pct, v_stake * 2);
  EXCEPTION WHEN undefined_table THEN
    NULL; -- platform_fees table optional
  END;
  
  -- ✅ UPDATE MATCH STATUS
  UPDATE public.matches 
  SET 
    status = 'completed',
    winner_id = p_winner_id,
    completed_at = now(),
    updated_at = now()
  WHERE id = p_match_id;
  
END;
$function$;

-- 2. CREATE IMPROVED settle_team_match_escrow FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.settle_team_match_escrow(
  p_match_id uuid, 
  p_winner_user_id uuid, 
  p_fee_percentage numeric DEFAULT NULL::numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_total_pot numeric := 0;
  v_fee_pct numeric;
  v_total_fee numeric;
  v_individual_share numeric;
  v_winning_team_size integer;
  v_winning_team_members uuid[];
  v_member_id uuid;
  v_existing_tx_count integer;
  v_timestamp bigint;
BEGIN
  -- ✅ DUPLICATE PREVENTION: Check if settlement already exists
  SELECT COUNT(*) INTO v_existing_tx_count
  FROM public.transactions
  WHERE metadata->>'match_id' = p_match_id::text
    AND type = 'match_win'
    AND status = 'completed';
  
  IF v_existing_tx_count > 0 THEN
    RAISE EXCEPTION 'MATCH_ALREADY_SETTLED: Match % has already been settled', p_match_id;
  END IF;

  -- Generate unique timestamp for reference codes
  v_timestamp := extract(epoch from now())::bigint;

  -- Calculate total pot from all holds
  SELECT COALESCE(SUM(amount), 0) INTO v_total_pot
  FROM public.wallet_holds
  WHERE match_id = p_match_id AND status = 'held';

  IF v_total_pot = 0 THEN
    RAISE EXCEPTION 'NO_ESCROW_FOUND';
  END IF;

  -- Get winning team members
  SELECT ARRAY_AGG(user_id) INTO v_winning_team_members
  FROM public.match_participants
  WHERE match_id = p_match_id 
    AND team = (
      SELECT team FROM public.match_participants 
      WHERE match_id = p_match_id AND user_id = p_winner_user_id
    );

  IF v_winning_team_members IS NULL THEN
    -- Fallback for 1v1 matches
    SELECT ARRAY[creator_id] INTO v_winning_team_members
    FROM public.matches 
    WHERE id = p_match_id AND creator_id = p_winner_user_id
    UNION ALL
    SELECT ARRAY[opponent_id]
    FROM public.matches 
    WHERE id = p_match_id AND opponent_id = p_winner_user_id;
  END IF;

  v_winning_team_size := array_length(v_winning_team_members, 1);

  -- Determine fee percentage
  SELECT fee_percentage INTO v_fee_pct
  FROM public.platform_settings
  ORDER BY updated_at DESC LIMIT 1;
  IF v_fee_pct IS NULL THEN v_fee_pct := 5.00; END IF;
  IF p_fee_percentage IS NOT NULL THEN v_fee_pct := p_fee_percentage; END IF;

  -- Calculate fee and individual share
  v_total_fee := round(v_total_pot * (v_fee_pct / 100.0), 2);
  v_individual_share := round((v_total_pot - v_total_fee) / v_winning_team_size, 2);

  -- Release all holds
  UPDATE public.wallet_holds SET status = 'released', released_at = now() WHERE match_id = p_match_id;
  
  -- Cancel pending loss transactions
  UPDATE public.transactions
  SET status = 'cancelled', processed_at = now()
  WHERE metadata->>'match_id' = p_match_id::text AND status = 'pending' AND type = 'match_loss';

  -- ✅ IMPROVED: Give winners their prize share with unique transactions
  FOREACH v_member_id IN ARRAY v_winning_team_members
  LOOP
    -- ✅ DOUBLE-CHECK: Ensure no existing win transaction for this user and match
    SELECT COUNT(*) INTO v_existing_tx_count
    FROM public.transactions
    WHERE user_id = v_member_id
      AND metadata->>'match_id' = p_match_id::text
      AND type = 'match_win'
      AND status = 'completed';
    
    IF v_existing_tx_count = 0 THEN
      -- Update wallet balance
      UPDATE public.user_wallets
      SET balance = balance + v_individual_share, updated_at = now()
      WHERE user_id = v_member_id;

      -- Create unique transaction
      INSERT INTO public.transactions(
        user_id, 
        amount, 
        type, 
        reference_code, 
        description, 
        status, 
        metadata,
        processed_at
      )
      VALUES (
        v_member_id,
        v_individual_share,
        'match_win',
        'WIN-' || p_match_id || '-' || v_member_id::text || '-' || v_timestamp, -- ✅ GUARANTEED UNIQUE
        'Match winnings (prize share after fees)',
        'completed',
        jsonb_build_object(
          'match_id', p_match_id, 
          'team_size', v_winning_team_size,
          'individual_share', v_individual_share,
          'total_pot', v_total_pot,
          'total_fee', v_total_fee,
          'fee_pct', v_fee_pct
        ),
        now()
      );
    ELSE
      RAISE NOTICE 'Skipped duplicate transaction for user % in match %', v_member_id, p_match_id;
    END IF;
  END LOOP;
  
  -- Finalize loser transactions (stakes forfeited - NO REFUNDS)
  UPDATE public.transactions
  SET status = 'completed', processed_at = now(), description = 'Stake forfeited (match loss)'
  WHERE metadata->>'match_id' = p_match_id::text
    AND status = 'cancelled'
    AND type = 'match_loss'
    AND user_id != ALL(v_winning_team_members);

  -- Record platform fee
  BEGIN
    INSERT INTO public.platform_fees(match_id, fee_amount, fee_percentage, match_stake_amount)
    VALUES (p_match_id, v_total_fee, v_fee_pct, v_total_pot);
  EXCEPTION WHEN undefined_table THEN
    NULL; -- optional table
  END;
  
  -- ✅ UPDATE MATCH STATUS
  UPDATE public.matches 
  SET 
    status = 'completed',
    winner_id = p_winner_user_id,
    completed_at = now(),
    updated_at = now()
  WHERE id = p_match_id;
  
END;
$function$;

-- 3. DROP AND RECREATE admin_set_match_winner FUNCTION
-- =====================================================
-- First, check what the existing function returns and drop it
DO $$ 
BEGIN
  -- Try to drop the existing function (may have different signature)
  BEGIN
    DROP FUNCTION IF EXISTS public.admin_set_match_winner(uuid, uuid, text);
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore if it doesn't exist
  END;
  
  -- Also try common variations
  BEGIN
    DROP FUNCTION IF EXISTS public.admin_set_match_winner(uuid, uuid);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- Now create the new function
CREATE OR REPLACE FUNCTION public.admin_set_match_winner(
  p_match_id uuid,
  p_winner_user_id uuid,
  p_admin_decision text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_match_format text;
  v_match_status text;
BEGIN
  -- Get match details
  SELECT format, status INTO v_match_format, v_match_status
  FROM public.matches
  WHERE id = p_match_id;
  
  IF v_match_format IS NULL THEN
    RAISE EXCEPTION 'MATCH_NOT_FOUND';
  END IF;
  
  IF v_match_status = 'completed' THEN
    RAISE EXCEPTION 'MATCH_ALREADY_COMPLETED';
  END IF;
  
  -- Log admin decision if provided
  IF p_admin_decision IS NOT NULL THEN
    BEGIN
      INSERT INTO public.match_admin_actions (
        match_id, 
        admin_action, 
        decision_reason, 
        created_at
      ) VALUES (
        p_match_id, 
        'set_winner', 
        p_admin_decision, 
        now()
      );
    EXCEPTION WHEN undefined_table THEN
      NULL; -- Table might not exist yet
    END;
  END IF;
  
  -- Use appropriate settlement function based on match type
  IF v_match_format = '1v1' THEN
    PERFORM public.settle_match_escrow(p_match_id, p_winner_user_id);
  ELSE
    PERFORM public.settle_team_match_escrow(p_match_id, p_winner_user_id);
  END IF;
  
END;
$function$;

-- 4. CREATE UNIQUE CONSTRAINT TO PREVENT DUPLICATES
-- =====================================================
-- Create unique index to prevent duplicate win transactions
DO $$ 
BEGIN
  CREATE UNIQUE INDEX CONCURRENTLY idx_transactions_unique_match_win
  ON public.transactions (user_id, (metadata->>'match_id'), type)
  WHERE type = 'match_win' AND status = 'completed';
EXCEPTION WHEN duplicate_table THEN
  RAISE NOTICE 'Index idx_transactions_unique_match_win already exists, skipping...';
WHEN invalid_table_definition THEN
  RAISE NOTICE 'Cannot create concurrent index, trying regular index...';
  BEGIN
    CREATE UNIQUE INDEX idx_transactions_unique_match_win
    ON public.transactions (user_id, (metadata->>'match_id'), type)
    WHERE type = 'match_win' AND status = 'completed';
  EXCEPTION WHEN duplicate_table THEN
    RAISE NOTICE 'Index already exists, skipping...';
  END;
END $$;

-- 5. CREATE CLEANUP FUNCTION FOR EXISTING DUPLICATES
-- =====================================================
CREATE OR REPLACE FUNCTION public.cleanup_duplicate_transactions()
RETURNS TABLE(
  match_id text,
  user_id uuid,
  duplicates_removed integer,
  amount_recovered numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  rec RECORD;
  duplicate_rec RECORD;
  removed_count integer;
  recovered_amount numeric;
BEGIN
  -- Find all matches with duplicate win transactions
  FOR rec IN 
    SELECT 
      t.user_id,
      t.metadata->>'match_id' as match_id,
      COUNT(*) as tx_count
    FROM public.transactions t
    WHERE t.type = 'match_win' 
      AND t.status = 'completed'
      AND t.metadata->>'match_id' IS NOT NULL
    GROUP BY t.user_id, t.metadata->>'match_id'
    HAVING COUNT(*) > 1
  LOOP
    removed_count := 0;
    recovered_amount := 0;
    
    -- Keep the earliest transaction, remove the rest
    FOR duplicate_rec IN
      SELECT t.id, t.amount, t.created_at
      FROM public.transactions t
      WHERE t.user_id = rec.user_id
        AND t.metadata->>'match_id' = rec.match_id
        AND t.type = 'match_win'
        AND t.status = 'completed'
      ORDER BY t.created_at ASC
      OFFSET 1  -- Skip the first (earliest) transaction
    LOOP
      -- Remove duplicate transaction
      DELETE FROM public.transactions WHERE id = duplicate_rec.id;
      
      -- Adjust user wallet (subtract the duplicate amount)
      UPDATE public.user_wallets 
      SET balance = balance - ABS(duplicate_rec.amount),
          updated_at = now()
      WHERE user_id = rec.user_id;
      
      removed_count := removed_count + 1;
      recovered_amount := recovered_amount + ABS(duplicate_rec.amount);
      
      RAISE NOTICE 'Removed duplicate transaction % for user % (amount: %)', 
        duplicate_rec.id, rec.user_id, duplicate_rec.amount;
    END LOOP;
    
    -- Return cleanup results
    match_id := rec.match_id;
    user_id := rec.user_id;
    duplicates_removed := removed_count;
    amount_recovered := recovered_amount;
    
    IF removed_count > 0 THEN
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
END;
$function$;

-- 6. CREATE MATCH ADMIN ACTIONS TABLE (if it doesn't exist)
-- =====================================================
DO $$ 
BEGIN
  CREATE TABLE IF NOT EXISTS public.match_admin_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id uuid NOT NULL,
    admin_action text NOT NULL,
    decision_reason text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
  
  -- Add foreign key if matches table exists
  BEGIN
    ALTER TABLE public.match_admin_actions 
    ADD CONSTRAINT fk_match_admin_actions_match_id 
    FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;
  EXCEPTION WHEN others THEN
    NULL; -- Ignore if constraint already exists or matches table doesn't exist
  END;
  
EXCEPTION WHEN duplicate_table THEN
  NULL; -- Table already exists
END $$;

-- Create indexes for the admin actions table
DO $$ 
BEGIN
  CREATE INDEX IF NOT EXISTS idx_match_admin_actions_match_id ON public.match_admin_actions(match_id);
EXCEPTION WHEN others THEN
  NULL;
END $$;

DO $$ 
BEGIN
  CREATE INDEX IF NOT EXISTS idx_match_admin_actions_created_at ON public.match_admin_actions(created_at);
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- =====================================================
-- SUMMARY OF FIXES APPLIED:
-- =====================================================
-- ✅ Added duplicate transaction prevention checks
-- ✅ Fixed reference code uniqueness with timestamps  
-- ✅ Added proper match status updates
-- ✅ Fixed admin_set_match_winner function signature issues
-- ✅ Added unique constraint to prevent future duplicates
-- ✅ Created cleanup function for existing duplicates
-- ✅ Added proper error handling and logging
-- ✅ Made all operations safe for existing databases
-- =====================================================

-- EXECUTE THE CLEANUP OF EXISTING DUPLICATES:
-- SELECT * FROM public.cleanup_duplicate_transactions();

-- VERIFY NO DUPLICATES REMAIN:
-- SELECT 
--   metadata->>'match_id' as match_id,
--   user_id,
--   COUNT(*) as transaction_count
-- FROM public.transactions 
-- WHERE type = 'match_win' 
--   AND status = 'completed'
--   AND metadata->>'match_id' IS NOT NULL
-- GROUP BY metadata->>'match_id', user_id
-- HAVING COUNT(*) > 1;