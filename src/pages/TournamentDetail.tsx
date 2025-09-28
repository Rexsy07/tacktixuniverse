import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Calendar, Users, ArrowLeft, Trophy } from 'lucide-react';
import { TeamTournamentRegistration } from '@/components/TeamTournamentRegistration';

interface TournamentDetailData {
  id: string;
  name: string;
  description?: string;
  prize_pool?: number | string;
  entry_fee?: number | string;
  max_participants?: number;
  current_participants?: number;
  start_date?: string;
  status: string;
  format?: string;
  games?: {
    name?: string;
    short_name?: string;
  };
  game_modes?: {
    name?: string;
  };
}

const TournamentDetail = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<TournamentDetailData | null>(null);
  const [participants, setParticipants] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);

  useEffect(() => {
    if (import.meta.env.VITE_DISABLE_TOURNAMENTS === 'true') {
      setLoading(false);
      return;
    }
    if (tournamentId) {
      fetchTournament();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId, user?.id]);

  const fetchTournament = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('tournaments')
        .select('*, games(name, short_name), game_modes(name)')
        .eq('id', tournamentId)
        .single();

      if (error) throw error;

      setTournament(data as TournamentDetailData);

      // Participants count (fallback if current_participants is null)
      let count = Number((data as any).current_participants || 0);
      if (!count) {
        const { count: partCount } = await supabase
          .from('tournament_participants')
          .select('*', { count: 'exact', head: true })
          .eq('tournament_id', tournamentId);
        count = partCount || 0;
      }
      setParticipants(count);

      // Check if current user is registered
      if (user?.id) {
        try {
          const { count: myReg } = await supabase
            .from('tournament_participants')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', tournamentId)
            .eq('user_id', user.id);
          setIsRegistered((myReg || 0) > 0);
        } catch (e) {
          // Ignore if participants table not present
          setIsRegistered(false);
        }
      } else {
        setIsRegistered(false);
      }
    } catch (err: any) {
      console.error('Error fetching tournament:', err);
      setError(err.message || 'Failed to load tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      toast.error('Please log in to register for tournaments');
      navigate('/login');
      return;
    }
    if (!tournament) return;

    try {
      const { error } = await supabase
        .from('tournament_participants')
        .insert({ tournament_id: tournament.id, user_id: user.id });

      if (error) throw error;
      toast.success('Successfully registered!');
      setIsRegistered(true);
      fetchTournament();
    } catch (e: any) {
      toast.error(e.message || 'Registration failed');
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'live':
      case 'in_progress':
        return <Badge className="bg-destructive text-white">Live</Badge>;
      case 'registration':
        return <Badge className="bg-primary text-white">Open</Badge>;
      case 'completed':
        return <Badge className="bg-success text-white">Completed</Badge>;
      default:
        return <Badge variant="secondary" className="capitalize">{status || 'unknown'}</Badge>;
    }
  };

  if (import.meta.env.VITE_DISABLE_TOURNAMENTS === 'true') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <h1 className="text-2xl font-bold mb-2">Tournaments Disabled</h1>
            <p className="text-foreground/70">This feature is currently unavailable.</p>
            <div className="mt-6">
              <Link to="/tournaments">
                <Button variant="outline">Back to Tournaments</Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground/70">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Tournament Not Found</h1>
          <Link to="/tournaments">
            <Button>Back to Tournaments</Button>
          </Link>
        </div>
      </div>
    );
  }

  const canRegister = tournament.status === 'registration' && !isRegistered;

  const teamSize = useMemo(() => {
    const raw = String(tournament.format || '1v1');
    const n = parseInt(raw.split('v')[0]);
    return isNaN(n) ? 1 : n;
  }, [tournament.format]);

  const canJoinSoloQueue = tournament.status === 'registration' && !isRegistered && teamSize > 1;

  const handleJoinSoloQueue = async () => {
    if (!user) {
      toast.error('Please log in to join the solo queue');
      navigate('/login');
      return;
    }
    if (!tournament) return;

    try {
      const { error } = await supabase.rpc('register_tournament_solo_queue', {
        p_tournament_id: tournament.id,
        p_user_id: user.id,
      });
      if (error) throw error;

      toast.success('Joined solo queue! We will assign you to a team when enough players are available.');

      // Optionally try to form teams now (best-effort)
      await supabase.rpc('assign_solo_teams_if_possible', { p_tournament_id: tournament.id });

      // Refresh details
      fetchTournament();
    } catch (e: any) {
      toast.error(e.message || 'Failed to join solo queue');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <button onClick={() => navigate(-1)} className="inline-flex items-center text-primary hover:text-primary/80">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {tournament.name}
                </span>
              </h1>
              <div className="flex items-center gap-2 text-foreground/70">
                <span>{tournament.games?.name || 'Game'}</span>
                <span>•</span>
                <span>{tournament.game_modes?.name || tournament.format || 'Format'}</span>
                <span>•</span>
                {getStatusBadge(tournament.status)}
              </div>
            </div>

            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
              {canRegister && (
                <Button className="bg-gradient-to-r from-primary to-accent" onClick={handleRegister}>
                  <Trophy className="mr-2 h-4 w-4" />
                  Register Now
                </Button>
              )}
              {canJoinSoloQueue && (
                <Button variant="outline" onClick={handleJoinSoloQueue}>
                  Join Solo Queue ({teamSize}v{teamSize})
                </Button>
              )}
              {(!canRegister && isRegistered) && (
                <Badge variant="secondary">Registered</Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="p-6">
              <div className="text-sm text-foreground/60">Entry Fee</div>
              <div className="text-2xl font-bold text-accent">
                ₦{Number(tournament.entry_fee || 0).toLocaleString()}
              </div>
              {teamSize > 1 && (
                <div className="text-xs text-foreground/60 mt-1">Per player (solo queue will charge per player when a team is formed)</div>
              )}
            </Card>
            <Card className="p-6">
              <div className="text-sm text-foreground/60">Prize Pool</div>
              <div className="text-2xl font-bold text-primary">
                ₦{Number(tournament.prize_pool || 0).toLocaleString()}
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-foreground/60">Participants</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {participants}/{tournament.max_participants || 0}
              </div>
            </Card>
          </div>

          <Card className="p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-foreground/60">Start Date</div>
                <div className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-success" />
                  {tournament.start_date ? new Date(tournament.start_date).toLocaleString() : 'TBA'}
                </div>
              </div>
              <div>
                <div className="text-sm text-foreground/60">Format</div>
                <div className="font-semibold">{tournament.format || tournament.game_modes?.name || 'N/A'}</div>
              </div>
            </div>
          </Card>

          {/* Team Registration for team tournaments */}
          {tournament.format && tournament.format !== '1v1' && (
            <div className="mb-6">
              <TeamTournamentRegistration
                tournamentId={tournament.id}
                tournamentName={tournament.name}
                format={tournament.format}
                maxParticipants={tournament.max_participants || 0}
                currentParticipants={participants}
                onRegistrationSuccess={() => fetchTournament()}
              />
            </div>
          )}

          {tournament.description && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-2">About this tournament</h2>
              <p className="text-foreground/80 leading-relaxed">{tournament.description}</p>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TournamentDetail;