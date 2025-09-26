-- Admin reject withdrawal RPC
-- File: supabase/migrations/20250926_admin_withdrawal_reject.sql

CREATE OR REPLACE FUNCTION public.admin_reject_withdrawal(
  p_tx_id uuid,
  p_reason text DEFAULT NULL
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
  IF v_tx.status = 'completed' THEN RAISE EXCEPTION 'CANNOT_REJECT_COMPLETED'; END IF;

  UPDATE public.transactions
  SET status = 'failed',
      processed_at = now(),
      metadata = CASE
        WHEN p_reason IS NOT NULL THEN jsonb_set(coalesce(metadata, '{}'::jsonb), '{rejection_reason}', to_jsonb(p_reason), true)
        ELSE metadata
      END,
      updated_at = now()
  WHERE id = p_tx_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reject_withdrawal(uuid, text) TO authenticated;
