import { useMemo, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { useMatches } from "@/hooks/useMatches";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bell, Trophy, Clock, CheckCircle, AlertTriangle, Sword, Gamepad2
} from "lucide-react";

const statusMeta: Record<string, { label: string; color: string; Icon: any } > = {
  awaiting_opponent: { label: "Waiting for opponent", color: "bg-warning/15 text-warning", Icon: Clock },
  in_progress: { label: "Match in progress", color: "bg-info/15 text-info", Icon: Sword },
  pending_result: { label: "Result pending review", color: "bg-accent/15 text-accent", Icon: AlertTriangle },
  completed: { label: "Match completed", color: "bg-success/15 text-success", Icon: CheckCircle },
  cancelled: { label: "Match cancelled", color: "bg-destructive/15 text-destructive", Icon: AlertTriangle },
  disputed: { label: "Match disputed", color: "bg-destructive/15 text-destructive", Icon: AlertTriangle },
};

function formatAmount(amt?: number | null) {
  if (!amt) return "₦0";
  return `₦${amt.toLocaleString()}`;
}

const Notifications = () => {
  const { user } = useAuth();
  const { matches, loading } = useMatches();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!user) return;
      try {
        setLoadingAnnouncements(true);
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .or(`audience.eq.all,target_user_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        setAnnouncements(data || []);
      } catch (e) {
        console.warn('Failed to load announcements', e);
        setAnnouncements([]);
      } finally {
        setLoadingAnnouncements(false);
      }
    };
    fetchAnnouncements();
  }, [user?.id]);

  const items = useMemo(() => {
    const now = Date.now();
    const matchItems = (matches || []).map((m) => {
      const meta = statusMeta[m.status as keyof typeof statusMeta] || { label: m.status, color: "bg-muted", Icon: Bell };
      const youAreCreator = m.creator_id === user?.id;
      const youAreOpponent = m.opponent_id === user?.id;
      const opponentName = youAreCreator ? (m.opponent_profile?.display_name || m.opponent_profile?.username || "Opponent") : (m.creator_profile?.display_name || m.creator_profile?.username || "Opponent");
      const gameName = m.games?.name || "Game";
      const modeName = m.game_modes?.name || m.format || "Mode";
      const created = new Date(m.created_at);
      const recent = now - created.getTime() < 1000 * 60 * 60 * 24; // last 24h

      let title = `${gameName} • ${modeName}`;
      let message = "";

      switch (m.status) {
        case "awaiting_opponent":
          message = youAreCreator
            ? "Your challenge is live. Waiting for an opponent to join."
            : "A new challenge is available to join.";
          break;
        case "in_progress":
          message = youAreCreator || youAreOpponent
            ? `Match in progress with ${opponentName}.`
            : "Match in progress.";
          break;
        case "pending_result":
          message = `Please upload result evidence. Stake: ${formatAmount(m.stake_amount)}`;
          break;
        case "completed":
          if (m.winner_id) {
            const youWon = m.winner_id === user?.id;
            message = youWon
              ? `You won ${formatAmount(m.stake_amount)}!`
              : `You lost this match.`;
          } else {
            message = "Match completed.";
          }
          break;
        case "cancelled":
          message = "This match was cancelled.";
          break;
        case "disputed":
          message = "This match is under review (dispute).";
          break;
        default:
          message = meta.label;
      }

      return {
        id: m.id,
        created_at: m.created_at,
        title,
        message,
        meta,
        recent,
      };
    });

    const announcementItems = (announcements || []).map((n) => ({
      id: n.id,
      created_at: n.created_at,
      title: n.title,
      message: n.message,
      meta: { label: n.audience === 'all' ? 'Announcement' : 'Direct message', color: 'bg-accent/15 text-accent', Icon: Bell },
      recent: Date.now() - new Date(n.created_at).getTime() < 1000*60*60*24,
    }));

    return [...announcementItems, ...matchItems].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [matches, user?.id]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        <section className="py-8 bg-gradient-to-b from-background to-background/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <h1 className="text-2xl font-bold">Notifications</h1>
              </div>
              <Button variant="outline" onClick={() => window.location.reload()}>Refresh</Button>
            </div>

            <Card className="p-4">
              {loading || loadingAnnouncements ? (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : items.length === 0 ? (
                <div className="py-12 text-center">
                  <Gamepad2 className="h-10 w-10 mx-auto text-foreground/30 mb-2" />
                  <div className="text-foreground/70">No notifications yet</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.slice(0, 30).map((n) => (
                    <div key={n.id} className="flex items-start justify-between p-3 glass rounded-lg">
                      <div className="flex items-start gap-3">
                        <n.meta.Icon className="h-5 w-5 mt-0.5" />
                        <div>
                          <div className="font-semibold">{n.title}</div>
                          <div className="text-sm text-foreground/70">{n.message}</div>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge className={`${n.meta.color} capitalize`}>{n.meta.label}</Badge>
                            <span className="text-xs text-foreground/50">{new Date(n.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      {n.recent && <span className="text-[10px] uppercase tracking-wider text-primary">New</span>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Notifications;
