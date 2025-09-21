import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserWallet = Database['public']['Tables']['user_wallets']['Row'];

// Simplified user stats computed from matches
type UserStats = {
  user_id: string;
  total_matches: number;
  total_wins: number;
  total_losses: number;
  total_earnings: number;
  longest_win_streak: number;
  current_rank: string | null;
  updated_at: string;
};

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      
      // Fetch wallet
      const { data: walletData, error: walletError } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (walletError && walletError.code !== 'PGRST116') throw walletError;

      // Compute stats from matches
      const { count: totalMatches } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`);

      const { count: totalWins } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('winner_id', user.id);

      const computedStats: UserStats = {
        user_id: user.id,
        total_matches: totalMatches || 0,
        total_wins: totalWins || 0,
        total_losses: Math.max((totalMatches || 0) - (totalWins || 0), 0),
        total_earnings: walletData?.balance || 0,
        longest_win_streak: 0,
        current_rank: null,
        updated_at: new Date().toISOString()
      };

      setProfile(profileData);
      setStats(computedStats);
      setWallet(walletData);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            ...updates,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        );

      if (error) throw error;
      
      toast.success('Profile updated successfully');
      fetchUserProfile();
    } catch (err: any) {
      toast.error(err.message);
      console.error('Error updating profile:', err);
    }
  };

  return {
    profile,
    stats,
    wallet,
    loading,
    error,
    updateProfile,
    refetch: fetchUserProfile
  };
}