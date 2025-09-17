import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminSidebar from "@/components/AdminSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const AdminTournamentDetail = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tournaments')
          .select('*, games(name, short_name), game_modes(name)')
          .eq('id', tournamentId)
          .single();
        if (error) throw error;
        setTournament(data);

        const { data: regs, error: regsErr } = await supabase
          .from('tournament_participants')
          .select('user_id, created_at')
          .eq('tournament_id', `${tournamentId}`);
        if (regsErr) throw regsErr;

        const userIds = Array.from(new Set((regs || []).map((r: any) => r.user_id))).filter(Boolean);
        let profilesById = new Map<string, any>();
        if (userIds.length > 0) {
          const { data: profs, error: profErr } = await supabase
            .from('profiles')
            .select('user_id, username')
            .in('user_id', userIds);
          if (profErr) throw profErr;
          profilesById = new Map<string, any>((profs || []).map((p: any) => [p.user_id, p]));
        }

        const regsSorted = (regs || []).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const regsWithNames = regsSorted.map((r: any) => ({
          user_id: r.user_id,
          created_at: r.created_at,
          username: profilesById.get(r.user_id)?.username || r.user_id
        }));
        setParticipants(regsWithNames);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 ml-64 p-6">Loading...</main>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 ml-64 p-6">Tournament not found</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{tournament.name}</h1>
              <div className="text-muted-foreground flex items-center gap-2">
                <span>{tournament.games?.name}</span>
                <span>•</span>
                <span>{tournament.game_modes?.name}</span>
                <span>•</span>
                <span>Status:</span>
                <Badge variant="secondary" className="capitalize">{tournament.status}</Badge>
              </div>
            </div>
            <Button onClick={() => navigate(`/admin/tournaments/${tournament.id}/manage`)}>Manage</Button>
          </div>

          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-muted-foreground">Entry Fee</div>
                <div className="text-xl font-bold">₦{Number(tournament.entry_fee || 0).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Prize Pool</div>
                <div className="text-xl font-bold">₦{Number(tournament.prize_pool || 0).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Participants</div>
                <div className="text-xl font-bold">{Number(tournament.current_participants || participants.length)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Dates</div>
                <div className="text-xl font-bold">{tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : ''}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Participants</h2>
            <div className="space-y-2">
              {participants.length === 0 ? (
                <div className="text-muted-foreground">No participants yet</div>
              ) : (
                participants.map((p) => (
                  <div key={p.user_id} className="flex items-center justify-between p-2 border rounded">
                    <div className="font-medium">{p.username}</div>
                    <div className="text-sm text-muted-foreground">{new Date(p.created_at).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminTournamentDetail;


