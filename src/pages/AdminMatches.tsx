import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Search, Filter, Gamepad2, Users, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useAdminMatches } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AdminMatches = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { matches, loading, resolveDispute, refetch } = useAdminMatches();
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const cancelMatchAsAdmin = async (matchId: string) => {
    try {
      const { error } = await supabase.rpc('cancel_match_escrow', { p_match_id: matchId });
      if (error) throw error;
      toast.success('Match cancelled and funds refunded');
      await refetch();
    } catch (e: any) {
      toast.error(e.message || 'Failed to cancel match');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "active": return "bg-green-500";
      case "completed": return "bg-blue-500";
      case "disputed": return "bg-red-500";
      case "cancelled": return "bg-gray-500";
      default: return "bg-yellow-500";
    }
  };

  const handleResolveDispute = (matchId: string, winnerId: string) => {
    resolveDispute(matchId, winnerId);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 ml-64 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Match Management</h1>
              <p className="text-muted-foreground">Monitor and manage all platform matches</p>
            </div>
            <Button>
              <Filter className="h-4 w-4 mr-2" />
              Filter Matches
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Matches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{matches.filter(m => ['awaiting_opponent','in_progress','active'].includes(m.status)).length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{matches.filter(m => m.status === 'completed' && new Date(m.created_at).toDateString() === new Date().toDateString()).length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Disputed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{matches.filter(m => m.status === 'disputed').length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{matches.reduce((s, m) => s + (m.stake_amount || 0), 0).toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search matches..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Matches Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Matches</CardTitle>
              <CardDescription>Latest platform matches and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {matches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(match.status)}`}></div>
                      <div>
                        <div className="font-medium">{match.id} - {match.game}</div>
                        <div className="text-sm text-muted-foreground">{match.mode}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₦{match.stake_amount.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{match.players.join(" vs ")}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="capitalize">{match.status}</Badge>
                      <div className="text-sm text-muted-foreground mt-1">
                        {new Date(match.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/matches/${match.id}`)}
                      >
                        View
                      </Button>
                      {(['in_progress','pending_result','disputed'].includes(match.status)) && (
                        <div className="flex gap-2">
                          {match.creator_id && (
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleResolveDispute(match.id, match.creator_id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Set Winner: Creator
                            </Button>
                          )}
                          {match.opponent_id && (
                            <Button 
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => handleResolveDispute(match.id, match.opponent_id!)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Set Winner: Opponent
                            </Button>
                          )}
                        </div>
                      )}
                      {(match.status === 'awaiting_opponent' || match.status === 'in_progress') && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setConfirmCancelId(match.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel Match
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Confirm cancel dialog */}
      <AlertDialog open={!!confirmCancelId} onOpenChange={(open) => !open && setConfirmCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this match?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the match and refund any held funds. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (confirmCancelId) {
                await cancelMatchAsAdmin(confirmCancelId);
              }
              setConfirmCancelId(null);
            }}>
              Confirm Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminMatches;
