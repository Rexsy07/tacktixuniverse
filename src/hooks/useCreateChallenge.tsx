import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ChallengeData {
  gameId: string;
  modeId: string;
  format: string;
  mapName?: string;
  stakeAmount: number;
  durationMinutes?: number;
  customRules?: string;
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

    try {
      setLoading(true);

      // Check if user has sufficient balance
      const { data: wallet, error: walletError } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (walletError) throw walletError;

      if ((wallet?.balance || 0) < challengeData.stakeAmount) {
        toast.error('Insufficient balance to create this challenge');
        return;
      }

      // Create the match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({
          creator_id: user.id,
          game_id: challengeData.gameId,
          game_mode_id: challengeData.modeId,
          format: challengeData.format,
          map_name: challengeData.mapName,
          stake_amount: challengeData.stakeAmount,
          duration_minutes: challengeData.durationMinutes,
          custom_rules: challengeData.customRules,
          status: 'awaiting_opponent'
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // Deduct stake from user's wallet (held in escrow)
      const { error: walletUpdateError } = await supabase
        .from('user_wallets')
        .update({
          balance: (wallet?.balance || 0) - challengeData.stakeAmount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (walletUpdateError) throw walletUpdateError;

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