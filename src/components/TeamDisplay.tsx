import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useTeamParticipation } from "@/hooks/useTeamParticipation";
import { getTeamSizes, isTeamFormat } from "@/utils/gameFormats";

interface TeamDisplayProps {
  matchId: string;
  format: string;
}

interface Participant {
  id: string;
  user_id: string;
  team: 'A' | 'B';
  role: 'captain' | 'member';
  profiles: {
    username: string | null;
  } | null;
}

export function TeamDisplay({ matchId, format }: TeamDisplayProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const { getMatchParticipants } = useTeamParticipation();

  useEffect(() => {
    loadParticipants();
  }, [matchId]);

  const loadParticipants = async () => {
    setLoading(true);
    const data = await getMatchParticipants(matchId);
    if (data) {
      setParticipants(data as unknown as Participant[]);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading teams...</div>;
  }

  if (!isTeamFormat(format)) {
    return null;
  }

  const teamA = participants.filter(p => p.team === 'A');
  const teamB = participants.filter(p => p.team === 'B');

  const { a: teamASize, b: teamBSize } = getTeamSizes(format);
  const teamARemaining = Math.max(teamASize - teamA.length, 0);
  const teamBRemaining = Math.max(teamBSize - teamB.length, 0);

  return (
    <div className="mt-2 space-y-2">
      <div className="text-sm text-muted-foreground">Teams ({format}):</div>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Team A */}
        <div>
          <div className="text-sm font-medium mb-1">Team A ({teamA.length}/{teamASize})</div>
          <div className="flex flex-wrap gap-2 min-h-[28px]">
            {teamA.map(member => (
              <Badge 
                key={member.id}
                variant={member.role === 'captain' ? 'default' : 'outline'}
                className={member.role === 'captain' ? 'bg-primary' : ''}
              >
                {member.profiles?.username || 'Unknown'} {member.role === 'captain' ? '(C)' : ''}
              </Badge>
            ))}
            {Array.from({ length: teamARemaining }).map((_, idx) => (
              <Badge key={`a-slot-${idx}`} variant="outline" className="opacity-60">Open</Badge>
            ))}
          </div>
        </div>

        {/* Team B */}
        <div>
          <div className="text-sm font-medium mb-1">Team B ({teamB.length}/{teamBSize})</div>
          <div className="flex flex-wrap gap-2 min-h-[28px]">
            {teamB.map(member => (
              <Badge 
                key={member.id}
                variant={member.role === 'captain' ? 'default' : 'outline'}
                className={member.role === 'captain' ? 'bg-primary' : ''}
              >
                {member.profiles?.username || 'Unknown'} {member.role === 'captain' ? '(C)' : ''}
              </Badge>
            ))}
            {Array.from({ length: teamBRemaining }).map((_, idx) => (
              <Badge key={`b-slot-${idx}`} variant="outline" className="opacity-60">Open</Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}