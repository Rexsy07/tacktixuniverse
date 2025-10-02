import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Users, Crown, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useMatchParticipants } from "@/hooks/useMatchParticipants";
import { getFormatDisplayName, isTeamFormat } from "@/utils/gameFormats";

interface MatchCardProps {
  match: {
    id: string;
    game: string;
    mode: string;
    stake: string;
    format: string;
    player1: string;
    player2?: string;
    status: 'awaiting' | 'in-progress' | 'completed';
    timeLeft?: string;
    creator_id: string;
    opponent_id?: string;
    winner_id?: string;
  };
}

const MatchCard = ({ match }: MatchCardProps) => {
  const { teamStructure, loading } = useMatchParticipants(match.id);
  const isTeamMatch = isTeamFormat(match.format);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress': return 'bg-destructive';
      case 'awaiting': return 'bg-primary';
      case 'completed': return 'bg-success';
      default: return 'bg-muted';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in-progress': return 'Live';
      case 'awaiting': return 'Open';
      case 'completed': return 'Finished';
      default: return status;
    }
  };

  const renderParticipants = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span>Loading players...</span>
        </div>
      );
    }

    // For 1v1 matches or when no team data available
    if (!isTeamMatch || (teamStructure.teamA.length === 0 && teamStructure.teamB.length === 0)) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-gradient-to-r from-primary to-accent">
                  {match.player1.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{match.player1}</span>
              {match.status === 'in-progress' && (
                <span className="text-xs text-destructive animate-pulse">🔴 LIVE</span>
              )}
            </div>
          </div>
          {match.player2 ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-gradient-to-r from-accent to-primary">
                  {match.player2.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-accent">vs {match.player2}</span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Awaiting opponent...
            </div>
          )}
        </div>
      );
    }

    // Team-based match display
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <Shield className="h-3 w-3" />
          <span>Team Battle ({getFormatDisplayName(match.format)})</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Team A */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-blue-600">Team A</span>
              {match.winner_id && teamStructure.teamA.some(p => p.user_id === match.winner_id) && (
                <span className="text-yellow-500">👑</span>
              )}
            </div>
            <div className="space-y-1">
              {teamStructure.teamA.slice(0, 2).map((participant) => (
                <div key={participant.id} className="flex items-center gap-1 text-xs">
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-xs bg-blue-100">
                      {(participant.profile?.username || 'P').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">
                    {participant.profile?.username || `Player${participant.user_id.slice(0, 3)}`}
                  </span>
                  {participant.role === 'captain' && (
                    <Crown className="h-3 w-3 text-yellow-500" />
                  )}
                </div>
              ))}
              {teamStructure.teamA.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{teamStructure.teamA.length - 2} more
                </div>
              )}
            </div>
          </div>

          {/* Team B */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="font-medium text-red-600">Team B</span>
              {match.winner_id && teamStructure.teamB.some(p => p.user_id === match.winner_id) && (
                <span className="text-yellow-500">👑</span>
              )}
            </div>
            <div className="space-y-1">
              {teamStructure.teamB.length === 0 ? (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>Waiting...</span>
                </div>
              ) : (
                <>
                  {teamStructure.teamB.slice(0, 2).map((participant) => (
                    <div key={participant.id} className="flex items-center gap-1 text-xs">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="text-xs bg-red-100">
                          {(participant.profile?.username || 'P').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">
                        {participant.profile?.username || `Player${participant.user_id.slice(0, 3)}`}
                      </span>
                      {participant.role === 'captain' && (
                        <Crown className="h-3 w-3 text-yellow-500" />
                      )}
                    </div>
                  ))}
                  {teamStructure.teamB.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{teamStructure.teamB.length - 2} more
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="glass-card hover:glow-primary transition-all duration-300 game-card">
      <div className="p-6">
        {/* Match Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="font-semibold">
              {match.game}
            </Badge>
            <Badge className={`${getStatusColor(match.status)} text-white`}>
              {getStatusText(match.status)}
            </Badge>
          </div>
          <div className="text-lg font-bold text-primary">
            {match.stake}
          </div>
        </div>

        {/* Match Details */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-3">{match.mode}</p>
          {renderParticipants()}
        </div>

        {/* Match Status */}
        {match.timeLeft && (
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {match.status === 'in-progress' ? match.timeLeft : `Time remaining: ${match.timeLeft}`}
            </span>
          </div>
        )}

        {/* Action Button */}
        <Link to={`/matches/${match.id}`}>
          <Button 
            className="w-full"
            variant={match.status === 'awaiting' ? 'default' : 'outline'}
            disabled={match.status === 'completed'}
          >
            {match.status === 'awaiting' && 'Join Match'}
            {match.status === 'in-progress' && 'Watch Live'}
            {match.status === 'completed' && 'View Results'}
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default MatchCard;