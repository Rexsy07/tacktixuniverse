import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, UserPlus, X, Crown, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TeamTournamentRegistrationProps {
  tournamentId: string;
  tournamentName: string;
  format: string; // e.g., "2v2", "4v4"
  maxParticipants: number;
  currentParticipants: number;
  onRegistrationSuccess?: () => void;
}

interface TeamMember {
  user_id: string;
  username: string;
}

export function TeamTournamentRegistration({
  tournamentId,
  tournamentName,
  format,
  maxParticipants,
  currentParticipants,
  onRegistrationSuccess
}: TeamTournamentRegistrationProps) {
  const { user } = useAuth();
  const [teamName, setTeamName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<TeamMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<TeamMember[]>([]);
  const [searching, setSearching] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  // Extract team size from format (e.g., "2v2" -> 2, "4v4" -> 4)
  const teamSize = parseInt(format.split('v')[0]) || 1;
  const remainingSlots = teamSize - selectedMembers.length - 1; // -1 for captain

  useEffect(() => {
    checkRegistrationStatus();
  }, [tournamentId, user?.id]);

  const checkRegistrationStatus = async () => {
    if (!user?.id) return;
    
    try {
      // Check if user is already registered as a team captain
      const { data, error } = await supabase
        .from('tournament_team_participants')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('captain_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking registration status:', error);
        return;
      }

      if (data) {
        setIsRegistered(true);
        setTeamName(data.team_name);
        // Load team members
        if (data.members && data.members.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, username')
            .in('user_id', data.members);
          
          if (profilesData) {
            setSelectedMembers(profilesData.map(p => ({
              user_id: p.user_id,
              username: p.username || `Player_${p.user_id.slice(-4)}`
            })));
          }
        }
      }
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username')
        .ilike('username', `%${query}%`)
        .neq('user_id', user?.id) // Exclude current user (captain)
        .limit(5);

      if (error) throw error;

      // Filter out already selected members
      const filteredResults = (data || []).filter(
        result => !selectedMembers.some(member => member.user_id === result.user_id)
      );

      setSearchResults(filteredResults.map(p => ({
        user_id: p.user_id,
        username: p.username || `Player_${p.user_id.slice(-4)}`
      })));
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const addMember = (member: TeamMember) => {
    if (selectedMembers.length >= teamSize - 1) {
      toast.error(`Team is already full (${teamSize} players including you)`);
      return;
    }

    setSelectedMembers(prev => [...prev, member]);
    setSearchResults([]);
    setSearchTerm('');
  };

  const removeMember = (memberId: string) => {
    setSelectedMembers(prev => prev.filter(m => m.user_id !== memberId));
  };

  const registerTeam = async () => {
    if (!user?.id) {
      toast.error('Please log in to register');
      return;
    }

    if (!teamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }

    if (selectedMembers.length < teamSize - 1) {
      toast.error(`You need ${teamSize - 1} more team members to register`);
      return;
    }

    try {
      setRegistering(true);

      const { error } = await supabase
        .from('tournament_team_participants')
        .insert({
          tournament_id: tournamentId,
          team_name: teamName.trim(),
          captain_id: user.id,
          members: selectedMembers.map(m => m.user_id)
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          if (error.message.includes('team_name')) {
            toast.error('Team name already exists in this tournament');
          } else {
            toast.error('You are already registered for this tournament');
          }
        } else {
          throw error;
        }
        return;
      }

      // Update tournament participant count
      await supabase.rpc('increment_tournament_participants', {
        tournament_id_param: tournamentId
      });

      toast.success('Team registered successfully!');
      setIsRegistered(true);
      onRegistrationSuccess?.();
    } catch (error: any) {
      console.error('Error registering team:', error);
      toast.error(error.message || 'Failed to register team');
    } finally {
      setRegistering(false);
    }
  };

  if (teamSize === 1) {
    return null; // Not a team tournament
  }

  if (isRegistered) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Team Registered
          </CardTitle>
          <CardDescription>
            Your team "{teamName}" is registered for {tournamentName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-primary/10">
                {user?.email?.split('@')[0]} (Captain)
              </Badge>
              {selectedMembers.map(member => (
                <Badge key={member.user_id} variant="outline">
                  {member.username}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Register Team ({format})
        </CardTitle>
        <CardDescription>
          Create a team of {teamSize} players for {tournamentName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tournament Status */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {maxParticipants - currentParticipants} team slots remaining
          </AlertDescription>
        </Alert>

        {/* Team Name */}
        <div className="space-y-2">
          <Label htmlFor="teamName">Team Name</Label>
          <Input
            id="teamName"
            placeholder="Enter your team name..."
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
        </div>

        {/* Current Team */}
        <div className="space-y-2">
          <Label>Team Members ({selectedMembers.length + 1}/{teamSize})</Label>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-primary/10">
              <Crown className="h-3 w-3 mr-1" />
              {user?.email?.split('@')[0]} (Captain)
            </Badge>
            {selectedMembers.map(member => (
              <Badge 
                key={member.user_id} 
                variant="outline"
                className="flex items-center gap-2"
              >
                {member.username}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => removeMember(member.user_id)}
                />
              </Badge>
            ))}
          </div>
        </div>

        {/* Member Search */}
        {remainingSlots > 0 && (
          <div className="space-y-2">
            <Label>Add Team Members ({remainingSlots} remaining)</Label>
            <Input
              placeholder="Search by username..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                searchUsers(e.target.value);
              }}
            />

            {/* Search Results */}
            {searching ? (
              <div className="text-sm text-muted-foreground">Searching...</div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map(member => (
                  <Button
                    key={member.user_id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addMember(member)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    {member.username}
                  </Button>
                ))}
              </div>
            ) : searchTerm.length >= 3 && (
              <div className="text-sm text-muted-foreground">No users found</div>
            )}
          </div>
        )}

        {/* Register Button */}
        <Button
          onClick={registerTeam}
          disabled={registering || !teamName.trim() || selectedMembers.length < teamSize - 1}
          className="w-full bg-gradient-to-r from-primary to-accent"
        >
          {registering ? 'Registering...' : `Register Team (${teamSize}v${teamSize})`}
        </Button>
      </CardContent>
    </Card>
  );
}