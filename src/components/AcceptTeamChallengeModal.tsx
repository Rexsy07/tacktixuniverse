import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TeamManagement } from "@/components/TeamManagement";
import { Button } from "@/components/ui/button";
import { useTeamParticipation } from "@/hooks/useTeamParticipation";

interface AcceptTeamChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  format: string;
  onAccepted: () => void;
}

export function AcceptTeamChallengeModal({
  isOpen,
  onClose,
  matchId,
  format,
  onAccepted
}: AcceptTeamChallengeModalProps) {
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const { acceptTeamChallenge, loading } = useTeamParticipation();

  const handleAccept = async () => {
    const success = await acceptTeamChallenge(matchId, teamMembers);
    if (success) {
      onAccepted();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Accept Team Challenge</DialogTitle>
          <DialogDescription>
            Select your team members to join this {format} match
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <TeamManagement
            format={format}
            onTeamUpdate={setTeamMembers}
          />
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAccept} disabled={loading}>
            {loading ? 'Accepting...' : 'Accept Challenge'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}