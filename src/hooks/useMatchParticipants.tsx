import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Participant {
  id: string;
  match_id: string;
  user_id: string;
  team: 'A' | 'B';
  role: 'captain' | 'member';
  joined_at: string;
  profile?: {
    user_id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface TeamStructure {
  teamA: Participant[];
  teamB: Participant[];
}

export function useMatchParticipants(matchId: string | undefined) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teamStructure, setTeamStructure] = useState<TeamStructure>({ teamA: [], teamB: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (matchId) {
      fetchParticipants();
    }
  }, [matchId]);

  const fetchParticipants = async () => {
    if (!matchId) return;

    try {
      setLoading(true);
      
      // Fetch participants for this match
      const { data: participantsData, error: participantsError } = await supabase
        .from('match_participants')
        .select('*')
        .eq('match_id', matchId)
        .order('team')
        .order('role', { ascending: false }); // captains first

      if (participantsError) throw participantsError;

      if (!participantsData || participantsData.length === 0) {
        setParticipants([]);
        setTeamStructure({ teamA: [], teamB: [] });
        setLoading(false);
        return;
      }

      // Get user IDs to fetch profiles
      const userIds = participantsData.map(p => p.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine participants with their profiles
      const participantsWithProfiles = participantsData.map(participant => ({
        ...participant,
        profile: profiles?.find(p => p.user_id === participant.user_id)
      }));

      // Organize into team structure
      const teamA = participantsWithProfiles.filter(p => p.team === 'A');
      const teamB = participantsWithProfiles.filter(p => p.team === 'B');

      setParticipants(participantsWithProfiles);
      setTeamStructure({ teamA, teamB });
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching match participants:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTeamCaptain = (team: 'A' | 'B') => {
    const teamMembers = team === 'A' ? teamStructure.teamA : teamStructure.teamB;
    return teamMembers.find(p => p.role === 'captain');
  };

  const getTeamMembers = (team: 'A' | 'B') => {
    const teamMembers = team === 'A' ? teamStructure.teamA : teamStructure.teamB;
    return teamMembers.filter(p => p.role === 'member');
  };

  return {
    participants,
    teamStructure,
    loading,
    error,
    refetch: fetchParticipants,
    getTeamCaptain,
    getTeamMembers
  };
}