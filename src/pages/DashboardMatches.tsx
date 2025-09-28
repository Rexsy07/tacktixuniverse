import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Target, Trophy, 
  Eye, Upload, Bell, Clock, Gamepad2, MapPin, Timer, Coins
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useMatches, useOpenChallenges } from "@/hooks/useMatches";
import { MatchCardSkeleton } from "@/components/ui/loading-skeletons";
import { useAuth } from "@/hooks/useAuth";
import { TeamDisplay } from "@/components/TeamDisplay";
import { useMatchParticipants } from "@/hooks/useMatchParticipants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getFormatDisplayName, isTeamFormat } from "@/utils/gameFormats";
import { withBase } from "@/utils/url";

interface DashboardLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

// Inline button component to handle the "Mark as Done" action per match
const MarkDoneButton = ({
  matchId,
  status,
  creatorId,
  opponentId,
  userId,
  onDone,
}: {
  matchId: string;
  status: string;
  creatorId: string;
  opponentId?: string | null;
  userId?: string;
  onDone: () => void;
}) => {
  const { participants } = useMatchParticipants(matchId);
  const isDirect = !!userId && (creatorId === userId || opponentId === userId);
  const isTeamParticipant = !!userId && (participants?.some(p => p.user_id === userId) || false);
  const isParticipant = isDirect || isTeamParticipant;
  const canMarkDone = status === 'in_progress' && isParticipant;

  const handleMarkDone = async () => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('matches')
        .update({ status: 'pending_result', updated_at: new Date().toISOString() })
        .eq('id', matchId);
      if (error) throw error;
      toast.success("Notified admins. Awaiting winner selection.");
      onDone();
    } catch (e: any) {
      toast.error(e.message || 'Failed to notify admins');
    }
  };

  if (canMarkDone) {
    return (
      <Button onClick={handleMarkDone} className="bg-primary">
        <Bell className="mr-2 h-4 w-4" /> I'm Done — Notify Admin
      </Button>
    );
  }

  if (status === 'pending_result' && isParticipant) {
    return (
      <Button variant="secondary" disabled>
        <Clock className="mr-2 h-4 w-4" /> Awaiting Admin Decision
      </Button>
    );
  }

  return null;
};

