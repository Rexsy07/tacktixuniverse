-- Admin wallet RPCs: approve deposits and withdrawals atomically
-- File: supabase/migrations/20250926_admin_wallet_rpcs.sql

-- 1) RPC: admin_complete_deposit(p_tx_id)
-- - Validates transaction type is 'deposit'
-- - Credits user's wallet balance and total_deposited
-- - Marks transaction as 'completed'
CREATE OR REPLACE FUNCTION public.admin_complete_deposit(
  p_tx_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tx RECORD;
  v_wallet RECORD;
BEGIN
  -- Load and lock the transaction row
  SELECT * INTO v_tx
  FROM public.transactions
  WHERE id = p_tx_id
  FOR UPDATE;

  IF v_tx IS NULL THEN
    RAISE EXCEPTION 'TRANSACTION_NOT_FOUND';
  END IF;
  IF v_tx.type <> 'deposit' THEN
    RAISE EXCEPTION 'INVALID_TRANSACTION_TYPE';
  END IF;
  IF v_tx.status = 'completed' THEN
    -- Idempotent: nothing to do
    RETURN;
  END IF;

  -- Upsert wallet: update if exists, else insert
  UPDATE public.user_wallets
    SET balance = balance + v_tx.amount,
        total_deposited = total_deposited + v_tx.amount,
        updated_at = now()
  WHERE user_id = v_tx.user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_wallets(user_id, balance, total_deposited)
    VALUES (v_tx.user_id, v_tx.amount, v_tx.amount)
    ON CONFLICT (user_id) DO UPDATE SET
      balance = public.user_wallets.balance + EXCLUDED.balance,
      total_deposited = public.user_wallets.total_deposited + EXCLUDED.total_deposited,
      updated_at = now();
  END IF;

  -- Mark transaction completed
  UPDATE public.transactions
    SET status = 'completed', processed_at = now(), updated_at = now()
  WHERE id = p_tx_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_complete_deposit(uuid) TO authenticated;


-- 2) RPC: admin_mark_withdrawal_processing(p_tx_id)
-- - Moves withdrawal to 'processing' state (no wallet change)
CREATE OR REPLACE FUNCTION public.admin_mark_withdrawal_processing(
  p_tx_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tx RECORD;
BEGIN
  SELECT * INTO v_tx FROM public.transactions WHERE id = p_tx_id FOR UPDATE;
  IF v_tx IS NULL THEN RAISE EXCEPTION 'TRANSACTION_NOT_FOUND'; END IF;
  IF v_tx.type <> 'withdrawal' THEN RAISE EXCEPTION 'INVALID_TRANSACTION_TYPE'; END IF;
  IF v_tx.status = 'completed' THEN RETURN; END IF;

  UPDATE public.transactions
    SET status = 'processing', processed_at = now(), updated_at = now()
  WHERE id = p_tx_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_mark_withdrawal_processing(uuid) TO authenticated;


-- 3) RPC: admin_complete_withdrawal(p_tx_id)
-- - Validates transaction type is 'withdrawal'
-- - Debits user's wallet balance (ensures sufficient funds)
-- - Increments total_withdrawn
-- - Marks transaction as 'completed'
CREATE OR REPLACE FUNCTION public.admin_complete_withdrawal(
  p_tx_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tx RECORD;
  v_balance numeric;
BEGIN
  -- Lock tx
  SELECT * INTO v_tx
  FROM public.transactions
  WHERE id = p_tx_id
  FOR UPDATE;

  IF v_tx IS NULL THEN
    RAISE EXCEPTION 'TRANSACTION_NOT_FOUND';
  END IF;
  IF v_tx.type <> 'withdrawal' THEN
    RAISE EXCEPTION 'INVALID_TRANSACTION_TYPE';
  END IF;
  IF v_tx.status = 'completed' THEN
    RETURN;
  END IF;

  -- Lock wallet row and ensure sufficient funds
  SELECT balance INTO v_balance
  FROM public.user_wallets
  WHERE user_id = v_tx.user_id
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND';
  END IF;
  IF v_balance < v_tx.amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_FUNDS';
  END IF;

  -- Debit
  UPDATE public.user_wallets
    SET balance = balance - v_tx.amount,
        total_withdrawn = total_withdrawn + v_tx.amount,
        updated_at = now()
  WHERE user_id = v_tx.user_id;

  -- Complete tx
  UPDATE public.transactions
    SET status = 'completed', processed_at = now(), updated_at = now()
  WHERE id = p_tx_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_complete_withdrawal(uuid) TO authenticated;
