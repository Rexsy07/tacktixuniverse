import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useTeamParticipation } from "@/hooks/useTeamParticipation";

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

  if (!['2v2', '3v3', '5v5'].includes(format)) {
    return null;
  }

  const teamA = participants.filter(p => p.team === 'A');
  const teamB = participants.filter(p => p.team === 'B');

  return (
    <div className="mt-2 space-y-2">
      <div className="text-sm text-muted-foreground">Teams:</div>
      <div className="flex gap-4">
        {/* Team A */}
        <div>
          <div className="text-sm font-medium mb-1">Team A</div>
          <div className="flex flex-wrap gap-2">
            {teamA.map(member => (
              <Badge 
                key={member.id}
                variant={member.role === 'captain' ? 'default' : 'outline'}
                className={member.role === 'captain' ? 'bg-primary' : ''}
              >
                {member.profiles?.username || 'Unknown'} {member.role === 'captain' ? '(C)' : ''}
              </Badge>
            ))}
          </div>
        </div>

        {/* Team B */}
        <div>
          <div className="text-sm font-medium mb-1">Team B</div>
          <div className="flex flex-wrap gap-2">
            {teamB.map(member => (
              <Badge 
                key={member.id}
                variant={member.role === 'captain' ? 'default' : 'outline'}
                className={member.role === 'captain' ? 'bg-primary' : ''}
              >
                {member.profiles?.username || 'Unknown'} {member.role === 'captain' ? '(C)' : ''}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}