import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Match = Database['public']['Tables']['matches']['Row'] & {
  games?: Database['public']['Tables']['games']['Row'];
  game_modes?: Database['public']['Tables']['game_modes']['Row'];
  creator_profile?: Database['public']['Tables']['profiles']['Row'];
  opponent_profile?: Database['public']['Tables']['profiles']['Row'];
};

export function useMatches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const realtimeEnabled = import.meta.env.VITE_ENABLE_REALTIME !== 'false';

  useEffect(() => {
    if (user) {
      fetchUserMatches();
    }
  }, [user]);

  // Realtime updates for the current user's matches (guarded by env)
  useEffect(() => {
    if (!user || !realtimeEnabled) return;

    const channel = supabase
      .channel(`matches-user-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `creator_id=eq.${user.id}`,
        },
        () => fetchUserMatches(true)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `opponent_id=eq.${user.id}`,
        },
        () => fetchUserMatches(true)
      )
      .subscribe();

    return () => {
      // Improved cleanup with error handling
      try {
        channel.unsubscribe();
        supabase.removeChannel(channel);
      } catch (error) {
        console.log('Error during channel cleanup:', error);
      }
    };
  }, [user, realtimeEnabled]);

  // Polling fallback for user matches (every 6s)
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => fetchUserMatches(true), 6000);
    return () => clearInterval(id);
  }, [user]);

  const fetchUserMatches = async (isRefresh = false) => {
    if (!user) return;

    try {
      // Only show loading spinner on initial load, not on refreshes
      if (matches.length === 0) {
        setLoading(true);
      } else if (isRefresh) {
        setRefreshing(true);
      }
      
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          games(*),
          game_modes(*)
        `)
        .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch creator and opponent profiles separately
      const creatorIds = [...new Set(data?.map(m => m.creator_id) || [])];
      const opponentIds = [...new Set(data?.map(m => m.opponent_id).filter(Boolean) || [])];
      const allUserIds = [...new Set([...creatorIds, ...opponentIds])];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', allUserIds);

      if (profilesError) throw profilesError;

      // Only proceed if we have user IDs to fetch
      if (allUserIds.length === 0) {
        setMatches(data || []);
        setError(null);
        return;
      }

      // Merge profiles with matches
      const matchesWithProfiles = data?.map(match => ({
        ...match,
        creator_profile: profiles?.find(p => p.user_id === match.creator_id) || null,
        opponent_profile: match.opponent_id ? profiles?.find(p => p.user_id === match.opponent_id) || null : null
      })) || [];

      setMatches(matchesWithProfiles);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching user matches:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  return { matches, loading, refreshing, error, refetch: fetchUserMatches };
}

export function useOpenChallenges(gameFilter?: string) {
  const [challenges, setChallenges] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const realtimeEnabled = import.meta.env.VITE_ENABLE_REALTIME !== 'false';

  useEffect(() => {
    fetchOpenChallenges();
  }, [gameFilter]);

  // Realtime updates for open challenges list (guarded by env)
  useEffect(() => {
    if (!realtimeEnabled) return;
    const channel = supabase
      .channel('matches-open-challenges')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => fetchOpenChallenges(true)
      )
      .subscribe();

    return () => {
      // Improved cleanup with error handling
      try {
        channel.unsubscribe();
        supabase.removeChannel(channel);
      } catch (error) {
        console.log('Error during channel cleanup:', error);
      }
    };
  }, [gameFilter, realtimeEnabled]);

  // Polling fallback for open challenges (every 6s)
  useEffect(() => {
    const id = setInterval(() => fetchOpenChallenges(true), 6000);
    return () => clearInterval(id);
  }, [gameFilter]);

  const fetchOpenChallenges = async (isRefresh = false) => {
    try {
      // Only show loading spinner on initial load, not on refreshes
      if (challenges.length === 0) {
        setLoading(true);
      } else if (isRefresh) {
        setRefreshing(true);
      }
      
      let query = supabase
        .from('matches')
        .select(`
          *,
          games(*),
          game_modes(*)
        `)
        .eq('status', 'awaiting_opponent')
        .is('opponent_id', null)
        .order('created_at', { ascending: false });

      if (gameFilter) {
        query = query.eq('game_id', gameFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch creator profiles
      const creatorIds = [...new Set(data?.map(m => m.creator_id) || [])];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', creatorIds);

      if (profilesError) throw profilesError;

      // Merge profiles with challenges
      const challengesWithProfiles = data?.map(match => ({
        ...match,
        creator_profile: profiles?.find(p => p.user_id === match.creator_id) || null
      })) || [];

      setChallenges(challengesWithProfiles);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching open challenges:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const acceptChallenge = async (matchId: string, userId: string) => {
    if (!userId) {
      toast.error('Please log in to accept challenges');
      return;
    }

    try {
      console.log('Attempting to accept challenge:', { matchId, userId });
      
      // First, check if the match is still available for acceptance
      const { data: match, error: fetchError } = await supabase
        .from('matches')
        .select('id, status, opponent_id, creator_id')
        .eq('id', matchId)
        .single();

      if (fetchError) {
        console.error('Error fetching match:', fetchError);
        throw fetchError;
      }

      console.log('Match data:', match);

      if (match.status !== 'awaiting_opponent' || match.opponent_id !== null) {
        toast.error('This challenge is no longer available');
        fetchOpenChallenges(true);
        return;
      }

      if (match.creator_id === userId) {
        toast.error('You cannot accept your own challenge');
        return;
      }

      // Accept via RPC which also performs escrow hold on the opponent
      console.log('Attempting to accept challenge with escrow...');
      const { error } = await supabase.rpc('accept_challenge_with_escrow', {
        p_match_id: matchId,
        p_user_id: userId,
      });

      if (error) {
        console.error('Accept failed:', error);
        const msg = error.message || '';
        if (msg.includes('INSUFFICIENT_FUNDS')) {
          throw new Error('Insufficient balance to accept this challenge.');
        }
        if (msg.includes('USER_SUSPENDED')) {
          throw new Error('Your account is suspended and cannot accept matches.');
        }
        throw error;
      }
      
      console.log('Challenge accepted with escrow successfully');
      toast.success('Challenge accepted successfully!');
      fetchOpenChallenges(true);
    } catch (err: any) {
      console.error('Error accepting challenge:', err);
      toast.error(err.message || 'Failed to accept challenge');
    }
  };

  return { challenges, loading, refreshing, error, refetch: fetchOpenChallenges, acceptChallenge };
}

export function useLiveMatches() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false); // Set to false to avoid loading state
  const realtimeEnabled = import.meta.env.VITE_ENABLE_REALTIME !== 'false';
  const liveMatchesDisabled = import.meta.env.VITE_DISABLE_LIVE_MATCHES === 'true';

  useEffect(() => {
    if (!liveMatchesDisabled) {
      fetchLiveMatches();
    }
  }, [liveMatchesDisabled]);

  // Realtime updates for live/awaiting matches feed (guarded by env)
  useEffect(() => {
    if (!realtimeEnabled || liveMatchesDisabled) return;
    const channel = supabase
      .channel('matches-live-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => fetchLiveMatches()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [realtimeEnabled, liveMatchesDisabled]);

  // Polling fallback for live matches (every 8s)
  useEffect(() => {
    if (liveMatchesDisabled) return;
    const id = setInterval(fetchLiveMatches, 8000);
    return () => clearInterval(id);
  }, [liveMatchesDisabled]);

  const fetchLiveMatches = async () => {
    try {
      setLoading(true);
      
      // Try the simple query first without joins to avoid RLS issues
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .in('status', ['awaiting_opponent', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching matches:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        setLiveMatches([]);
        return;
      }

      // Fetch related data separately to avoid complex join issues
      const gameIds = [...new Set(data.map(m => m.game_id).filter(Boolean))];
      const gameModeIds = [...new Set(data.map(m => m.game_mode_id).filter(Boolean))];
      const creatorIds = [...new Set(data.map(m => m.creator_id).filter(Boolean))];
      const opponentIds = [...new Set(data.map(m => m.opponent_id).filter(Boolean))];
      const allUserIds = [...new Set([...creatorIds, ...opponentIds])];

      // Fetch games data if we have game IDs
      let games = [];
      if (gameIds.length > 0) {
        try {
          const { data: gamesData, error: gamesError } = await supabase
            .from('games')
            .select('*')
            .in('id', gameIds);
          
          if (!gamesError) {
            games = gamesData || [];
          }
        } catch (gameErr) {
          console.warn('Could not fetch games data:', gameErr);
        }
      }

      // Fetch game modes data if we have game mode IDs
      let gameModes = [];
      if (gameModeIds.length > 0) {
        try {
          const { data: gameModesData, error: gameModesError } = await supabase
            .from('game_modes')
            .select('*')
            .in('id', gameModeIds);
          
          if (!gameModesError) {
            gameModes = gameModesData || [];
          }
        } catch (gameModeErr) {
          console.warn('Could not fetch game modes data:', gameModeErr);
        }
      }

      // Fetch profiles if we have user IDs
      let profiles = [];
      if (allUserIds.length > 0) {
        try {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('user_id', allUserIds);
          
          if (!profilesError) {
            profiles = profilesData || [];
          }
        } catch (profileErr) {
          console.warn('Could not fetch profiles data:', profileErr);
        }
      }

      // Merge all data together (map relations to single objects)
      const matchesWithProfiles = data.map(match => ({
        ...match,
        games: games.find(g => g.id === match.game_id) || null,
        game_modes: gameModes.find(gm => gm.id === match.game_mode_id) || null,
        creator_profile: profiles.find(p => p.user_id === match.creator_id) || null,
        opponent_profile: match.opponent_id ? profiles.find(p => p.user_id === match.opponent_id) || null : null
      }));

      setLiveMatches(matchesWithProfiles);
    } catch (err: any) {
      console.error('Error fetching live matches:', err);
      // Set empty array on error to prevent app crash
      setLiveMatches([]);
    } finally {
      setLoading(false);
    }
  };

  return { liveMatches, loading, refetch: fetchLiveMatches };
}