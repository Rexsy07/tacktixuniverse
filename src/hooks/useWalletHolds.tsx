import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type WalletHold = {
  id: string;
  match_id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  released_at: string | null;
};

export function useWalletHolds() {
  const { user } = useAuth();
  const [holds, setHolds] = useState<WalletHold[]>([]);
  const [holdsDetailed, setHoldsDetailed] = useState<(WalletHold & { game_name?: string; mode_name?: string })[]>([]);
  const [heldTotal, setHeldTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHolds = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wallet_holds')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'held');
      if (error) throw error;
      const rows = (data || []) as WalletHold[];
      setHolds(rows);
      setHeldTotal(rows.reduce((sum, r) => sum + (r.amount || 0), 0));

      // Enrich holds with game/mode info
      if (rows.length > 0) {
        const ids = rows.map(r => r.match_id);
        const { data: matches, error: mErr } = await supabase
          .from('matches')
          .select('id, game_id, game_mode_id')
          .in('id', ids);
        if (mErr) throw mErr;
        const gameIds = Array.from(new Set((matches || []).map(m => m.game_id)));
        const modeIds = Array.from(new Set((matches || []).map(m => m.game_mode_id)));

        let gamesMap = new Map<string, string>();
        let modesMap = new Map<string, string>();
        if (gameIds.length > 0) {
          const { data: games } = await supabase
            .from('games')
            .select('id, name')
            .in('id', gameIds);
          (games || []).forEach(g => gamesMap.set(g.id, g.name));
        }
        if (modeIds.length > 0) {
          const { data: modes } = await supabase
            .from('game_modes')
            .select('id, name')
            .in('id', modeIds);
          (modes || []).forEach(m => modesMap.set(m.id, m.name));
        }

        const matchToNames = new Map<string, { game_name?: string; mode_name?: string }>();
        (matches || []).forEach((m: any) => {
          matchToNames.set(m.id, {
            game_name: gamesMap.get(m.game_id),
            mode_name: modesMap.get(m.game_mode_id),
          });
        });

        setHoldsDetailed(rows.map(r => ({
          ...r,
          game_name: matchToNames.get(r.match_id)?.game_name,
          mode_name: matchToNames.get(r.match_id)?.mode_name,
        }))
        );
      } else {
        setHoldsDetailed([]);
      }

      setError(null);
    } catch (e: any) {
      setError(e.message);
      console.error('Error fetching wallet holds:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return { holds, holdsDetailed, heldTotal, loading, error, refetch: fetchHolds };
}