import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isTeamFormat } from '@/utils/gameFormats';

interface ChallengeData {
  gameId: string;
  modeId: string;
  format: string;
  mapName?: string;
  stakeAmount: number;
  durationMinutes?: number;
  customRules?: string;
  teamMembers?: string[]; // Array of user IDs for team members
}

export function useCreateChallenge() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const createChallenge = async (challengeData: ChallengeData) => {
    if (!user) {
      toast.error('Please log in to create a challenge');
      return;
    }

    // Temporary: Disable challenge creation until database issue is resolved
    if (import.meta.env.VITE_DISABLE_CHALLENGE_CREATION === 'true') {
      toast.error('Challenge creation is temporarily disabled due to database maintenance');
      return;
    }

    try {
      setLoading(true);

      // Create challenge using direct table insert (bypassing problematic RPC function)
      const { data: matchData, error: challengeError } = await supabase
        .from('matches')
        .insert({
          creator_id: user.id,
          game_id: challengeData.gameId,
          game_mode_id: challengeData.modeId,
          format: challengeData.format,
          map_name: challengeData.mapName || null,
          stake_amount: challengeData.stakeAmount,
          duration_minutes: challengeData.durationMinutes || 60,
          custom_rules: challengeData.customRules || null,
          status: 'awaiting_opponent'
        })
        .select('id')
        .single();

      if (challengeError) {
        console.error('Challenge creation error:', challengeError);
        throw challengeError;
      }

      if (!matchData?.id) {
        toast.error('Failed to create challenge');
        return;
      }

      const matchId = matchData.id;

      // Add creator to match_participants table for all match formats
      const { error: participantError } = await supabase
        .from('match_participants')
        .insert({
          match_id: matchId,
          user_id: user.id,
          team: 'A' as const,
          role: 'captain' as const
        });

      if (participantError) throw participantError;

      // For team-based matches, add invited team members if provided (optional)
      if (isTeamFormat(challengeData.format) && challengeData.teamMembers?.length) {
        const teamMembers = challengeData.teamMembers.map(memberId => ({
          match_id: matchId,
          user_id: memberId,
          team: 'A' as const,
          role: 'member' as const
        }));

        const { error: teamError } = await supabase
          .from('match_participants')
          .insert(teamMembers);

        if (teamError) {
          console.warn('Some team members could not be added:', teamError);
          // Don't fail the entire match creation if team invitations fail
        }
      }

      toast.success('Challenge created successfully!');
      navigate('/matches');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create challenge');
      console.error('Error creating challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  return { createChallenge, loading };
}