const DashboardMatches = () => {
  const [filter, setFilter] = useState("all");
  
  const { matches, loading: matchesLoading, refetch: refetchMatches } = useMatches();
  const { challenges, loading: challengesLoading, acceptChallenge } = useOpenChallenges();
  const { user } = useAuth();
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success";
      case "in_progress": return "bg-orange-500";
      case "awaiting_opponent": return "bg-primary";
      case "pending_result": return "bg-amber-500";
      case "disputed": return "bg-red-600";
      case "cancelled": return "bg-muted";
      default: return "bg-muted";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Completed";
      case "in_progress": return "Live";
      case "awaiting_opponent": return "Open";
      case "pending_result": return "Pending Result";
      case "disputed": return "Disputed";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  };

  const handleAcceptChallenge = async (challengeId: string, format: string) => {
    if (!user) return;

    // For team-based matches (including asymmetric ones), navigate to match details where they can join teams flexibly
    if (['1v2', '1v3', '1v4', '2v2', '3v3', '5v5'].includes(format)) {
      navigate(`/matches/${challengeId}`);
      return;
    }

    // For 1v1 matches, accept directly
    await acceptChallenge(challengeId, user.id);
    refetchMatches();
  };

  return (
    <DashboardLayout
      title="Matches"
      description="View your match history and open challenges"
    >
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Matches</h2>
            <p className="text-muted-foreground">
              View your match history and open challenges
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/create-challenge">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create Challenge
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="matches" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="matches">Match History</TabsTrigger>
            <TabsTrigger value="challenges">Open Challenges</TabsTrigger>
          </TabsList>

          <TabsContent value="matches">
            {matchesLoading ? (
              <div className="app-grid">
                {[...Array(6)].map((_, i) => (
                  <div key={`match-skel-${i}`} className="card-slot card-slot--match">
                    <MatchCardSkeleton />
                  </div>
                ))}
              </div>
            ) : matches?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No matches found</div>
            ) : (
              <div className="app-grid">
                {matches?.map((match) => (
                  <div key={match.id} className="card-slot card-slot--match">
                    <Card className="p-0 overflow-hidden bg-gradient-to-br from-background to-muted/40 border border-border/60 hover:shadow-xl hover:-translate-y-0.5 transition-all group">
                    {/* Header image / status */}
                    <div className="relative">
                      <AspectRatio ratio={16/6}>
                        {match.games?.cover_image_url ? (
                          <img
                            src={withBase(match.games.cover_image_url)}
                            alt={match.games?.name || 'Game'}
                            className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-r from-muted to-muted/30 flex items-center justify-center">
                            <Gamepad2 className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </AspectRatio>
                      <div className="absolute top-3 right-3">
                        <Badge className={`${getStatusColor(match.status)} text-white`}>{getStatusText(match.status)}</Badge>
                      </div>
                      <div className="absolute bottom-3 left-3 flex items-center gap-2 text-xs">
                        <Badge variant="secondary">{match.games?.short_name || match.games?.name}</Badge>
                        <Badge variant="outline">{match.game_modes?.name}</Badge>
                        <Badge variant="outline">{getFormatDisplayName(match.format)}</Badge>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4 space-y-4">
                      {/* Participants or team display */}
                      <div className="flex items-center justify-between">
                        {isTeamFormat(match.format) ? (
                          <div className="flex-1">
                            <TeamDisplay matchId={match.id} format={match.format} />
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <img src={match.creator_profile?.avatar_url || ''} alt={match.creator_profile?.username || 'P1'} onError={(e:any)=>{e.currentTarget.style.display='none'}} />
                                <AvatarFallback>{(match.creator_profile?.username || 'P1').slice(0,2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{match.creator_profile?.username || 'Player 1'}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">vs</span>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <img src={match.opponent_profile?.avatar_url || ''} alt={match.opponent_profile?.username || 'P2'} onError={(e:any)=>{e.currentTarget.style.display='none'}} />
                                <AvatarFallback>{(match.opponent_profile?.username || 'P2').slice(0,2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{match.opponent_profile?.username || (match.status==='awaiting_opponent' ? '—' : 'Opponent')}</span>
                            </div>
                          </div>
                        )}

                        <div className="text-right hidden sm:block">
                          <div className="text-xs text-muted-foreground">Created</div>
                          <div className="text-sm font-medium">{new Date(match.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>

                      {/* Meta chips */}
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <Badge variant="outline" className="flex items-center gap-1"><Coins className="h-3 w-3"/> ₦{match.stake_amount.toLocaleString()}</Badge>
                        {match.duration_minutes && (
                          <Badge variant="outline" className="flex items-center gap-1"><Timer className="h-3 w-3"/> {match.duration_minutes}m</Badge>
                        )}
                        {match.map_name && (
                          <Badge variant="outline" className="flex items-center gap-1"><MapPin className="h-3 w-3"/> {match.map_name}</Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 justify-between items-center">
                        <div className="flex gap-2">
                          {match.status !== "cancelled" && (
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/matches/${match.id}`)}
                            >
                              <Eye className="mr-2 h-4 w-4" /> Details
                            </Button>
                          )}
                          {match.status === "completed" && (
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/matches/${match.id}/upload`)}
                            >
                              <Upload className="mr-2 h-4 w-4" /> Upload Proof
                            </Button>
                          )}
                        </div>
                        {/* Mark as Done action or pending indicator */}
                        <MarkDoneButton
                          matchId={match.id}
                          status={match.status}
                          creatorId={match.creator_id}
                          opponentId={match.opponent_id}
                          userId={user?.id}
                          onDone={refetchMatches}
                        />
                      </div>
                    </div>
                  </Card>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="challenges">
            {challengesLoading ? (
              <div className="app-grid">
                {[...Array(6)].map((_, i) => (
                  <div key={`challenge-skel-${i}`} className="card-slot card-slot--match">
                    <MatchCardSkeleton />
                  </div>
                ))}
              </div>
            ) : challenges?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No open challenges</div>
            ) : (
              <div className="app-grid">
                {challenges?.map((challenge) => (
                  <div key={challenge.id} className="card-slot card-slot--match">
                    <Card className="p-0 overflow-hidden bg-gradient-to-br from-background to-muted/40 border border-border/60 hover:shadow-xl hover:-translate-y-0.5 transition-all group">
                    {/* Header image / status */}
                    <div className="relative">
                      <AspectRatio ratio={16/6}>
                        {challenge.games?.cover_image_url ? (
                          <img
                            src={withBase(challenge.games.cover_image_url)}
                            alt={challenge.games?.name || 'Game'}
                            className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-r from-muted to-muted/30 flex items-center justify-center">
                            <Gamepad2 className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </AspectRatio>
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-primary text-white">{getStatusText('awaiting_opponent')}</Badge>
                      </div>
                      <div className="absolute bottom-3 left-3 flex items-center gap-2 text-xs">
                        <Badge variant="secondary">{challenge.games?.short_name || challenge.games?.name}</Badge>
                        <Badge variant="outline">{challenge.game_modes?.name}</Badge>
                        <Badge variant="outline">{getFormatDisplayName(challenge.format)}</Badge>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4 space-y-4">
                      {/* Creator and maybe team */}
                      <div className="flex items-center justify-between">
                        {isTeamFormat(challenge.format) ? (
                          <div className="flex-1">
                            <TeamDisplay matchId={challenge.id} format={challenge.format} />
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <img src={challenge.creator_profile?.avatar_url || ''} alt={challenge.creator_profile?.username || 'Creator'} onError={(e:any)=>{e.currentTarget.style.display='none'}} />
                              <AvatarFallback>{(challenge.creator_profile?.username || 'P1').slice(0,2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{challenge.creator_profile?.username || 'Player'}</span>
                            <span className="text-xs text-muted-foreground">awaiting opponent</span>
                          </div>
                        )}

                        <div className="text-right hidden sm:block">
                          <div className="text-xs text-muted-foreground">Stake</div>
                          <div className="text-sm font-medium">₦{challenge.stake_amount.toLocaleString()}</div>
                        </div>
                      </div>

                      {/* Meta chips */}
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <Badge variant="outline" className="flex items-center gap-1"><Coins className="h-3 w-3"/> ₦{challenge.stake_amount.toLocaleString()}</Badge>
                        {challenge.duration_minutes && (
                          <Badge variant="outline" className="flex items-center gap-1"><Timer className="h-3 w-3"/> {challenge.duration_minutes}m</Badge>
                        )}
                        {challenge.map_name && (
                          <Badge variant="outline" className="flex items-center gap-1"><MapPin className="h-3 w-3"/> {challenge.map_name}</Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end">
                        <Button 
                          onClick={() => handleAcceptChallenge(challenge.id, challenge.format)}
                          disabled={!user || challenge.creator_id === user?.id}
                        >
                          {isTeamFormat(challenge.format) ? 'Join Match' : 'Accept Challenge'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

      </div>
    </DashboardLayout>
  );
};

export default DashboardMatches;
