import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Users, Crown, UserPlus, Loader } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMatchParticipants } from "@/hooks/useMatchParticipants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getTeamSizes } from "@/utils/gameFormats";

interface JoinTeamMatchProps {
  matchId: string;
  format: string;
  creatorId: string;
  onJoinSuccess?: () => void;
}

const JoinTeamMatch = ({ matchId, format, creatorId, onJoinSuccess }: JoinTeamMatchProps) => {
  const { user } = useAuth();
  const { teamStructure, loading, refetch } = useMatchParticipants(matchId);
  const [joining, setJoining] = useState(false);

  const { a: teamASize, b: teamBSize } = getTeamSizes(format);
  const teamASlots = Math.max(teamASize - teamStructure.teamA.length, 0);
  const teamBSlots = Math.max(teamBSize - teamStructure.teamB.length, 0);

  // Check if current user is already in the match
  const isUserInMatch = [...teamStructure.teamA, ...teamStructure.teamB].some(
    p => p.user_id === user?.id
  );

  const isCreator = user?.id === creatorId;

  const joinTeam = async (team: 'A' | 'B') => {
    if (!user) {
      toast.error('Please log in to join the match');
      return;
    }

    try {
      setJoining(true);

      // Preferred: atomic RPC that holds escrow from the joining user's wallet
      const { error: rpcErr } = await supabase.rpc('join_team_with_escrow', {
        p_match_id: matchId,
        p_user_id: user.id,
        p_team: team,
      });

      if (rpcErr) {
        // Fallback to legacy behavior if RPC not available
        const msg = rpcErr?.message || '';
        const fnMissing = msg.includes('function join_team_with_escrow') || msg.includes('does not exist');
        if (!fnMissing) throw rpcErr;

        const { error } = await supabase
          .from('match_participants')
          .insert({
            match_id: matchId,
            user_id: user.id,
            team: team,
            role: teamStructure[team === 'A' ? 'teamA' : 'teamB'].length === 0 ? 'captain' : 'member'
          });
        if (error) throw error;
        toast.warning('Joined team without escrow hold (RPC missing). Consider enabling join_team_with_escrow on backend.');
      } else {
        toast.success(`Joined Team ${team}! Your stake has been held in escrow.`);
      }

      refetch();
      onJoinSuccess?.();
    } catch (error: any) {
      console.error('Error joining team:', error);
      toast.error(error.message || 'Failed to join team');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading team information...</span>
        </div>
      </Card>
    );
  }

  if (isUserInMatch) {
    return (
      <Card className="p-6">
        <div className="text-center py-4">
          <Badge variant="secondary" className="mb-2">
            You're already in this match
          </Badge>
          <p className="text-sm text-muted-foreground">
            You can view the full team roster in the match details.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Users className="h-5 w-5" />
        Join Team - {format} Match
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Team A */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <h4 className="font-semibold text-blue-600">
                Team A ({teamStructure.teamA.length}/{teamASize})
              </h4>
            </div>
            {teamASlots > 0 && !isCreator && (
              <Button
                size="sm"
                onClick={() => joinTeam('A')}
                disabled={joining}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <UserPlus className="h-3 w-3 mr-1" />
                Join
              </Button>
            )}
          </div>

          <div className="space-y-2 min-h-[120px]">
            {teamStructure.teamA.map((participant) => (
              <div key={participant.id} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs bg-blue-500 text-white">
                    {(participant.profile?.username || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {participant.profile?.username || `User${participant.user_id.slice(0, 4)}`}
                </span>
                {participant.role === 'captain' && (
                  <Crown className="h-3 w-3 text-yellow-500" />
                )}
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: teamASlots }, (_, i) => (
              <div key={i} className="flex items-center gap-2 p-2 border-2 border-dashed border-blue-300 rounded">
                <div className="h-6 w-6 border border-blue-300 rounded-full flex items-center justify-center">
                  <Users className="h-3 w-3 text-blue-400" />
                </div>
                <span className="text-sm text-blue-400">Open slot</span>
              </div>
            ))}
          </div>
        </div>

        {/* Team B */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <h4 className="font-semibold text-red-600">
                Team B ({teamStructure.teamB.length}/{teamBSize})
              </h4>
            </div>
            {teamBSlots > 0 && !isCreator && (
              <Button
                size="sm"
                onClick={() => joinTeam('B')}
                disabled={joining}
                className="bg-red-500 hover:bg-red-600"
              >
                <UserPlus className="h-3 w-3 mr-1" />
                Join
              </Button>
            )}
          </div>

          <div className="space-y-2 min-h-[120px]">
            {teamStructure.teamB.map((participant) => (
              <div key={participant.id} className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs bg-red-500 text-white">
                    {(participant.profile?.username || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {participant.profile?.username || `User${participant.user_id.slice(0, 4)}`}
                </span>
                {participant.role === 'captain' && (
                  <Crown className="h-3 w-3 text-yellow-500" />
                )}
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: teamBSlots }, (_, i) => (
              <div key={i} className="flex items-center gap-2 p-2 border-2 border-dashed border-red-300 rounded">
                <div className="h-6 w-6 border border-red-300 rounded-full flex items-center justify-center">
                  <Users className="h-3 w-3 text-red-400" />
                </div>
                <span className="text-sm text-red-400">Open slot</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isCreator && (
        <div className="mt-4 p-3 bg-primary/10 rounded-lg">
          <p className="text-sm text-primary font-medium">
            You created this match - you'll be automatically assigned to Team A when someone joins.
          </p>
        </div>
      )}

      {!isCreator && teamASlots === 0 && teamBSlots === 0 && (
        <div className="mt-4 text-center p-4 bg-muted/20 rounded-lg">
          <p className="text-sm text-muted-foreground">
            All team slots are filled. The match is ready to start!
          </p>
        </div>
      )}
    </Card>
  );
};

export default JoinTeamMatch;