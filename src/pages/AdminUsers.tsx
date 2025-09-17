import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Filter, MoreVertical, User, 
  Ban, CheckCircle, AlertCircle, Wallet 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminSidebar from "@/components/AdminSidebar";
import { toast } from "sonner";
import { useAdminUsers } from "@/hooks/useAdminData";

const AdminUsers = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const { users, loading } = useAdminUsers();
  const totalUsers = users.length;
  const activeCount = users.filter(u => u.status === 'active').length;
  const pendingCount = users.filter(u => u.status === 'pending').length;
  const suspendedCount = users.filter(u => u.status === 'suspended').length;

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || user.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-success text-success-foreground";
      case "suspended": return "bg-destructive text-destructive-foreground";
      case "pending": return "bg-warning text-warning-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-3 w-3" />;
      case "suspended": return <Ban className="h-3 w-3" />;
      case "pending": return <AlertCircle className="h-3 w-3" />;
      default: return <User className="h-3 w-3" />;
    }
  };

  const handleSuspendUser = (userId: string, username: string) => {
    toast.success(`User ${username} has been suspended`);
    // Handle suspend logic here
  };

  const handleReactivateUser = (userId: string, username: string) => {
    toast.success(`User ${username} has been reactivated`);
    // Handle reactivate logic here
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      <div className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-foreground/70">Manage user accounts, verify profiles, and handle suspensions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card">
            <div className="p-4 text-center">
              <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
              <div className="text-sm text-foreground/70">Total Users</div>
            </div>
          </Card>
          <Card className="glass-card">
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-success">{activeCount.toLocaleString()}</div>
              <div className="text-sm text-foreground/70">Active</div>
            </div>
          </Card>
          <Card className="glass-card">
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-warning">{pendingCount.toLocaleString()}</div>
              <div className="text-sm text-foreground/70">Pending</div>
            </div>
          </Card>
          <Card className="glass-card">
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-destructive">{suspendedCount.toLocaleString()}</div>
              <div className="text-sm text-foreground/70">Suspended</div>
            </div>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="glass-card mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/50" />
                <Input
                  placeholder="Search users by username or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("all")}
                >
                  All Users
                </Button>
                <Button
                  variant={filterStatus === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("active")}
                >
                  Active
                </Button>
                <Button
                  variant={filterStatus === "suspended" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("suspended")}
                >
                  Suspended
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="glass-card">
          <div className="p-6">
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="glass rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{user.username}</h3>
                          {user.verified && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          <Badge className={`${getStatusColor(user.status)} text-xs`}>
                            {getStatusIcon(user.status)}
                            <span className="ml-1 capitalize">{user.status}</span>
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-foreground/70">
                          {user.email} • Joined {new Date(user.joinDate).toLocaleDateString()}
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 mt-2 text-xs">
                          <div>
                            <span className="text-foreground/50">Matches:</span>
                            <div className="font-semibold">{user.matches}</div>
                          </div>
                          <div>
                            <span className="text-foreground/50">Win Rate:</span>
                            <div className="font-semibold">{user.winRate}%</div>
                          </div>
                          <div>
                            <span className="text-foreground/50">Earnings:</span>
                            <div className="font-semibold">₦{user.totalEarnings.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-foreground/50">Balance:</span>
                            <div className="font-semibold text-primary">₦{user.walletBalance.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm text-foreground/70">
                        Last active: {user.lastActive}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass">
                          <DropdownMenuItem onClick={() => navigate(`/admin/users/${user.id}/profile`)}>
                            <User className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/wallet?user=${user.id}`)}>
                            <Wallet className="mr-2 h-4 w-4" />
                            View Wallet
                          </DropdownMenuItem>
                          {user.status === "active" ? (
                            <DropdownMenuItem 
                              className="text-destructive" 
                              onClick={() => handleSuspendUser(user.id, user.username)}
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Suspend User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              className="text-success"
                              onClick={() => handleReactivateUser(user.id, user.username)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Reactivate User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminUsers;