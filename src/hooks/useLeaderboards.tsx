import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type LeaderboardEntry = {
  user_id: string;
  username: string;
  full_name: string;
  total_matches: number;
  total_wins: number;
  total_losses: number;
  win_rate: number;
  total_earnings: number;
  current_streak: number;
  longest_win_streak: number;
  rank?: number;
  favorite_game?: string;
  badge?: string;
};

export function useLeaderboards() {
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [gameLeaderboards, setGameLeaderboards] = useState<{ [gameId: string]: LeaderboardEntry[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const realtimeEnabled = import.meta.env.VITE_ENABLE_REALTIME !== 'false';
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  useEffect(() => {
    const pollId = setInterval(() => fetchLeaderboards(true), 20000);
    const channels: any[] = [];
    if (realtimeEnabled) {
      ['user_wallets', 'matches', 'profiles', 'games'].forEach((table) => {
        const ch = supabase
          .channel(`leaderboards-${table}`)
          .on('postgres_changes', { event: '*', schema: 'public', table }, () => fetchLeaderboards(true))
          .subscribe();
        channels.push(ch);
      });
    }
    return () => {
      clearInterval(pollId);
      channels.forEach((ch) => {
        try { ch.unsubscribe?.(); supabase.removeChannel?.(ch); } catch (_) {}
      });
    };
  }, [realtimeEnabled]);

  const fetchLeaderboards = async (isRefresh = false) => {
    try {
      setLoading(true);

      // Fetch public leaderboard via RPC (secured by RLS-safe function)
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .rpc('get_public_leaderboard');

      if (leaderboardError) throw leaderboardError;

      // Sort by balance desc and take top 100
      const walletsData = (leaderboardData || [])
        .sort((a: any, b: any) => (b.balance || 0) - (a.balance || 0))
        .slice(0, 100);

      // Fetch profiles for these users
      const userIds = walletsData?.map((w: any) => w.user_id) || [];
      
      if (userIds.length === 0) {
        setGlobalLeaderboard([]);
        setGameLeaderboards({});
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Optimized batch query: Get match stats for all users in one query
      const { data: allMatches, error: matchesError } = await supabase
        .from('matches')
        .select('creator_id, opponent_id, winner_id')
        .or(`creator_id.in.(${userIds.join(',')}),opponent_id.in.(${userIds.join(',')})`);

      if (matchesError) {
        console.warn('Error fetching matches for global leaderboard:', matchesError);
      }

      // Compute stats efficiently by processing all matches once
      const userStats = new Map<string, { total_matches: number; total_wins: number }>();
      
      // Initialize stats for all users
      userIds.forEach(userId => {
        userStats.set(userId, { total_matches: 0, total_wins: 0 });
      });

      // Process matches to compute stats
      (allMatches || []).forEach(match => {
        // Count matches and wins for creator
        if (match.creator_id && userIds.includes(match.creator_id)) {
          const stats = userStats.get(match.creator_id)!;
          stats.total_matches += 1;
          if (match.winner_id === match.creator_id) {
            stats.total_wins += 1;
          }
        }
        
        // Count matches and wins for opponent
        if (match.opponent_id && userIds.includes(match.opponent_id)) {
          const stats = userStats.get(match.opponent_id)!;
          stats.total_matches += 1;
          if (match.winner_id === match.opponent_id) {
            stats.total_wins += 1;
          }
        }
      });

      // Create processed global leaderboard
      const processedGlobal = walletsData?.map((wallet, index) => {
        const profile = profilesData?.find(p => p.user_id === wallet.user_id);
        const stats = userStats.get(wallet.user_id) || { total_matches: 0, total_wins: 0 };
        
        const total_matches = stats.total_matches;
        const total_wins = stats.total_wins;
        const total_losses = Math.max(total_matches - total_wins, 0);
        
        return {
          user_id: wallet.user_id,
          username: profile?.username || 'Anonymous',
          full_name: profile?.full_name || 'Unknown Player',
          total_matches,
          total_wins,
          total_losses,
          win_rate: total_matches > 0 ? (total_wins / total_matches) * 100 : 0,
          total_earnings: wallet.balance || 0,
          current_streak: 0, // Could be computed from recent matches
          longest_win_streak: 0, // Could be computed from match history
          rank: index + 1,
          badge: index < 3 ? ['Champion', 'Runner-up', 'Third Place'][index] : undefined
        };
      }) || [];

      setGlobalLeaderboard(processedGlobal);

      // Fetch games for game-specific leaderboards
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('id, name')
        .eq('is_active', true);

      if (gamesError) throw gamesError;

      // For each game, compute leaderboard based on net match winnings (sum of match_win transactions)
      const gameLeaderboardsData: { [gameId: string]: LeaderboardEntry[] } = {};

      // Fetch platform fee percentage from latest settings row, with fallback to 5%
      let FEE_PCT = 5;
      try {
        const { data: settingsRows, error: settingsErr } = await supabase
          .from('platform_settings')
          .select('fee_percentage, updated_at')
          .order('updated_at', { ascending: false })
          .limit(1);
        if (!settingsErr && settingsRows && settingsRows.length > 0) {
          const v = settingsRows[0].fee_percentage;
          if (typeof v === 'number' && !Number.isNaN(v)) {
            FEE_PCT = v;
          }
        }
      } catch (e) {
        // ignore, will use fallback of 5%
      }

      for (const game of games || []) {
        // Fetch completed matches for this game
        const { data: gameMatches, error: gameMatchesError } = await supabase
          .from('matches')
          .select('id, creator_id, opponent_id, winner_id, stake_amount')
          .eq('game_id', game.id)
          .eq('status', 'completed');

        if (gameMatchesError) {
          console.error(`Error fetching ${game.name} matches:`, gameMatchesError);
          continue;
        }

        if (!gameMatches || gameMatches.length === 0) {
          gameLeaderboardsData[game.id] = [];
          continue;
        }

        // Aggregate per-user metrics for this game
        const perUser = new Map<string, { total_earnings: number; total_matches: number; total_wins: number }>();

        // Count matches, wins, and compute net winnings from matches (winner gets opponent stake minus fee)
        for (const m of gameMatches) {
          const participants = [m.creator_id, m.opponent_id].filter(Boolean) as string[];
          for (const uid of participants) {
            const curr = perUser.get(uid) || { total_earnings: 0, total_matches: 0, total_wins: 0 };
            curr.total_matches += 1;
            if (m.winner_id === uid) {
              curr.total_wins += 1;
              const netWin = m.stake_amount * (1 - FEE_PCT / 100);
              curr.total_earnings += netWin;
            }
            perUser.set(uid, curr);
          }
        }

        const userIds = Array.from(perUser.keys());
        if (userIds.length === 0) {
          gameLeaderboardsData[game.id] = [];
          continue;
        }

        // Fetch profiles for display names
        const { data: profilesForGame, error: profErr } = await supabase
          .from('profiles')
          .select('user_id, username, full_name')
          .in('user_id', userIds);
        if (profErr) {
          console.warn(`Could not fetch profiles for ${game.name}:`, profErr.message);
        }

        const entries: LeaderboardEntry[] = userIds.map((uid) => {
          const stats = perUser.get(uid)!;
          const prof = (profilesForGame || []).find((p: any) => p.user_id === uid);
          const total_matches = stats.total_matches;
          const total_wins = stats.total_wins;
          const total_losses = Math.max(total_matches - total_wins, 0);
          const win_rate = total_matches > 0 ? (total_wins / total_matches) * 100 : 0;
          return {
            user_id: uid,
            username: prof?.username || 'Anonymous',
            full_name: prof?.full_name || 'Unknown Player',
            total_matches,
            total_wins,
            total_losses,
            win_rate,
            total_earnings: Math.round((stats.total_earnings || 0) * 100) / 100,
            current_streak: 0,
            longest_win_streak: 0,
          };
        })
          .filter((e) => e.total_earnings > 0 || e.total_matches > 0)
          .sort((a, b) => (b.total_earnings - a.total_earnings));

        // Assign ranks and badges
        const withRanks = entries.slice(0, 50).map((e, idx) => ({
          ...e,
          rank: idx + 1,
          badge: idx < 3 ? ['Champion', 'Runner-up', 'Third Place'][idx] : undefined,
        }));

        gameLeaderboardsData[game.id] = withRanks;
      }

      setGameLeaderboards(gameLeaderboardsData);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching leaderboards:', err);
    } finally {
      if (!hasLoaded) setHasLoaded(true);
      setLoading(false);
    }
  };

  return {
    globalLeaderboard,
    gameLeaderboards,
    loading: !hasLoaded && loading,
    error,
    refetch: fetchLeaderboards
  };
}
