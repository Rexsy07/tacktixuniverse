import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Game = Database['public']['Tables']['games']['Row'] & {
  game_modes?: Database['public']['Tables']['game_modes']['Row'][];
  active_matches_count?: number;
  players_online?: number;
};

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const realtimeEnabled = import.meta.env.VITE_ENABLE_REALTIME !== 'false';
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    fetchGames();
  }, []);

  // Realtime and polling for non-intrusive updates
  useEffect(() => {
    const pollId = setInterval(() => fetchGames(true), 12000);
    const channels: any[] = [];
    if (realtimeEnabled) {
      ['games', 'game_modes', 'matches'].forEach((table) => {
        const ch = supabase
          .channel(`games-${table}`)
          .on('postgres_changes', { event: '*', schema: 'public', table }, () => fetchGames(true))
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

  const fetchGames = async (isRefresh = false) => {
    try {
      setLoading(true);
      
      // Fetch games with their modes
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select(`
          *,
          game_modes(*)
        `)
        .eq('is_active', true)
        .order('name');

      if (gamesError) throw gamesError;

      // Fetch active matches count for each game
      const gamesWithStats = await Promise.all(
        gamesData.map(async (game) => {
          const [{ count: activeCount }, { count: recentCount }] = await Promise.all([
            supabase
              .from('matches')
              .select('*', { count: 'exact', head: true })
              .eq('game_id', game.id)
              .eq('status', 'awaiting_opponent')
              .is('opponent_id', null),
            supabase
              .from('matches')
              .select('*', { count: 'exact', head: true })
              .eq('game_id', game.id)
              .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
          ]);

          return {
            ...game,
            active_matches_count: activeCount || 0,
            players_online: recentCount || 0,
          };
        })
      );

      setGames(gamesWithStats);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching games:', err);
    } finally {
      if (!hasLoaded) setHasLoaded(true);
      setLoading(!isRefresh && !hasLoaded ? false : false);
    }
  };

  return { games, loading: !hasLoaded && loading, error, refetch: fetchGames };
}

export function useGame(gameId: string | undefined) {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gameId) {
      fetchGame(gameId);
    }
  }, [gameId]);

  const fetchGame = async (id: string) => {
    try {
      setLoading(true);
      
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select(`
          *,
          game_modes(*)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (gameError) throw gameError;

      // Get active matches count
      const { count } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', id)
        .eq('status', 'awaiting_opponent')
        .is('opponent_id', null);

      setGame({
        ...gameData,
        active_matches_count: count || 0
      });
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching game:', err);
    } finally {
      setLoading(false);
    }
  };

  return { game, loading, error, refetch: () => gameId && fetchGame(gameId) };
}