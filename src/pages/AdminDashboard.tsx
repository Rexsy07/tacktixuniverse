import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, Wallet, Gamepad2, Trophy, TrendingUp, 
  AlertTriangle, Clock, DollarSign, Activity 
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import { useAdminStats } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { stats, loading } = useAdminStats();
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Load real recent users and transactions and keep them live without disrupting UI
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data: users } = await supabase
        .from('profiles')
        .select('username, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (!mounted) return;
      setRecentUsers((users || []).map(u => ({
        username: u.username || 'Anonymous',
        joinDate: u.created_at,
        matches: 0,
        earnings: 0
      })));

      const { data: txns } = await supabase
        .from('transactions')
        .select('id, user_id, type, amount, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (!mounted) return;
      setRecentTransactions((txns || []).map(t => ({
        id: t.id,
        user: (t.user_id || '').substring(0, 6) + '…',
        type: t.type,
        amount: Number(t.amount) || 0,
        status: t.status
      })));

      const { count: disputes } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'disputed');
      if (!mounted) return;
      setAlerts([
        { type: 'dispute', message: `${disputes || 0} match disputes awaiting review`, urgent: (disputes || 0) > 0 }
      ]);
    };

    const interval = setInterval(load, 12000);

    // Realtime silent refresh triggers
    const ch1 = supabase.channel('admin-dashboard-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, load)
      .subscribe();
    const ch2 = supabase.channel('admin-dashboard-transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, load)
      .subscribe();
    const ch3 = supabase.channel('admin-dashboard-matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, load)
      .subscribe();

    // Initial load
    load();

    return () => {
      mounted = false;
      clearInterval(interval);
      try { ch1.unsubscribe(); supabase.removeChannel(ch1); } catch (_) {}
      try { ch2.unsubscribe(); supabase.removeChannel(ch2); } catch (_) {}
      try { ch3.unsubscribe(); supabase.removeChannel(ch3); } catch (_) {}
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      <div className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-foreground/70">Monitor platform activity and manage operations</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card">
            <div className="p-6 text-center">
              <Users className="h-8 w-8 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <div className="text-sm text-foreground/70">Total Users</div>
              <div className="text-xs text-success mt-1">+{stats.activeUsers} online</div>
            </div>
          </Card>
          
          <Card className="glass-card">
            <div className="p-6 text-center">
              <DollarSign className="h-8 w-8 mx-auto text-success mb-2" />
              <div className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</div>
              <div className="text-sm text-foreground/70">Total Revenue</div>
              <div className="text-xs text-success mt-1">+12% this month</div>
            </div>
          </Card>
          
          <Card className="glass-card">
            <div className="p-6 text-center">
              <Gamepad2 className="h-8 w-8 mx-auto text-accent mb-2" />
              <div className="text-2xl font-bold">{stats.activeMatches}</div>
              <div className="text-sm text-foreground/70">Active Matches</div>
              <div className="text-xs text-foreground/60 mt-1">{stats.completedToday} completed today</div>
            </div>
          </Card>
          
          <Card className="glass-card">
            <div className="p-6 text-center">
              <Clock className="h-8 w-8 mx-auto text-warning mb-2" />
              <div className="text-2xl font-bold">{stats.pendingWithdrawals}</div>
              <div className="text-sm text-foreground/70">Pending Withdrawals</div>
              <div className="text-xs text-warning mt-1">Requires attention</div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Alerts */}
          <div>
            <Card className="glass-card">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-warning" />
                  Alerts
                </h3>
                
                <div className="space-y-3">
                  {alerts.map((alert, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${
                      alert.urgent 
                        ? 'border-destructive/20 bg-destructive/5' 
                        : 'border-warning/20 bg-warning/5'
                    }`}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm">{alert.message}</p>
                        <Badge variant={alert.urgent ? "destructive" : "secondary"}>
                          {alert.urgent ? "Urgent" : "Info"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Users */}
          <div>
            <Card className="glass-card">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Recent Users</h3>
                  <Button variant="outline" size="sm">View All</Button>
                </div>
                
                <div className="space-y-3">
                  {recentUsers.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-3 glass rounded-lg">
                      <div>
                        <div className="font-semibold">{user.username}</div>
                        <div className="text-xs text-foreground/60">
                          {Number(user.matches || 0)} matches • ₦{Number(user.earnings || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-xs text-foreground/60">
                        {new Date(user.joinDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Transactions */}
          <div>
            <Card className="glass-card">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Recent Transactions</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate("/admin/wallet")}
                  >
                    View All
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 glass rounded-lg">
                      <div>
                        <div className="font-semibold text-sm">{transaction.user}</div>
                        <div className="text-xs text-foreground/60 capitalize">
                          {transaction.type.replace('_', ' ')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">
                          ₦{transaction.amount.toLocaleString()}
                        </div>
                        <Badge 
                          variant={transaction.status === "completed" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="glass-card">
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                className="h-16 flex-col gap-2" 
                variant="outline"
                onClick={() => navigate("/admin/users")}
              >
                <Users className="h-5 w-5" />
                <span className="text-sm">Manage Users</span>
              </Button>
              
              <Button 
                className="h-16 flex-col gap-2" 
                variant="outline"
                onClick={() => navigate("/admin/wallet")}
              >
                <Wallet className="h-5 w-5" />
                <span className="text-sm">Process Withdrawals</span>
              </Button>
              
              <Button 
                className="h-16 flex-col gap-2" 
                variant="outline"
                onClick={() => navigate("/admin/matches")}
              >
                <Gamepad2 className="h-5 w-5" />
                <span className="text-sm">Resolve Disputes</span>
              </Button>
              
              <Button 
                className="h-16 flex-col gap-2" 
                variant="outline"
                onClick={() => navigate("/admin/tournaments")}
              >
                <Trophy className="h-5 w-5" />
                <span className="text-sm">Create Tournament</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;