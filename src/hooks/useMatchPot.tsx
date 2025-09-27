import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useMatchPot(matchId?: string) {
  const [pot, setPot] = useState<number>(0);
  const [contributors, setContributors] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPot = async () => {
    if (!matchId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wallet_holds')
        .select('amount, user_id')
        .eq('match_id', matchId)
        .eq('status', 'held');
      if (error) throw error;
      const rows = data || [];
      setPot(rows.reduce((sum, r: any) => sum + (r.amount || 0), 0));
      setContributors(new Set(rows.map((r: any) => r.user_id)).size);
      setError(null);
    } catch (e: any) {
      setError(e.message);
      setPot(0);
      setContributors(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  return { pot, contributors, loading, error, refetch: fetchPot };
}
