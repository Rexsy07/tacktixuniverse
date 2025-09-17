import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Clock, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AdminTournaments = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    active: 0,
    totalParticipants: 0,
    totalActivePrizePool: 0,
    completedThisMonth: 0
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tournaments')
          .select(`*, games(name, short_name)`) 
          .order('created_at', { ascending: false });
        if (error) throw error;

        // For each tournament, fetch participants count if not present
        const withCounts = await Promise.all((data || []).map(async (t: any) => {
          let participants = t.current_participants;
          if (participants == null) {
            const { count } = await supabase
              .from('tournament_participants')
              .select('*', { count: 'exact', head: true })
              .eq('tournament_id', t.id);
            participants = count || 0;
          }
          return {
            id: t.id,
            name: t.name,
            game: t.games?.name || 'Unknown',
            participants,
            prizePool: Number(t.prize_pool) || 0,
            status: t.status,
            startDate: t.start_date,
            endDate: t.end_date,
            winner_user_id: t.winner_user_id
          };
        }));

        setTournaments(withCounts);

        // Compute stats
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const activeSet = new Set(['registration','in_progress','live','active']);
        const active = withCounts.filter(t => activeSet.has(t.status)).length;
        const totalParticipants = withCounts.reduce((s, t) => s + (t.participants || 0), 0);
        const totalActivePrizePool = withCounts
          .filter(t => activeSet.has(t.status))
          .reduce((s, t) => s + (t.prizePool || 0), 0);
        const completedThisMonth = withCounts.filter(t => {
          if (t.status !== 'completed' || !t.endDate) return false;
          const d = new Date(t.endDate);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;

        setStats({
          active,
          totalParticipants,
          totalActivePrizePool,
          completedThisMonth
        });
      } catch (e: any) {
        toast.error(e.message || 'Failed to load tournaments');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case "active": return "bg-green-500";
      case "registration": return "bg-blue-500";
      case "completed": return "bg-gray-500";
      default: return "bg-yellow-500";
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 ml-64 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Tournament Management</h1>
              <p className="text-muted-foreground">Create and manage platform tournaments</p>
            </div>
            <Button onClick={() => navigate("/admin/tournaments/create") }>
              <Plus className="h-4 w-4 mr-2" />
              Create Tournament
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Tournaments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <p className="text-xs text-muted-foreground">Currently running</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.totalParticipants.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Across all tournaments</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Prize Pool</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{stats.totalActivePrizePool.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total active prizes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{stats.completedThisMonth}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          {/* Tournaments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Trophy className="h-5 w-5 text-primary" />
                    <Badge variant="outline" className="capitalize">
                      <div className={`w-2 h-2 rounded-full mr-1 ${getStatusColor(tournament.status)}`}></div>
                      {tournament.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{tournament.name}</CardTitle>
                  <CardDescription>{tournament.game}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{tournament.participants} players</span>
                    </div>
                    <div className="text-lg font-bold text-primary">
                      ₦{Number(tournament.prizePool || 0).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {tournament.status === "completed" 
                        ? `Ended ${tournament.endDate ? new Date(tournament.endDate).toLocaleDateString() : ''}`
                        : `${tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : ''} ${tournament.endDate ? `- ${new Date(tournament.endDate).toLocaleDateString()}` : ''}`
                      }
                    </span>
                  </div>

                  {tournament.winner_user_id && (
                    <div className="p-2 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Winner: {tournament.winner_user_id}</p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => navigate(`/admin/tournaments/${tournament.id}`)}
                    >
                      View Details
                    </Button>
                    {tournament.status !== "completed" && (
                      <Button 
                        className="flex-1"
                        onClick={() => navigate(`/admin/tournaments/${tournament.id}/manage`)}
                      >
                        Manage
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminTournaments;