import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, Wallet, Gamepad2, Trophy, TrendingUp, 
  AlertTriangle, Clock, DollarSign, Activity 
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import { useAdminStats } from "@/hooks/useAdminData";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { stats, loading } = useAdminStats();

  const recentUsers = [
    { username: "NaijaSharpShooter", joinDate: "2024-01-15", matches: 23, earnings: 12500 },
    { username: "LagosWarrior", joinDate: "2024-01-14", matches: 15, earnings: 8200 },
    { username: "AbujaTitan", joinDate: "2024-01-14", matches: 31, earnings: 15600 }
  ];

  const recentTransactions = [
    { id: "1", user: "ChampionCODM", type: "withdrawal", amount: 5000, status: "pending" },
    { id: "2", user: "WarzoneMaster", type: "deposit", amount: 2000, status: "completed" },
    { id: "3", user: "FreeFire King", type: "match_win", amount: 800, status: "completed" }
  ];

  const alerts = [
    { type: "dispute", message: "8 match disputes awaiting review", urgent: true },
    { type: "withdrawal", message: "15 withdrawal requests pending", urgent: false },
    { type: "system", message: "Server maintenance due in 2 hours", urgent: true }
  ];

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
                          {user.matches} matches • ₦{user.earnings.toLocaleString()}
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
                  <Button variant="outline" size="sm">View All</Button>
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