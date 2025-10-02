import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useMatchPot(matchId?: string) {
  const [pot, setPot] = useState<number>(0);
  const [contributors, setContributors] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const realtimeEnabled = import.meta.env.VITE_ENABLE_REALTIME !== 'false';

  const fetchPot = async (retryCount = 0) => {
    if (!matchId) return;
    try {
      setLoading(true);
      
      // Add a small delay for the first few retries to handle timing issues
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      const { data, error } = await supabase
        .from('wallet_holds')
        .select('amount, user_id, created_at')
        .eq('match_id', matchId)
        .eq('status', 'held')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      const rows = data || [];
      const totalPot = rows.reduce((sum, r: any) => sum + (r.amount || 0), 0);
      const totalContributors = new Set(rows.map((r: any) => r.user_id)).size;
      
      // Enhanced debug logging
      console.log(`Pot update for match ${matchId} (attempt ${retryCount + 1}):`, {
        timestamp: new Date().toISOString(),
        holds: rows.length,
        totalPot,
        totalContributors,
        holdDetails: rows.map(r => ({ 
          user_id: r.user_id.substring(0, 8) + '...', 
          amount: r.amount,
          created_at: r.created_at
        }))
      });
      
      // Check if we should retry (sometimes escrow holds take a moment to appear)
      const expectedParticipants = await getExpectedParticipants();
      if (totalContributors < expectedParticipants && retryCount < 3) {
        console.log(`Only ${totalContributors}/${expectedParticipants} contributors found, retrying in 500ms...`);
        setTimeout(() => fetchPot(retryCount + 1), 500);
        return;
      }
      
      setPot(totalPot);
      setContributors(totalContributors);
      setError(null);
    } catch (e: any) {
      console.error('Error fetching pot:', e);
      setError(e.message);
      setPot(0);
      setContributors(0);
    } finally {
      setLoading(false);
    }
  };
  
  const getExpectedParticipants = async () => {
    try {
      const { data: match, error } = await supabase
        .from('matches')
        .select('format')
        .eq('id', matchId)
        .single();
      
      if (error || !match) return 2; // Default to 2 for 1v1
      
      const formatMap: { [key: string]: number } = {
        '1v1': 2, '1v2': 3, '1v3': 4, '1v4': 5,
        '2v2': 4, '3v3': 6, '4v4': 8, '5v5': 10
      };
      
      return formatMap[match.format] || 2;
    } catch {
      return 2;
    }
  };

  useEffect(() => {
    fetchPot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // Real-time subscriptions for both wallet_holds AND match_participants changes
  useEffect(() => {
    if (!matchId || !realtimeEnabled) return;

    const channel = supabase
      .channel(`match-pot-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_holds',
          filter: `match_id=eq.${matchId}`,
        },
        () => {
          console.log('Wallet holds changed, refreshing pot');
          fetchPot();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_participants',
          filter: `match_id=eq.${matchId}`,
        },
        () => {
          console.log('Match participants changed, refreshing pot');
          // Delay slightly to ensure escrow has been processed
          setTimeout(fetchPot, 500);
        }
      )
      .subscribe();

    return () => {
      try {
        channel.unsubscribe();
        supabase.removeChannel(channel);
      } catch (error) {
        console.log('Error during pot channel cleanup:', error);
      }
    };
  }, [matchId, realtimeEnabled]);

  // More frequent polling fallback (every 3 seconds for better responsiveness)
  useEffect(() => {
    if (!matchId) return;
    const interval = setInterval(() => {
      fetchPot();
    }, 3000);
    return () => clearInterval(interval);
  }, [matchId]);

  return { pot, contributors, loading, error, refetch: fetchPot };
}
