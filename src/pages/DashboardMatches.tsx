import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Target, Clock, Trophy, Users, 
  Filter, Search, Eye, Upload 
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useMatches, useOpenChallenges } from "@/hooks/useMatches";
import { useAuth } from "@/hooks/useAuth";

const DashboardMatches = () => {
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { matches, loading: matchesLoading, refetch: refetchMatches } = useMatches();
  const { challenges, loading: challengesLoading, acceptChallenge } = useOpenChallenges();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success";
      case "in_progress": return "bg-destructive";
      case "awaiting_opponent": return "bg-primary";
      case "pending": return "bg-warning";
      default: return "bg-muted";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Completed";
      case "in_progress": return "Live";
      case "awaiting_opponent": return "Waiting";
      case "pending": return "Upload Result";
      default: return status;
    }
  };

  const handleAcceptChallenge = async (challengeId: string) => {
    if (!user) return;
    await acceptChallenge(challengeId, user.id);
    // Immediately refresh both lists for the host side UX
    refetchMatches();
  };

  return (
    <DashboardLayout 
      title="Matches"
      description="Create challenges, find opponents, and track your matches"
    >
      <div className="mb-8 flex justify-end">
        <Link to="/create-challenge">
          <Button className="bg-gradient-to-r from-primary to-accent glow-primary">
            <Plus className="mr-2 h-4 w-4" />
            Create Challenge
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="my-matches" className="w-full">
        <TabsList className="grid w-full grid-cols-2 glass-card mb-8">
          <TabsTrigger value="my-matches">My Matches</TabsTrigger>
          <TabsTrigger value="open-challenges">Open Challenges</TabsTrigger>
        </TabsList>

        {/* My Matches */}
        <TabsContent value="my-matches">
          <div className="space-y-6">
            {matchesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-foreground/70">Loading your matches...</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 mx-auto text-foreground/30 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Matches Yet</h3>
                <p className="text-foreground/70 mb-6">Start your gaming journey by creating a challenge!</p>
                <Link to="/create-challenge">
                  <Button>Create Your First Challenge</Button>
                </Link>
              </div>
            ) : (
              matches.map((match) => {
                const isCreator = match.creator_id === user?.id;
                const opponent = isCreator ? match.opponent_profile : match.creator_profile;
                const canUploadResult = match.status === "in_progress" || 
                  (match.status === "completed" && !match.winner_id);

                return (
                  <Card key={match.id} className="glass-card">
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <Badge variant="secondary">{match.games?.short_name}</Badge>
                            <Badge className={`${getStatusColor(match.status)} text-white`}>
                              {getStatusText(match.status)}
                            </Badge>
                            {match.winner_id && (
                              <Badge className={match.winner_id === user?.id ? "bg-success" : "bg-destructive"}>
                                {match.winner_id === user?.id ? "WON" : "LOST"}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-foreground/50">Opponent:</span>
                              <div className="font-semibold">
                                {opponent?.username || (match.status === 'awaiting_opponent' ? 'Waiting...' : 'Unknown')}
                              </div>
                            </div>
                            <div>
                              <span className="text-foreground/50">Mode:</span>
                              <div className="font-semibold">{match.game_modes?.name} ({match.format})</div>
                            </div>
                            <div>
                              <span className="text-foreground/50">Stake:</span>
                              <div className="font-semibold text-primary">₦{match.stake_amount?.toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-foreground/50">Created:</span>
                              <div className="font-semibold">{new Date(match.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>

                          {match.custom_rules && (
                            <div className="mt-3">
                              <span className="text-foreground/50 text-sm">Rules: </span>
                              <span className="text-sm">{match.custom_rules}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 md:mt-0 md:ml-6 flex gap-2">
                          {canUploadResult && (
                            <Button size="sm" className="bg-gradient-to-r from-primary to-accent">
                              <Upload className="mr-2 h-3 w-3" />
                              Upload Result
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/matches/${match.id}`)}
                          >
                            <Eye className="mr-2 h-3 w-3" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Open Challenges */}
        <TabsContent value="open-challenges">
          <div className="space-y-6">
            {/* Filter Bar */}
            <Card className="glass-card">
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {['all', 'CODM', 'PUBG', 'Free Fire', 'EA FC', 'PES'].map((gameFilter) => (
                    <Button
                      key={gameFilter}
                      variant={filter === gameFilter ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter(gameFilter)}
                      className="glass-button"
                    >
                      {gameFilter === 'all' ? 'All Games' : gameFilter}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
            
            {/* Challenges List */}
            <div className="space-y-6">
              {challengesLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-foreground/70">Loading open challenges...</p>
                </div>
              ) : challenges.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="h-16 w-16 mx-auto text-foreground/30 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Open Challenges</h3>
                  <p className="text-foreground/70 mb-6">Be the first to create a challenge!</p>
                  <Link to="/create-challenge">
                    <Button>Create Challenge</Button>
                  </Link>
                </div>
              ) : (
                challenges.map((challenge) => (
                  <Card key={challenge.id} className="glass-card hover:glow-primary transition-all duration-300">
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <h3 className="text-lg font-bold">
                              {challenge.creator_profile?.username || "Anonymous"}
                            </h3>
                            <Badge variant="secondary">{challenge.games?.short_name}</Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-foreground/50">Mode:</span>
                              <div className="font-semibold">{challenge.game_modes?.name} ({challenge.format})</div>
                            </div>
                            <div>
                              <span className="text-foreground/50">Stake:</span>
                              <div className="font-semibold text-primary">₦{challenge.stake_amount?.toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-foreground/50">Map:</span>
                              <div className="font-semibold">{challenge.map_name || "Any"}</div>
                            </div>
                            <div>
                              <span className="text-foreground/50">Posted:</span>
                              <div className="font-semibold">{new Date(challenge.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>

                          {challenge.custom_rules && (
                            <div className="mt-3">
                              <span className="text-foreground/50 text-sm">Rules: </span>
                              <span className="text-sm">{challenge.custom_rules}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 md:mt-0 md:ml-6">
                          <Button 
                            className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                            onClick={() => handleAcceptChallenge(challenge.id)}
                            disabled={!user || challenge.creator_id === user?.id}
                          >
                            <Target className="mr-2 h-4 w-4" />
                            {!user ? 'Login to Accept' : 
                             challenge.creator_id === user?.id ? 'Your Challenge' : 
                             'Accept Challenge'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default DashboardMatches;