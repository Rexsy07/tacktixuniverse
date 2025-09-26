import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, UserPlus2, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getTeamSizes } from "@/utils/gameFormats";

interface TeamMember {
  user_id: string;
  username: string;
}

interface TeamManagementProps {
  format: string;
  onTeamUpdate: (members: string[]) => void;
  side?: 'A' | 'B'; // Which team this management applies to
}

export function TeamManagement({ format, onTeamUpdate, side = 'A' }: TeamManagementProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<TeamMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<TeamMember[]>([]);

  const { a: teamASize, b: teamBSize } = getTeamSizes(format);
  const currentTeamSize = side === 'A' ? teamASize : teamBSize;
  const remainingSlots = currentTeamSize - selectedMembers.length - 1; // -1 for the captain

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
        .neq('user_id', user?.id) // Exclude current user
        .limit(5);

      if (error) throw error;

      // Filter out already selected members
      const filteredResults = data.filter(
        result => !selectedMembers.some(member => member.user_id === result.user_id)
      );

      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const addMember = (member: TeamMember) => {
    if (selectedMembers.length >= currentTeamSize - 1) {
      toast.error(`Team is already full (${currentTeamSize} players including you)`);
      return;
    }

    setSelectedMembers(prev => [...prev, member]);
    setSearchResults([]);
    setSearchTerm("");
    onTeamUpdate([...selectedMembers, member].map(m => m.user_id));
  };

  const removeMember = (memberId: string) => {
    setSelectedMembers(prev => prev.filter(m => m.user_id !== memberId));
    onTeamUpdate(selectedMembers.filter(m => m.user_id !== memberId).map(m => m.user_id));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-2">Optional Team Invitations</h3>
      
      {/* Team Size Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Optional: Invite {remainingSlots} teammate{remainingSlots !== 1 ? 's' : ''} now, or let players join the open slots after challenge creation.
        </AlertDescription>
      </Alert>

      {/* Current Team */}
      <div className="space-y-2">
        <Label>Current Team</Label>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-primary/10">
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
          <Label>Add Team Members</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Search by username..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                searchUsers(e.target.value);
              }}
            />
          </div>

          {/* Search Results */}
          {searching ? (
            <div className="text-sm text-muted-foreground">Searching...</div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map(user => (
                <Button
                  key={user.user_id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => addMember(user)}
                >
                  <UserPlus2 className="mr-2 h-4 w-4" />
                  {user.username}
                </Button>
              ))}
            </div>
          ) : searchTerm.length >= 3 && (
            <div className="text-sm text-muted-foreground">No users found</div>
          )}
        </div>
      )}
    </div>
  );
}