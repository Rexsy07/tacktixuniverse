import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Target, Trophy, 
  Eye, Upload 
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useMatches, useOpenChallenges } from "@/hooks/useMatches";
import { useAuth } from "@/hooks/useAuth";
import { TeamDisplay } from "@/components/TeamDisplay";

interface DashboardLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const DashboardMatches = () => {
  const [filter, setFilter] = useState("all");
  
  const { matches, loading: matchesLoading, refetch: refetchMatches } = useMatches();
  const { challenges, loading: challengesLoading, acceptChallenge } = useOpenChallenges();
  const { user } = useAuth();
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success";
      case "in_progress": return "bg-warning";
      case "cancelled": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Completed";
      case "in_progress": return "In Progress";
      case "cancelled": return "Cancelled";
      default: return "Pending";
    }
  };

  const handleAcceptChallenge = async (challengeId: string, format: string) => {
    if (!user) return;

    // For team-based matches, navigate to match details where they can join teams flexibly
    if (['2v2', '3v3', '5v5'].includes(format)) {
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
              <div>Loading matches...</div>
            ) : matches?.length === 0 ? (
              <div>No matches found</div>
            ) : (
              <div className="grid gap-4">
                {matches?.map((match) => (
                  <Card key={match.id} className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start">
                      <div>
                        <Badge className={getStatusColor(match.status)}>
                          {getStatusText(match.status)}
                        </Badge>
                        <div className="mt-4">
                          {['2v2', '3v3', '5v5'].includes(match.format) && (
                            <TeamDisplay matchId={match.id} format={match.format} />
                          )}
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 md:ml-6 flex gap-2">
                        {match.status !== "cancelled" && (
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/matches/${match.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </Button>
                        )}
                        {match.status === "completed" && (
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/matches/${match.id}/upload`)}
                          >
                            <Upload className="mr-2 h-4 w-4" /> Upload Result
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="challenges">
            {challengesLoading ? (
              <div>Loading challenges...</div>
            ) : challenges?.length === 0 ? (
              <div>No open challenges</div>
            ) : (
              <div className="grid gap-4">
                {challenges?.map((challenge) => (
                  <Card key={challenge.id} className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start">
                      <div>
                        <Badge>Open Challenge</Badge>
                        <div className="mt-4">
                          {['2v2', '3v3', '5v5'].includes(challenge.format) && (
                            <TeamDisplay matchId={challenge.id} format={challenge.format} />
                          )}
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 md:ml-6">
                        <Button 
                          onClick={() => handleAcceptChallenge(challenge.id, challenge.format)}
                          disabled={!user || challenge.creator_id === user?.id}
                        >
                          {['2v2', '3v3', '5v5'].includes(challenge.format) ? 'Join Match' : 'Accept Challenge'}
                        </Button>
                      </div>
                    </div>
                  </Card>
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
