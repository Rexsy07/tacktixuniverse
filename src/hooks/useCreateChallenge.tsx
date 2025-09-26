import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isTeamFormat, getTeamSizes } from '@/utils/gameFormats';

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

      // Create challenge via RPC that also performs escrow hold on the creator
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_match_with_escrow', {
        p_creator_id: user.id,
        p_game_id: challengeData.gameId,
        p_game_mode_id: challengeData.modeId,
        p_format: challengeData.format,
        p_map_name: challengeData.mapName || null,
        p_stake_amount: challengeData.stakeAmount,
        p_duration_minutes: challengeData.durationMinutes || 60,
        p_custom_rules: challengeData.customRules || null
      });

      if (rpcError) {
        console.error('Challenge creation error:', rpcError);
        const msg = rpcError.message || '';
        if (msg.includes('INSUFFICIENT_FUNDS')) {
          throw new Error('Insufficient balance to create this challenge.');
        }
        if (msg.includes('USER_SUSPENDED')) {
          throw new Error('Your account is suspended and cannot create matches.');
        }
        throw rpcError;
      }

      const matchId = rpcData as unknown as string;
      if (!matchId) {
        toast.error('Failed to create challenge');
        return;
      }

      // For team-based matches, add invited team members if provided (optional)
      if (isTeamFormat(challengeData.format) && challengeData.teamMembers?.length) {
        const { a: teamASize } = getTeamSizes(challengeData.format);
        const allowed = Math.max(teamASize - 1, 0); // minus captain
        const trimmed = challengeData.teamMembers.slice(0, allowed);
        const teamMembers = trimmed.map(memberId => ({
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