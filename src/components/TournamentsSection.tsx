import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Users, Calendar, Zap, Clock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Tournament {
  id: string;
  name: string;
  game: string;
  prizePool: string;
  entryFee: string;
  participants: number;
  maxParticipants: number;
  startDate: string;
  status: 'upcoming' | 'live' | 'completed';
  format: string;
}

const TournamentsSection = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('tournaments')
        .select('id, name, prize_pool, entry_fee, max_participants, current_participants, start_date, status, games(short_name), format')
        .order('start_date', { ascending: true })
        .limit(6);
      const mapped = (data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        game: t.games?.short_name || 'Game',
        prizePool: `₦${Number(t.prize_pool || 0).toLocaleString()}`,
        entryFee: `₦${Number(t.entry_fee || 0).toLocaleString()}`,
        participants: t.current_participants || 0,
        maxParticipants: t.max_participants || 0,
        startDate: t.start_date ? new Date(t.start_date).toLocaleDateString() : '',
        status: (t.status === 'in_progress' ? 'live' : (t.status as any)) || 'upcoming',
        format: t.format || 'Format'
      }));
      setTournaments(mapped as any);
    };
    load();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-destructive';
      case 'upcoming': return 'bg-primary';
      case 'completed': return 'bg-success';
      default: return 'bg-muted';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live': return 'LIVE';
      case 'upcoming': return 'Register';
      case 'completed': return 'Finished';
      default: return status;
    }
  };

  return (
    <section id="tournaments" className="py-16 bg-gradient-to-b from-background/50 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Tournaments
            </span>
          </h2>
          <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
            Compete in official tournaments with massive prize pools. Show Nigeria who's the ultimate gamer.
          </p>
        </div>

        {/* Featured Tournament */}
        <div className="mb-12">
          <Card className="glass-card overflow-hidden glow-primary">
            <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-8">
              <div className="flex flex-col lg:flex-row items-center justify-between">
                <div className="text-center lg:text-left mb-6 lg:mb-0">
                  <Badge className="bg-destructive text-destructive-foreground mb-4 animate-pulse">
                    🔴 LIVE TOURNAMENT
                  </Badge>
                  <h3 className="text-3xl font-bold mb-2">PUBG Squad Showdown</h3>
                  <p className="text-xl text-foreground/80 mb-4">
                    ₦100,000 Prize Pool • 4v4 Teams • Battle Royale
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-primary" />
                      16/20 Teams
                    </div>
                    <div className="flex items-center">
                      <Trophy className="h-4 w-4 mr-2 text-accent" />
                      Entry: ₦2,000
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-success" />
                      Semi-Finals
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <Button size="lg" className="bg-gradient-to-r from-destructive to-destructive/80 hover:opacity-90 glow-primary pulse-glow">
                    <Zap className="mr-2 h-5 w-5" />
                    Watch Live
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tournaments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {tournaments.filter(t => t.status !== 'live').map((tournament) => (
            <Card key={tournament.id} className="glass-card game-card overflow-hidden">
              <div className="p-6">
                {/* Tournament Header */}
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="secondary" className="font-semibold">
                    {tournament.game}
                  </Badge>
                  <Badge className={`${getStatusColor(tournament.status)} text-white`}>
                    {getStatusText(tournament.status)}
                  </Badge>
                </div>

                {/* Tournament Title */}
                <h3 className="text-lg font-bold mb-2">{tournament.name}</h3>

                {/* Prize Pool */}
                <div className="text-center mb-4 p-3 glass rounded-lg">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {tournament.prizePool}
                  </div>
                  <div className="text-sm text-foreground/70">Prize Pool</div>
                </div>

                {/* Tournament Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground/70">Entry Fee:</span>
                    <span className="font-semibold text-accent">{tournament.entryFee}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground/70">Format:</span>
                    <span className="font-semibold">{tournament.format}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground/70">Players:</span>
                    <span className="font-semibold">
                      {tournament.participants}/{tournament.maxParticipants}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground/70">Start Date:</span>
                    <span className="font-semibold text-primary">{tournament.startDate}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-foreground/50 mb-1">
                    <span>Registration</span>
                    <span>{Math.round((tournament.participants / tournament.maxParticipants) * 100)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-primary to-accent h-2 rounded-full"
                      style={{ width: `${(tournament.participants / tournament.maxParticipants) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Action Button */}
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  disabled={tournament.participants >= tournament.maxParticipants}
                >
                  {tournament.participants >= tournament.maxParticipants ? 'Full' : 'Register Now'}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Tournament Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="glass-card text-center">
            <div className="p-6">
              <Trophy className="h-12 w-12 mx-auto text-primary mb-4" />
              <h4 className="font-semibold mb-2">Massive Prize Pools</h4>
              <p className="text-sm text-foreground/70">
                Weekly tournaments with prizes ranging from ₦10K to ₦500K. The bigger the tournament, the bigger the rewards.
              </p>
            </div>
          </Card>

          <Card className="glass-card text-center">
            <div className="p-6">
              <Users className="h-12 w-12 mx-auto text-accent mb-4" />
              <h4 className="font-semibold mb-2">Professional Format</h4>
              <p className="text-sm text-foreground/70">
                Official tournament brackets, live streaming, and professional oversight for the ultimate esports experience.
              </p>
            </div>
          </Card>

          <Card className="glass-card text-center">
            <div className="p-6">
              <Calendar className="h-12 w-12 mx-auto text-success mb-4" />
              <h4 className="font-semibold mb-2">Regular Schedule</h4>
              <p className="text-sm text-foreground/70">
                New tournaments every week across all supported games. Never miss a chance to compete and win big.
              </p>
            </div>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="glass-card max-w-2xl mx-auto p-8">
            <h3 className="text-2xl font-bold mb-4">
              Think You Have What It Takes?
            </h3>
            <p className="text-foreground/70 mb-6">
              Join Nigeria's most competitive gaming tournaments. Rise through the ranks and claim your share of massive prize pools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary">
                <Trophy className="mr-2 h-5 w-5" />
                View All Tournaments
              </Button>
              <Button size="lg" variant="outline" className="glass-button border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <Calendar className="mr-2 h-5 w-5" />
                Tournament Schedule
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TournamentsSection;