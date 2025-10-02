import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Users, Trophy, Shield } from "lucide-react";
import { useMatchParticipants } from "@/hooks/useMatchParticipants";

interface TeamParticipantsProps {
  matchId: string;
  format: string;
  winnerId?: string;
  creatorId: string;
  opponentId?: string;
}

interface ParticipantCardProps {
  participant: {
    id: string;
    user_id: string;
    team: 'A' | 'B';
    role: 'captain' | 'member';
    profile?: {
      username: string;
      full_name: string;
      avatar_url?: string;
    };
  };
  isWinner?: boolean;
  teamColor: string;
}

const ParticipantCard = ({ participant, isWinner, teamColor }: ParticipantCardProps) => {
  const displayName = participant.profile?.username || 
                     participant.profile?.full_name || 
                     `Player ${participant.user_id.substring(0, 6)}`;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border-l-4 ${teamColor} bg-card/50`}>
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
          {displayName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{displayName}</span>
          {participant.role === 'captain' && (
            <Crown className="h-4 w-4 text-yellow-500" title="Captain" />
          )}
          {isWinner && (
            <Trophy className="h-4 w-4 text-yellow-500" title="Winner" />
          )}
        </div>
        <div className="text-sm text-muted-foreground capitalize">
          {participant.role}
        </div>
      </div>
      
      <Badge variant={participant.role === 'captain' ? 'default' : 'secondary'} className="text-xs">
        Team {participant.team}
      </Badge>
    </div>
  );
};

const TeamParticipants = ({ matchId, format, winnerId, creatorId, opponentId }: TeamParticipantsProps) => {
  const { teamStructure, loading, error } = useMatchParticipants(matchId);
  
  // For 1v1 matches, show traditional creator vs opponent view
  const is1v1 = format === '1v1';
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading participants...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <Users className="h-8 w-8 mx-auto mb-2" />
        <p>Error loading participants: {error}</p>
      </div>
    );
  }

  // If no participants found or 1v1 match, show traditional view
  if (is1v1 || (teamStructure.teamA.length === 0 && teamStructure.teamB.length === 0)) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Players
        </h3>
        
        <div className="space-y-4">
          {/* Creator */}
          <div className="flex items-center gap-3 p-4 rounded-lg border-l-4 border-l-blue-500 bg-card/50">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
                C
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Creator</span>
                {winnerId === creatorId && (
                  <Trophy className="h-4 w-4 text-yellow-500" title="Winner" />
                )}
              </div>
              <div className="text-sm text-muted-foreground">Challenge Creator</div>
            </div>
            <Badge variant="default">Team A</Badge>
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center py-2">
            <div className="text-2xl font-bold text-muted-foreground">VS</div>
          </div>

          {/* Opponent */}
          {opponentId ? (
            <div className="flex items-center gap-3 p-4 rounded-lg border-l-4 border-l-red-500 bg-card/50">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-to-r from-accent to-primary text-primary-foreground">
                  O
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Opponent</span>
                  {winnerId === opponentId && (
                    <Trophy className="h-4 w-4 text-yellow-500" title="Winner" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Challenger</div>
              </div>
              <Badge variant="destructive">Team B</Badge>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 border-2 border-dashed border-muted-foreground/20 rounded-lg">
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <div className="text-sm text-muted-foreground">Waiting for opponent...</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Team-based match view (2v2, 3v3, 5v5)
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5" />
        Team Rosters ({format})
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team A */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <h4 className="font-semibold text-blue-500">
              Team A ({teamStructure.teamA.length} players)
            </h4>
            {teamStructure.teamA.some(p => winnerId && teamStructure.teamA.some(member => member.user_id === winnerId)) && (
              <Trophy className="h-4 w-4 text-yellow-500" title="Winning Team" />
            )}
          </div>
          
          <div className="space-y-2">
            {teamStructure.teamA.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No team members yet
              </div>
            ) : (
              teamStructure.teamA.map((participant) => (
                <ParticipantCard
                  key={participant.id}
                  participant={participant}
                  isWinner={winnerId === participant.user_id}
                  teamColor="border-l-blue-500"
                />
              ))
            )}
          </div>
        </div>

        {/* Team B */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <h4 className="font-semibold text-red-500">
              Team B ({teamStructure.teamB.length} players)
            </h4>
            {teamStructure.teamB.some(p => winnerId && teamStructure.teamB.some(member => member.user_id === winnerId)) && (
              <Trophy className="h-4 w-4 text-yellow-500" title="Winning Team" />
            )}
          </div>
          
          <div className="space-y-2">
            {teamStructure.teamB.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground border-2 border-dashed border-muted-foreground/20 rounded-lg">
                <Users className="h-6 w-6 mx-auto mb-1" />
                <div className="text-sm">Waiting for opponents...</div>
              </div>
            ) : (
              teamStructure.teamB.map((participant) => (
                <ParticipantCard
                  key={participant.id}
                  participant={participant}
                  isWinner={winnerId === participant.user_id}
                  teamColor="border-l-red-500"
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Team Summary */}
      <div className="mt-6 p-4 bg-muted/20 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-500">{teamStructure.teamA.length}</div>
            <div className="text-sm text-muted-foreground">Team A Players</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-500">{teamStructure.teamB.length}</div>
            <div className="text-sm text-muted-foreground">Team B Players</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamParticipants;