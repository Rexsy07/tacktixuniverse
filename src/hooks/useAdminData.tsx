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
  role: 'user' | 'admin';
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
  format: string;
  players: string[];
  stake_amount: number;
  status: string;
  duration_minutes?: number;
  created_at: string;
  winner?: string;
  creator_id: string;
  opponent_id?: string | null;
}

export interface AdminFees {
  lifetime: number;
  today: number;
  last30Days: number;
  recent: Array<{ id: string; match_id: string; fee_amount: number; created_at: string }>;
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
  const realtimeEnabled = import.meta.env.VITE_ENABLE_REALTIME !== 'false';
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchAdminStats();
  }, [user]);

  // Realtime and polling for admin stats (non-disruptive)
  useEffect(() => {
    if (!user) return;

    // Polling fallback every 10s
    const pollId = setInterval(() => fetchAdminStats(true), 10000);

    // Supabase realtime subscriptions to trigger silent refreshes
    const channels: any[] = [];
    if (realtimeEnabled) {
      const tables = ['profiles', 'matches', 'transactions', 'tournaments', 'platform_fees'];
      tables.forEach((table) => {
        const ch = supabase
          .channel(`admin-stats-${table}`)
          .on('postgres_changes', { event: '*', schema: 'public', table }, () => fetchAdminStats(true))
          .subscribe();
        channels.push(ch);
      });
    }

    return () => {
      clearInterval(pollId);
      channels.forEach((ch) => {
        try { ch.unsubscribe?.(); supabase.removeChannel?.(ch); } catch (_) {}
      });
    };
  }, [user, realtimeEnabled]);

  const fetchAdminStats = async (isRefresh = false) => {
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

      // Compute active users (users who created/played a match in last 24h)
      const since = new Date();
      since.setDate(since.getDate() - 1);
      const { data: recentMatches } = await supabase
        .from('matches')
        .select('creator_id, opponent_id, created_at')
        .gte('created_at', since.toISOString());
      const activeUserSet = new Set<string>();
      (recentMatches || []).forEach((m: any) => {
        if (m.creator_id) activeUserSet.add(m.creator_id);
        if (m.opponent_id) activeUserSet.add(m.opponent_id);
      });

      // Total revenue from platform_fees (sum of fee_amount)
      let totalRevenue = 0;
      try {
        const { data: feesRows, error: feesError } = await supabase
          .from('platform_fees')
          .select('fee_amount');
        if (feesError && feesError.code === 'PGRST205') {
          console.warn('platform_fees table not found, defaulting to 0 revenue');
          totalRevenue = 0;
        } else if (feesError) {
          throw feesError;
        } else {
          totalRevenue = (feesRows || []).reduce((sum, r: any) => sum + (r.fee_amount || 0), 0);
        }
      } catch (err: any) {
        console.warn('Could not fetch platform fees:', err.message);
        totalRevenue = 0;
      }

      setStats({
        totalUsers: userCount || 0,
        activeUsers: activeUserSet.size,
        totalRevenue,
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
      if (!hasLoaded) setHasLoaded(true);
      // Only show the main loading state on first load
      setLoading(!isRefresh && !hasLoaded ? false : false);
    }
  };

  return { stats, loading: !hasLoaded && loading, refetch: fetchAdminStats };
};

