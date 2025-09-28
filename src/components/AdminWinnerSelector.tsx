import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Participant {
  user_id: string;
  username: string;
  team: string;
  role: string;
}

interface AdminWinnerSelectorProps {
  matchId: string;
  format: string;
  onWinnerSet?: () => void;
}

const AdminWinnerSelector = ({ matchId, format, onWinnerSet }: AdminWinnerSelectorProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingWinner, setSettingWinner] = useState(false);

  useEffect(() => {
    fetchParticipants();
  }, [matchId]);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      
      // Use the new function to get all match participants
      const { data, error } = await supabase.rpc('get_match_participants_by_team', {
        p_match_id: matchId
      });
      
      if (error) throw error;
      setParticipants(data || []);
    } catch (error: any) {
      console.error('Error fetching participants:', error);
      toast.error('Failed to load match participants');
    } finally {
      setLoading(false);
    }
  };

  const setWinner = async (winnerId: string, winnerName: string) => {
    try {
      setSettingWinner(true);
      
      // Use the new admin function to set winner
      const { data, error } = await supabase.rpc('admin_set_match_winner', {
        p_match_id: matchId,
        p_winner_user_id: winnerId,
        p_admin_decision: `Admin selected winner: ${winnerName} for ${format} match`
      });
      
      if (error) throw error;
      
      toast.success(`Winner set: ${winnerName}`);
      onWinnerSet?.();
    } catch (error: any) {
      console.error('Error setting winner:', error);
      toast.error(error.message || 'Failed to set winner');
    } finally {
      setSettingWinner(false);
    }
  };

  if (loading) {
    return (
      <Button size="sm" disabled>
        <Users className="h-4 w-4 mr-1" />
        Loading...
      </Button>
    );
  }

  if (participants.length === 0) {
    return (
      <Button size="sm" disabled variant="outline">
        No participants found
      </Button>
    );
  }

  // Group participants by team for better display
  const teamA = participants.filter(p => p.team === 'A');
  const teamB = participants.filter(p => p.team === 'B');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          size="sm" 
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={settingWinner}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          {settingWinner ? 'Setting Winner...' : 'Set Winner'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Select Winner ({format})</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {teamA.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-blue-600 font-normal">
              Team A ({teamA.length} {teamA.length === 1 ? 'player' : 'players'})
            </DropdownMenuLabel>
            {teamA.map((participant) => (
              <DropdownMenuItem
                key={participant.user_id}
                onClick={() => setWinner(participant.user_id, participant.username)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>{participant.username}</span>
                  {participant.role === 'captain' && (
                    <Badge variant="outline" className="text-xs">Captain</Badge>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
        
        {teamB.length > 0 && teamA.length > 0 && <DropdownMenuSeparator />}
        
        {teamB.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-red-600 font-normal">
              Team B ({teamB.length} {teamB.length === 1 ? 'player' : 'players'})
            </DropdownMenuLabel>
            {teamB.map((participant) => (
              <DropdownMenuItem
                key={participant.user_id}
                onClick={() => setWinner(participant.user_id, participant.username)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>{participant.username}</span>
                  {participant.role === 'captain' && (
                    <Badge variant="outline" className="text-xs">Captain</Badge>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AdminWinnerSelector;