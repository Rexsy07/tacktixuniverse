import { useNavigate } from "react-router-dom";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Clock, Plus } from "lucide-react";
import { toast } from "sonner";

const AdminTournaments = () => {
  const navigate = useNavigate();
  const tournaments = [
    {
      id: "T001",
      name: "CODM Championship",
      game: "Call of Duty Mobile",
      participants: 64,
      prizePool: "₦50,000",
      status: "active",
      startDate: "2024-01-20",
      endDate: "2024-01-25"
    },
    {
      id: "T002",
      name: "PUBG Squad Battle",
      game: "PUBG Mobile", 
      participants: 32,
      prizePool: "₦30,000",
      status: "registration",
      startDate: "2024-01-22",
      endDate: "2024-01-27"
    },
    {
      id: "T003",
      name: "Free Fire Masters",
      game: "Free Fire",
      participants: 48,
      prizePool: "₦25,000", 
      status: "completed",
      winner: "Team Phoenix",
      endDate: "2024-01-15"
    }
  ];

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
            <Button onClick={() => navigate("/admin/tournaments/create")}>
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
                <div className="text-2xl font-bold text-green-600">3</div>
                <p className="text-xs text-muted-foreground">Currently running</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">144</div>
                <p className="text-xs text-muted-foreground">Across all tournaments</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Prize Pool</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦105k</div>
                <p className="text-xs text-muted-foreground">Total active prizes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">12</div>
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
                      {tournament.prizePool}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {tournament.status === "completed" 
                        ? `Ended ${tournament.endDate}`
                        : `${tournament.startDate} - ${tournament.endDate}`
                      }
                    </span>
                  </div>

                  {tournament.winner && (
                    <div className="p-2 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Winner: {tournament.winner}</p>
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