export const useAdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const realtimeEnabled = import.meta.env.VITE_ENABLE_REALTIME !== 'false';
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchUsers();
  }, [user]);

  // Realtime + polling for users (silent updates)
  useEffect(() => {
    if (!user) return;

    const pollId = setInterval(() => fetchUsers(true), 12000);
    const channels: any[] = [];
    if (realtimeEnabled) {
      ['profiles', 'user_stats', 'user_wallets', 'user_flags'].forEach((table) => {
        const ch = supabase
          .channel(`admin-users-${table}`)
          .on('postgres_changes', { event: '*', schema: 'public', table }, () => fetchUsers(true))
          .subscribe();
        channels.push(ch);
      });
    }
    return () => {
      clearInterval(pollId);
      channels.forEach((ch) => {
        try { ch.unsubscribe?.(); supabase.removeChannel?.(ch); } catch (_) {}
      });
    };
  }, [user, realtimeEnabled]);

  const fetchUsers = async (isRefresh = false) => {
    try {
      setLoading(true);

      // Fetch profiles
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('*');
      if (profErr) throw profErr;

      const userIds = (profiles || []).map(p => p.user_id);

      // Fetch stats for these users
      let userIdToStats = new Map<string, any>();
      try {
        const { data: statsData, error: statsErr } = await supabase
          .from('user_stats')
          .select('*')
          .in('user_id', userIds);
        
        if (statsErr && statsErr.code === 'PGRST205') {
          console.warn('user_stats table not found, using default values');
          userIdToStats = new Map<string, any>();
        } else if (statsErr) {
          throw statsErr;
        } else {
          userIdToStats = new Map<string, any>((statsData || []).map(s => [s.user_id, s]));
        }
      } catch (err: any) {
        console.warn('Could not fetch user stats:', err.message);
        userIdToStats = new Map<string, any>();
      }

      // Fetch wallets for these users
      const { data: walletsData, error: walletsErr } = await supabase
        .from('user_wallets')
        .select('*')
        .in('user_id', userIds);
      if (walletsErr) throw walletsErr;
      const userIdToWallet = new Map<string, any>((walletsData || []).map(w => [w.user_id, w]));

      // Fetch user roles (via RPC to avoid RLS recursion)
      const { data: rolesData, error: rolesErr } = await supabase
        .rpc('admin_get_user_roles', { p_user_ids: userIds });
      if (rolesErr && rolesErr.code !== 'PGRST205') throw rolesErr;
      const userIdToRole = new Map<string, any>((rolesData || []).map((r: any) => [r.user_id, r]));

      // Fetch user flags (suspension)
      let userIdToFlags = new Map<string, any>();
      try {
        const { data: flagsData, error: flagsErr } = await supabase
          .from('user_flags')
          .select('*')
          .in('user_id', userIds);
        if (flagsErr && flagsErr.code === 'PGRST205') {
          console.warn('user_flags table not found, defaulting to not suspended');
          userIdToFlags = new Map<string, any>();
        } else if (flagsErr) {
          throw flagsErr;
        } else {
          userIdToFlags = new Map<string, any>((flagsData || []).map((f: any) => [f.user_id, f]));
        }
      } catch (err: any) {
        console.warn('Could not fetch user flags:', err.message);
        userIdToFlags = new Map<string, any>();
      }

      // Fetch last activity (latest match for each user)
      const { data: activityMatches } = await supabase
        .from('matches')
        .select('creator_id, opponent_id, created_at')
        .or(`creator_id.in.("${userIds.join('\",\"')}"),opponent_id.in.("${userIds.join('\",\"')}")`)
        .order('created_at', { ascending: false });
      const lastActiveMap = new Map<string, string>();
      (activityMatches || []).forEach((m: any) => {
        const ts = m.created_at;
        if (m.creator_id && !lastActiveMap.has(m.creator_id)) lastActiveMap.set(m.creator_id, ts);
        if (m.opponent_id && !lastActiveMap.has(m.opponent_id)) lastActiveMap.set(m.opponent_id, ts);
      });

      const adminUsers: AdminUser[] = (profiles || []).map(profile => {
        const userStats = userIdToStats.get(profile.user_id);
        const userWallet = userIdToWallet.get(profile.user_id);
        const userRole = userIdToRole.get(profile.user_id);
        const userFlags = userIdToFlags.get(profile.user_id);
        const isSuspended = !!userFlags?.is_suspended;
        return {
          // Use auth user_id for all admin actions and linking
          id: profile.user_id,
          username: profile.username || 'Anonymous',
          email: `${profile.username || 'user'}@example.com`,
          joinDate: profile.created_at,
          status: isSuspended ? 'suspended' : 'active',
          role: userRole?.role || 'user',
          matches: userStats?.total_matches || 0,
          winRate: userStats?.total_matches ? Math.round((userStats.total_wins / userStats.total_matches) * 100) : 0,
          totalEarnings: userStats?.total_earnings || 0,
          walletBalance: userWallet?.balance || 0,
          lastActive: lastActiveMap.get(profile.user_id) || '',
          verified: !!profile.verified
        };
      });

      setUsers(adminUsers);

    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      if (!hasLoaded) setHasLoaded(true);
      setLoading(!isRefresh && !hasLoaded ? false : false);
    }
  };

  const changeUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      const { error } = await supabase
        .rpc('admin_set_user_role', {
          p_target_user_id: userId,
          p_role: newRole
        });

      if (error) throw error;

      toast.success(`User role updated to ${newRole}`);
      await fetchUsers(); // Refresh the users list
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast.error(`Failed to update user role: ${error.message}`);
      return { success: false, error };
    }
  };

  const suspendUser = async (userId: string) => {
    try {
      // You can extend this to update a status field if you have one
      toast.success('User suspended (extend this function as needed)');
      return { success: true };
    } catch (error: any) {
      console.error('Error suspending user:', error);
      toast.error(`Failed to suspend user: ${error.message}`);
      return { success: false, error };
    }
  };

  return { users, loading: !hasLoaded && loading, refetch: fetchUsers, changeUserRole, suspendUser };
};

export const useAdminMatches = () => {
  const [matches, setMatches] = useState<AdminMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const realtimeEnabled = import.meta.env.VITE_ENABLE_REALTIME !== 'false';
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchMatches();
  }, [user]);

  // Realtime + polling for matches (silent refresh)
  useEffect(() => {
    if (!user) return;
    const pollId = setInterval(() => fetchMatches(true), 8000);
    const channels: any[] = [];
    if (realtimeEnabled) {
      const ch = supabase
        .channel('admin-matches')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => fetchMatches(true))
        .subscribe();
      channels.push(ch);
    }
    return () => {
      clearInterval(pollId);
      channels.forEach((ch) => {
        try { ch.unsubscribe?.(); supabase.removeChannel?.(ch); } catch (_) {}
      });
    };
  }, [user, realtimeEnabled]);

  const fetchMatches = async (isRefresh = false) => {
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

      // Enrich with usernames
      const userIds = Array.from(new Set((matchData || []).flatMap((m: any) => [m.creator_id, m.opponent_id, m.winner_id]).filter(Boolean)));
      let profilesById = new Map<string, any>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username')
          .in('user_id', userIds);
        profilesById = new Map<string, any>((profiles || []).map((p: any) => [p.user_id, p]));
      }

      const adminMatches: AdminMatch[] = (matchData || []).map((match: any) => ({
        id: match.id,
        game: match.games?.short_name || 'Unknown',
        mode: match.game_modes?.name || 'Unknown',
        format: match.format || '1v1',
        players: [
          profilesById.get(match.creator_id)?.username || 'Unknown',
          match.opponent_id ? (profilesById.get(match.opponent_id)?.username || 'Unknown') : '—'
        ],
        stake_amount: match.stake_amount,
        status: match.status,
        duration_minutes: match.duration_minutes,
        created_at: match.created_at,
        winner: match.winner_id ? (profilesById.get(match.winner_id)?.username || 'Unknown') : undefined,
        creator_id: match.creator_id,
        opponent_id: match.opponent_id || null,
      }));

      setMatches(adminMatches);

    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to fetch matches');
    } finally {
      if (!hasLoaded) setHasLoaded(true);
      setLoading(!isRefresh && !hasLoaded ? false : false);
    }
  };

  const resolveDispute = async (matchId: string, winnerId: string) => {
    try {
      // Validate winnerId
      if (!winnerId || typeof winnerId !== 'string' || winnerId.trim() === '') {
        toast.error('Invalid winner. No user selected.');
        return;
      }
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRe.test(winnerId)) {
        toast.error('Invalid winner. Not a valid user ID.');
        return;
      }

      const { error } = await supabase
        .from('matches')
        .update({ 
          status: 'completed',
          winner_id: winnerId,
          completed_at: new Date().toISOString()
        })
        .eq('id', matchId);

      if (error) throw error;

      // Team-aware settlement: try team settlement first, fallback to 1v1
      const { error: teamSettleErr } = await supabase.rpc('settle_team_match_escrow', {
        p_match_id: matchId,
        p_winner_user_id: winnerId,
        p_fee_percentage: 5.0,
      });

      if (teamSettleErr) {
        const msg = teamSettleErr?.message || '';
        const fnMissing = msg.includes('settle_team_match_escrow') || msg.includes('does not exist');
        if (!fnMissing) throw teamSettleErr;

        // Fallback to legacy single-winner settlement
        const { error: settleErr } = await supabase.rpc('settle_match_escrow', {
          p_match_id: matchId,
          p_winner_id: winnerId,
          p_fee_percentage: 5.0,
        });
        if (settleErr) throw settleErr;
      }

      toast.success('Dispute resolved and escrow settled successfully');
      fetchMatches(); // Refresh the data

    } catch (error: any) {
      console.error('Error resolving dispute:', error);
      toast.error(error.message || 'Failed to resolve dispute');
    }
  };

  return { matches, loading: !hasLoaded && loading, refetch: fetchMatches, resolveDispute };
};

