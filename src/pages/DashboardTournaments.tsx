import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, Users, Calendar, Clock, 
  Target, Star, Award, Crown 
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useTournaments, useUserTournaments } from "@/hooks/useTournaments";
import { useAuth } from "@/hooks/useAuth";

const DashboardTournaments = () => {
  const [selectedTab, setSelectedTab] = useState("available");
  const { user } = useAuth();
  const { tournaments, loading: tournamentsLoading, registerForTournament } = useTournaments();
  const { 
    myTournaments, 
    availableTournaments, 
    completedTournaments, 
    loading: userTournamentsLoading 
  } = useUserTournaments();

  const handleRegister = (tournamentId: string) => {
    registerForTournament(tournamentId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "registration": return "bg-success text-success-foreground";
      case "live": return "bg-warning text-warning-foreground";
      case "completed": return "bg-muted text-muted-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getPositionBadge = (position: number) => {
    if (position === 1) return { color: "bg-yellow-500 text-white", icon: Crown };
    if (position === 2) return { color: "bg-gray-400 text-white", icon: Award };
    if (position === 3) return { color: "bg-amber-600 text-white", icon: Star };
    return { color: "bg-muted text-muted-foreground", icon: Trophy };
  };

  // Mock stats - in real app, these would come from user stats
  const stats = {
    tournamentsPlayed: completedTournaments.length + myTournaments.length,
    tournamentsWon: completedTournaments.filter(t => t.winner_user_id === user?.id).length,
    topThreeFinishes: completedTournaments.filter(t => {
      // This would need to be calculated based on actual tournament results
      return Math.random() > 0.7; // Mock data
    }).length,
    totalWinnings: completedTournaments.reduce((sum, t) => {
      // Mock calculation - in real app, this would be from tournament_participants table
      return sum + (t.winner_user_id === user?.id ? t.prize_pool * 0.5 : 0);
    }, 0)
  };

  return (
    <DashboardLayout 
      title="Tournaments"
      description="Compete in tournaments for bigger prizes and recognition"
    >
      {/* Tournament Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="glass-card">
          <div className="p-6 text-center">
            <Trophy className="h-8 w-8 mx-auto text-primary mb-2" />
            <div className="text-2xl font-bold">{stats.tournamentsPlayed}</div>
            <div className="text-sm text-foreground/70">Tournaments Played</div>
          </div>
        </Card>
        
        <Card className="glass-card">
          <div className="p-6 text-center">
            <Crown className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
            <div className="text-2xl font-bold">{stats.tournamentsWon}</div>
            <div className="text-sm text-foreground/70">Tournaments Won</div>
          </div>
        </Card>
        
        <Card className="glass-card">
          <div className="p-6 text-center">
            <Star className="h-8 w-8 mx-auto text-accent mb-2" />
            <div className="text-2xl font-bold">{stats.topThreeFinishes}</div>
            <div className="text-sm text-foreground/70">Top 3 Finishes</div>
          </div>
        </Card>
        
        <Card className="glass-card">
          <div className="p-6 text-center">
            <Target className="h-8 w-8 mx-auto text-success mb-2" />
            <div className="text-2xl font-bold">₦{Math.round(stats.totalWinnings).toLocaleString()}</div>
            <div className="text-sm text-foreground/70">Tournament Winnings</div>
          </div>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 glass-card mb-8">
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="my-tournaments">My Tournaments</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        {/* Available Tournaments */}
        <TabsContent value="available">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tournamentsLoading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-foreground/70">Loading tournaments...</p>
              </div>
            ) : availableTournaments.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Trophy className="h-16 w-16 mx-auto text-foreground/30 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Available Tournaments</h3>
                <p className="text-foreground/70">Check back soon for new tournaments!</p>
              </div>
            ) : (
              availableTournaments.map((tournament) => (
                <Card key={tournament.id} className={`glass-card ${tournament.is_featured ? 'ring-2 ring-primary' : ''}`}>
                  <div className="p-6">
                    {tournament.is_featured && (
                      <Badge className="bg-primary text-primary-foreground mb-4">
                        <Star className="mr-1 h-3 w-3" />
                        Featured Tournament
                      </Badge>
                    )}
                    
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{tournament.name}</h3>
                        <Badge variant="secondary">{tournament.games?.short_name}</Badge>
                      </div>
                      <Badge className={getStatusColor(tournament.status)}>
                        {tournament.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Format:</span>
                        <span className="font-semibold">{tournament.format}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Entry Fee:</span>
                        <span className="font-semibold text-primary">₦{tournament.entry_fee?.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Prize Pool:</span>
                        <span className="font-semibold text-success">₦{tournament.prize_pool?.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Participants:</span>
                        <span className="font-semibold">{tournament.current_participants}/{tournament.max_participants}</span>
                      </div>
                      
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${((tournament.current_participants || 0) / (tournament.max_participants || 1)) * 100}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-foreground/70">
                        <Calendar className="h-4 w-4" />
                        <span>Starts: {new Date(tournament.start_date).toLocaleDateString()} at {new Date(tournament.start_date).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-gradient-to-r from-primary to-accent"
                      onClick={() => handleRegister(tournament.id)}
                      disabled={tournament.current_participants >= tournament.max_participants || tournament.is_registered}
                    >
                      {tournament.is_registered ? "Already Registered" :
                       tournament.current_participants >= tournament.max_participants ? "Tournament Full" : 
                       "Register Now"}
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* My Tournaments */}
        <TabsContent value="my-tournaments">
          <div className="space-y-6">
            {userTournamentsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-foreground/70">Loading your tournaments...</p>
              </div>
            ) : myTournaments.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 mx-auto text-foreground/30 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Active Tournaments</h3>
                <p className="text-foreground/70">Register for a tournament to get started!</p>
              </div>
            ) : (
              myTournaments.map((tournament) => (
                <Card key={tournament.id} className="glass-card">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{tournament.name}</h3>
                        <Badge variant="secondary">{tournament.games?.short_name}</Badge>
                      </div>
                      <Badge className={getStatusColor(tournament.status)}>
                        {tournament.status === "live" ? "LIVE" : tournament.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">₦{tournament.entry_fee?.toLocaleString()}</div>
                        <div className="text-sm text-foreground/70">Entry Fee</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-success">₦{tournament.prize_pool?.toLocaleString()}</div>
                        <div className="text-sm text-foreground/70">Prize Pool</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">Registered</div>
                        <div className="text-sm text-foreground/70">Status</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{new Date(tournament.start_date).toLocaleDateString()}</div>
                        <div className="text-sm text-foreground/70">Start Date</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline">View Bracket</Button>
                      {tournament.status === "live" && (
                        <Button className="bg-gradient-to-r from-primary to-accent">
                          View Next Match
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Completed Tournaments */}
        <TabsContent value="completed">
          <div className="space-y-6">
            {completedTournaments.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 mx-auto text-foreground/30 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Completed Tournaments</h3>
                <p className="text-foreground/70">Complete some tournaments to see your results here!</p>
              </div>
            ) : (
              completedTournaments.map((tournament) => {
                // Mock position data - in real app, this would come from tournament results
                const finalPosition = Math.floor(Math.random() * 10) + 1;
                const winnings = tournament.winner_user_id === user?.id ? tournament.prize_pool * 0.5 : 0;
                const badge = getPositionBadge(finalPosition);
                const BadgeIcon = badge.icon;
                
                return (
                  <Card key={tournament.id} className="glass-card">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold">{tournament.name}</h3>
                          <Badge variant="secondary">{tournament.games?.short_name}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={badge.color}>
                            <BadgeIcon className="mr-1 h-3 w-3" />
                            {finalPosition === 1 ? "1st Place" : 
                             finalPosition === 2 ? "2nd Place" :
                             finalPosition === 3 ? "3rd Place" :
                             `${finalPosition}th Place`}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold">₦{tournament.entry_fee?.toLocaleString()}</div>
                          <div className="text-sm text-foreground/70">Entry Fee</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">₦{tournament.prize_pool?.toLocaleString()}</div>
                          <div className="text-sm text-foreground/70">Prize Pool</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">#{finalPosition}</div>
                          <div className="text-sm text-foreground/70">Final Position</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${winnings > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                            ₦{Math.round(winnings).toLocaleString()}
                          </div>
                          <div className="text-sm text-foreground/70">Winnings</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{new Date(tournament.end_date || tournament.start_date).toLocaleDateString()}</div>
                          <div className="text-sm text-foreground/70">Completed</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default DashboardTournaments;