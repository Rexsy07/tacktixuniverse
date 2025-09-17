import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserStats = Database['public']['Tables']['user_stats']['Row'];
type UserWallet = Database['public']['Tables']['user_wallets']['Row'];
type GamerTag = Database['public']['Tables']['gamer_tags']['Row'] & {
  games?: Database['public']['Tables']['games']['Row'];
};

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [gamerTags, setGamerTags] = useState<GamerTag[]>([]);
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
      
      // Fetch stats (with fallback computation if absent)
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (statsError && statsError.code !== 'PGRST116') throw statsError;

      // Fetch wallet
      const { data: walletData, error: walletError } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (walletError && walletError.code !== 'PGRST116') throw walletError;

      // Fetch gamer tags
      const { data: gamerTagsData, error: gamerTagsError } = await supabase
        .from('gamer_tags')
        .select(`
          *,
          games(*)
        `)
        .eq('user_id', user.id);

      if (gamerTagsError) throw gamerTagsError;

      let resolvedStats = statsData;
      if (!resolvedStats) {
        // Fallback: compute minimal stats from matches
        const { count: totalMatches } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`);

        const { count: totalWins } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('winner_id', user.id);

        resolvedStats = {
          // @ts-ignore
          user_id: user.id,
          total_matches: totalMatches || 0,
          total_wins: totalWins || 0,
          total_losses: Math.max((totalMatches || 0) - (totalWins || 0), 0),
          total_earnings: 0,
          longest_win_streak: 0,
          current_rank: null,
          updated_at: new Date().toISOString()
        } as any;
      }

      setProfile(profileData);
      setStats(resolvedStats);
      setWallet(walletData);
      setGamerTags(gamerTagsData || []);
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

  const updateGamerTag = async (gameId: string, gamerTag: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('gamer_tags')
        .upsert({
          user_id: user.id,
          game_id: gameId,
          gamer_tag: gamerTag,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      toast.success('Gamer tag updated successfully');
      fetchUserProfile();
    } catch (err: any) {
      toast.error(err.message);
      console.error('Error updating gamer tag:', err);
    }
  };

  return {
    profile,
    stats,
    wallet,
    gamerTags,
    loading,
    error,
    updateProfile,
    updateGamerTag,
    refetch: fetchUserProfile
  };
}