import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Game = Database['public']['Tables']['games']['Row'] & {
  game_modes?: Database['public']['Tables']['game_modes']['Row'][];
  active_matches_count?: number;
};

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
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
          const { count } = await supabase
            .from('matches')
            .select('*', { count: 'exact', head: true })
            .eq('game_id', game.id)
            .eq('status', 'awaiting_opponent')
            .is('opponent_id', null);

          return {
            ...game,
            active_matches_count: count || 0
          };
        })
      );

      setGames(gamesWithStats);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching games:', err);
    } finally {
      setLoading(false);
    }
  };

  return { games, loading, error, refetch: fetchGames };
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