export const useAdminFees = () => {
  const [fees, setFees] = useState<AdminFees>({ lifetime: 0, today: 0, last30Days: 0, recent: [] });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const realtimeEnabled = import.meta.env.VITE_ENABLE_REALTIME !== 'false';
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchFees();
  }, [user]);

  // Realtime + polling for fees (silent refresh)
  useEffect(() => {
    if (!user) return;
    const pollId = setInterval(() => fetchFees(true), 15000);
    const channels: any[] = [];
    if (realtimeEnabled) {
      const ch = supabase
        .channel('admin-platform_fees')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_fees' }, () => fetchFees(true))
        .subscribe();
      channels.push(ch);
    }
    return () => {
      clearInterval(pollId);
      channels.forEach((ch) => {
        try { ch.unsubscribe?.(); supabase.removeChannel?.(ch); } catch (_) {}
      });
    };
  }, [user, realtimeEnabled]);

  const fetchFees = async (isRefresh = false) => {
    try {
      setLoading(true);

      // Check if platform_fees table exists by trying to query it
      const { data: lifetimeAgg, error: lifetimeErr } = await supabase
        .from('platform_fees')
        .select('fee_amount');
      
      // If table doesn't exist, return default empty values
      if (lifetimeErr && lifetimeErr.code === 'PGRST205') {
        console.warn('platform_fees table not found, using default values');
        setFees({ lifetime: 0, today: 0, last30Days: 0, recent: [] });
        return;
      } else if (lifetimeErr) {
        throw lifetimeErr;
      }

      const lifetime = (lifetimeAgg || []).reduce((s, r: any) => s + (r.fee_amount || 0), 0);

      // Today
      const today = new Date().toISOString().split('T')[0];
      const { data: todayAgg, error: todayErr } = await supabase
        .from('platform_fees')
        .select('fee_amount, created_at')
        .gte('created_at', `${today}T00:00:00.000Z`);
      if (todayErr) throw todayErr;
      const todayTotal = (todayAgg || []).reduce((s, r: any) => s + (r.fee_amount || 0), 0);

      // Last 30 days
      const last30 = new Date();
      last30.setDate(last30.getDate() - 30);
      const { data: last30Agg, error: last30Err } = await supabase
        .from('platform_fees')
        .select('fee_amount, created_at')
        .gte('created_at', last30.toISOString());
      if (last30Err) throw last30Err;
      const last30Total = (last30Agg || []).reduce((s, r: any) => s + (r.fee_amount || 0), 0);

      // Recent entries
      const { data: recent, error: recentErr } = await supabase
        .from('platform_fees')
        .select('id, match_id, fee_amount, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      if (recentErr) throw recentErr;

      setFees({ lifetime, today: todayTotal, last30Days: last30Total, recent: recent || [] });
    } catch (error) {
      console.error('Error fetching fees:', error);
      toast.error('Failed to fetch platform fees');
    } finally {
      if (!hasLoaded) setHasLoaded(true);
      setLoading(!isRefresh && !hasLoaded ? false : false);
    }
  };

  return { fees, loading: !hasLoaded && loading, refetch: fetchFees };
};
