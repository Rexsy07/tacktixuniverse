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

  useEffect(() => {
    if (user) {
      fetchUserMatches();
    }
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

  useEffect(() => {
    fetchOpenChallenges();
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
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('matches')
        .update({
          opponent_id: userId,
          accepted_at: new Date().toISOString(),
          status: 'in_progress'
        })
        .eq('id', matchId);

      if (error) throw error;
      
      toast.success('Challenge accepted successfully!');
      fetchOpenChallenges();
    } catch (err: any) {
      toast.error(err.message);
      console.error('Error accepting challenge:', err);
    }
  };

  return { challenges, loading, error, refetch: fetchOpenChallenges, acceptChallenge };
}

export function useLiveMatches() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveMatches();
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