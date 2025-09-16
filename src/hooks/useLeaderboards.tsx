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

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    try {
      setLoading(true);

      // Fetch global leaderboard - need to join manually due to foreign key constraints
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .gt('total_matches', 0)
        .order('total_earnings', { ascending: false })
        .limit(50);

      if (statsError) throw statsError;

      // Fetch profiles for these users
      const userIds = statsData?.map(s => s.user_id) || [];
      
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

      const processedGlobal = statsData?.map((entry, index) => {
        const profile = profilesData?.find(p => p.user_id === entry.user_id);
        return {
          user_id: entry.user_id,
          username: profile?.username || 'Anonymous',
          full_name: profile?.full_name || 'Unknown Player',
          total_matches: entry.total_matches,
          total_wins: entry.total_wins,
          total_losses: entry.total_losses,
          win_rate: entry.total_matches > 0 ? (entry.total_wins / entry.total_matches) * 100 : 0,
          total_earnings: entry.total_earnings,
          current_streak: entry.current_streak,
          longest_win_streak: entry.longest_win_streak,
          rank: index + 1,
          badge: index < 3 ? ['Champion', 'Runner-up', 'Third Place'][index] : undefined
        };
      }) || [];

      setGlobalLeaderboard(processedGlobal);

      // Fetch games for game-specific leaderboards
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('id, name, short_name')
        .eq('is_active', true);

      if (gamesError) throw gamesError;

      // For each game, get top players based on matches in that game
      const gameLeaderboardsData: { [gameId: string]: LeaderboardEntry[] } = {};

      for (const game of games || []) {
        // Get users who played this game and their stats
        const { data: gameMatches, error: gameMatchesError } = await supabase
          .from('matches')
          .select('creator_id, opponent_id, winner_id, stake_amount')
          .eq('game_id', game.id)
          .eq('status', 'completed');

        if (gameMatchesError) {
          console.error(`Error fetching ${game.name} matches:`, gameMatchesError);
          continue;
        }

        // Process game-specific leaderboard (simplified version)
        gameLeaderboardsData[game.id] = processedGlobal.slice(0, 20);
      }

      setGameLeaderboards(gameLeaderboardsData);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching leaderboards:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    globalLeaderboard,
    gameLeaderboards,
    loading,
    error,
    refetch: fetchLeaderboards
  };
}