import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  pendingWithdrawals: number;
  activeMatches: number;
  completedToday: number;
  tournaments: number;
  disputes: number;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  joinDate: string;
  status: 'active' | 'suspended' | 'pending';
  matches: number;
  winRate: number;
  totalEarnings: number;
  walletBalance: number;
  lastActive: string;
  verified: boolean;
}

export interface AdminMatch {
  id: string;
  game: string;
  mode: string;
  players: string[];
  stake_amount: number;
  status: string;
  duration_minutes?: number;
  created_at: string;
  winner?: string;
}

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    pendingWithdrawals: 0,
    activeMatches: 0,
    completedToday: 0,
    tournaments: 0,
    disputes: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAdminStats();
    }
  }, [user]);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);

      // Fetch user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch active matches
      const { count: activeMatchCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .in('status', ['awaiting_opponent', 'in_progress']);

      // Fetch today's completed matches
      const today = new Date().toISOString().split('T')[0];
      const { count: todayMatches } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('completed_at', `${today}T00:00:00.000Z`);

      // Fetch tournaments
      const { count: tournamentCount } = await supabase
        .from('tournaments')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'completed');

      // Fetch disputed matches
      const { count: disputeCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'disputed');

      // Fetch pending withdrawals
      const { count: withdrawalCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'withdrawal')
        .eq('status', 'pending');

      setStats({
        totalUsers: userCount || 0,
        activeUsers: Math.floor((userCount || 0) * 0.8), // Mock active users as 80%
        totalRevenue: 485000, // This would need a more complex calculation
        pendingWithdrawals: withdrawalCount || 0,
        activeMatches: activeMatchCount || 0,
        completedToday: todayMatches || 0,
        tournaments: tournamentCount || 0,
        disputes: disputeCount || 0
      });

    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast.error('Failed to fetch admin statistics');
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refetch: fetchAdminStats };
};

export const useAdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch profiles with stats and wallet data - use left joins to avoid empty results
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_stats (*),
          user_wallets (*)
        `);

      if (error) throw error;

      const adminUsers: AdminUser[] = (profiles || []).map(profile => {
        const userStats = Array.isArray(profile.user_stats) ? profile.user_stats[0] : profile.user_stats;
        const userWallet = Array.isArray(profile.user_wallets) ? profile.user_wallets[0] : profile.user_wallets;
        
        return {
          id: profile.id,
          username: profile.username || 'Anonymous',
          email: `${profile.username}@email.com`, // Mock email since we don't store it
          joinDate: profile.created_at,
          status: 'active', // Default status since we don't have a status field
          matches: userStats?.total_matches || 0,
          winRate: userStats?.total_matches ? 
            Math.round((userStats.total_wins / userStats.total_matches) * 100) : 0,
          totalEarnings: userStats?.total_earnings || 0,
          walletBalance: userWallet?.balance || 0,
          lastActive: '2 hours ago', // Mock data
          verified: true // Mock verified status
        };
      });

      setUsers(adminUsers);

    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  return { users, loading, refetch: fetchUsers };
};

export const useAdminMatches = () => {
  const [matches, setMatches] = useState<AdminMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user]);

  const fetchMatches = async () => {
    try {
      setLoading(true);

      const { data: matchData, error } = await supabase
        .from('matches')
        .select(`
          *,
          games (name, short_name),
          game_modes (name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const adminMatches: AdminMatch[] = (matchData || []).map(match => ({
        id: match.id,
        game: match.games?.short_name || 'Unknown',
        mode: match.game_modes?.name || 'Unknown',
        players: ['Player 1', 'Player 2'], // Simplified for admin view
        stake_amount: match.stake_amount,
        status: match.status,
        duration_minutes: match.duration_minutes,
        created_at: match.created_at,
        winner: match.winner_id ? 'Winner' : undefined
      }));

      setMatches(adminMatches);

    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  };

  const resolveDispute = async (matchId: string, winnerId: string) => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ 
          status: 'completed',
          winner_id: winnerId,
          completed_at: new Date().toISOString()
        })
        .eq('id', matchId);

      if (error) throw error;

      toast.success('Dispute resolved successfully');
      fetchMatches(); // Refresh the data

    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast.error('Failed to resolve dispute');
    }
  };

  return { matches, loading, refetch: fetchMatches, resolveDispute };
};