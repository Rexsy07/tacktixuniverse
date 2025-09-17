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
        () => fetchUserMatches()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `opponent_id=eq.${user.id}`,
        },
        () => fetchUserMatches()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, realtimeEnabled]);

  // Polling fallback for user matches (every 6s)
  useEffect(() => {
    if (!user) return;
    const id = setInterval(fetchUserMatches, 6000);
    return () => clearInterval(id);
  }, [user]);

  const fetchUserMatches = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
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
    }
  };

  return { matches, loading, error, refetch: fetchUserMatches };
}

export function useOpenChallenges(gameFilter?: string) {
  const [challenges, setChallenges] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
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
        () => fetchOpenChallenges()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameFilter, realtimeEnabled]);

  // Polling fallback for open challenges (every 6s)
  useEffect(() => {
    const id = setInterval(fetchOpenChallenges, 6000);
    return () => clearInterval(id);
  }, [gameFilter]);

  const fetchOpenChallenges = async () => {
    try {
      setLoading(true);
      
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
        fetchOpenChallenges();
        return;
      }

      if (match.creator_id === userId) {
        toast.error('You cannot accept your own challenge');
        return;
      }

      // Try the simple update approach first
      console.log('Attempting to update match...');
      const { error } = await supabase
        .from('matches')
        .update({
          opponent_id: userId,
          accepted_at: new Date().toISOString(),
          status: 'in_progress'
        })
        .eq('id', matchId);

      if (error) {
        console.error('Update failed:', error);
        throw error;
      }
      
      console.log('Challenge accepted successfully');
      toast.success('Challenge accepted successfully!');
      fetchOpenChallenges();
    } catch (err: any) {
      console.error('Error accepting challenge:', err);
      toast.error(err.message || 'Failed to accept challenge');
    }
  };

  return { challenges, loading, error, refetch: fetchOpenChallenges, acceptChallenge };
}

export function useLiveMatches() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const realtimeEnabled = import.meta.env.VITE_ENABLE_REALTIME !== 'false';

  useEffect(() => {
    fetchLiveMatches();
  }, []);

  // Realtime updates for live/awaiting matches feed (guarded by env)
  useEffect(() => {
    if (!realtimeEnabled) return;
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
  }, [realtimeEnabled]);

  // Polling fallback for live matches (every 8s)
  useEffect(() => {
    const id = setInterval(fetchLiveMatches, 8000);
    return () => clearInterval(id);
  }, []);

  const fetchLiveMatches = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          games(*),
          game_modes(*)
        `)
        .in('status', ['awaiting_opponent', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Fetch profiles for live matches
      const creatorIds = [...new Set(data?.map(m => m.creator_id) || [])];
      const opponentIds = [...new Set(data?.map(m => m.opponent_id).filter(Boolean) || [])];
      const allUserIds = [...new Set([...creatorIds, ...opponentIds])];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', allUserIds);

      if (profilesError) throw profilesError;

      // Merge profiles with matches
      const matchesWithProfiles = data?.map(match => ({
        ...match,
        creator_profile: profiles?.find(p => p.user_id === match.creator_id) || null,
        opponent_profile: match.opponent_id ? profiles?.find(p => p.user_id === match.opponent_id) || null : null
      })) || [];

      setLiveMatches(matchesWithProfiles);
    } catch (err: any) {
      console.error('Error fetching live matches:', err);
    } finally {
      setLoading(false);
    }
  };

  return { liveMatches, loading, refetch: fetchLiveMatches };
}