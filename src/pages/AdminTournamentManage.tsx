import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminSidebar from "@/components/AdminSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminTournamentManage = () => {
  const { tournamentId } = useParams();
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [winnerId, setWinnerId] = useState<string>("");
  const [status, setStatus] = useState<string>("registration");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tournaments')
          .select('id, name, status, winner_user_id')
          .eq('id', tournamentId)
          .single();
        if (error) throw error;
        setTournament(data);
        setWinnerId(data.winner_user_id || "");
        setStatus(data.status);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tournamentId]);

  const updateStatus = async () => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ status })
        .eq('id', tournamentId);
      if (error) throw error;
      toast.success('Status updated');
    } catch (e: any) {
      toast.error(e.message || 'Failed to update');
    }
  };

  const setWinner = async () => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ winner_user_id: winnerId, status: 'completed' })
        .eq('id', tournamentId);
      if (error) throw error;
      toast.success('Winner set');
    } catch (e: any) {
      toast.error(e.message || 'Failed to set winner');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 ml-64 p-6">Loading...</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">Manage Tournament</h1>
          <Card className="p-6 space-y-4">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="registration">Registration</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={updateStatus}>Update Status</Button>
          </Card>
          <Card className="p-6 space-y-4">
            <div>
              <Label>Winner User ID</Label>
              <Input value={winnerId} onChange={(e) => setWinnerId(e.target.value)} placeholder="user_id" />
            </div>
            <Button onClick={setWinner}>Set Winner</Button>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminTournamentManage;




