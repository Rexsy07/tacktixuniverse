import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useTeamParticipation() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const getMatchParticipants = async (matchId: string) => {
    try {
      // First, get all participants for the match
      const { data: participants, error: participantsError } = await supabase
        .from('match_participants')
        .select('*')
        .eq('match_id', matchId);

      if (participantsError) throw participantsError;

      if (!participants?.length) return [];

      // Then, get the profiles for those participants
      const userIds = participants.map(p => p.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      return participants.map(participant => ({
        ...participant,
        profiles: profiles?.find(p => p.user_id === participant.user_id) || null
      }));
    } catch (error: any) {
      console.error('Error fetching match participants:', error);
      return [];
    }
  };

  const acceptTeamChallenge = async (matchId: string, teamMembers: string[]) => {
    if (!user) {
      toast.error('Please log in to accept challenges');
      return;
    }

    try {
      setLoading(true);

      // Check if the match is still available
      const { data: match, error: fetchError } = await supabase
        .from('matches')
        .select('id, status, opponent_id, creator_id, format')
        .eq('id', matchId)
        .single();

      if (fetchError) throw fetchError;

      if (match.status !== 'awaiting_opponent' || match.opponent_id !== null) {
        toast.error('This challenge is no longer available');
        return false;
      }

      if (match.creator_id === user.id) {
        toast.error('You cannot accept your own challenge');
        return false;
      }

      // Validate team size
      const requiredTeamSize = parseInt(match.format.split('v')[0]);
      if (teamMembers.length + 1 !== requiredTeamSize) { // +1 for the captain
        toast.error(`You need exactly ${requiredTeamSize - 1} team members for a ${match.format} match`);
        return false;
      }

      // Update the match to mark it as accepted
      const { error: updateError } = await supabase
        .from('matches')
        .update({
          opponent_id: user.id,
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', matchId);

      if (updateError) throw updateError;

      // Add the captain to team B
      const { error: captainError } = await supabase
        .from('match_participants')
        .insert({
          match_id: matchId,
          user_id: user.id,
          team: 'B',
          role: 'captain'
        });

      if (captainError) throw captainError;

      // Add team members to team B
      if (teamMembers.length > 0) {
        const teamMemberInserts = teamMembers.map(memberId => ({
          match_id: matchId,
          user_id: memberId,
          team: 'B',
          role: 'member'
        }));

        const { error: teamError } = await supabase
          .from('match_participants')
          .insert(teamMemberInserts);

        if (teamError) throw teamError;
      }

      toast.success('Challenge accepted successfully!');
      return true;
    } catch (error: any) {
      console.error('Error accepting team challenge:', error);
      toast.error(error.message || 'Failed to accept challenge');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    getMatchParticipants,
    acceptTeamChallenge,
    loading
  };
}