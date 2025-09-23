import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, Users, Calendar, Clock, Zap, Crown, 
  ArrowRight, Filter, Coins, Target 
} from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const Tournaments = () => {
  const [gameFilter, setGameFilter] = useState("all");
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tournaments')
          .select('*, games(name, short_name)')
          .order('start_date', { ascending: true });
        if (error) throw error;

        const withCounts = await Promise.all((data || []).map(async (t: any) => {
          let participants = t.current_participants;
          if (participants == null) {
            const { count } = await supabase
              .from('tournament_participants')
              .select('*', { count: 'exact', head: true })
              .eq('tournament_id', t.id);
            participants = count || 0;
          }
          return {
            id: t.id,
            name: t.name,
            game: t.games?.short_name || t.games?.name || 'Unknown',
            prizePool: Number(t.prize_pool) || 0,
            entryFee: Number(t.entry_fee) || 0,
            participants,
            maxParticipants: t.max_participants || 0,
            startDate: t.start_date,
            startTime: t.start_date ? new Date(t.start_date).toLocaleTimeString() : '',
            format: t.format,
            status: t.status,
            featured: !!t.is_featured,
            description: t.description || ''
          };
        }));

        setList(withCounts);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const upcomingTournaments = useMemo(() => list.filter(t => t.status !== 'completed'), [list]);
  const liveTournaments = useMemo(() => list.filter(t => ['live','in_progress'].includes(t.status)), [list]);
  const completedTournaments = useMemo(() => list.filter(t => t.status === 'completed'), [list]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live": return "bg-destructive";
      case "registration": return "bg-primary";
      case "full": return "bg-muted";
      case "completed": return "bg-success";
      default: return "bg-muted";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "live": return "LIVE";
      case "registration": return "Open";
      case "full": return "Full";
      case "completed": return "Completed";
      default: return status;
    }
  };

  const filteredUpcoming = gameFilter === "all" 
    ? upcomingTournaments 
    : upcomingTournaments.filter(t => t.game === gameFilter);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-background to-background/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Tournaments
                </span>
              </h1>
              <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
                Compete in official tournaments with massive prize pools. Show Nigeria who's the ultimate gamer.
              </p>
            </div>
          </div>
        </section>

        {/* Featured Tournament */}
        {upcomingTournaments.filter(t => t.featured).map(tournament => (
          <section key={tournament.id} className="py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <Card className="glass-card overflow-hidden glow-primary">
                <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-8">
                  <div className="flex flex-col lg:flex-row items-center justify-between">
                    <div className="text-center lg:text-left mb-6 lg:mb-0">
                      <Badge className="bg-primary text-primary-foreground mb-4">
                        🔥 FEATURED TOURNAMENT
                      </Badge>
                      <h2 className="text-3xl font-bold mb-2">{tournament.name}</h2>
                      <p className="text-xl text-foreground/80 mb-4">
                        ₦{Number(tournament.prizePool).toLocaleString()} Prize Pool • {tournament.format} • {tournament.game}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-primary" />
                          {tournament.participants}/{tournament.maxParticipants} Players
                        </div>
                        <div className="flex items-center">
                          <Coins className="h-4 w-4 mr-2 text-accent" />
                          Entry: ₦{Number(tournament.entryFee).toLocaleString()}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-success" />
                          {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : ''} {tournament.startTime}
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <Link to={`/tournaments/${tournament.id}`}>
                        <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary pulse-glow mb-4">
                          <Trophy className="mr-2 h-5 w-5" />
                          Register Now
                        </Button>
                      </Link>
                      <div className="text-sm text-foreground/70">
                        {tournament.maxParticipants - tournament.participants} spots remaining
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        ))}

        {/* Tournament Tabs */}
        <section className="py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="grid w-full grid-cols-3 glass-card">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="live">Live</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              
              {/* Upcoming Tournaments */}
              <TabsContent value="upcoming" className="mt-8">
                {/* Game Filter */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {['all', 'CODM', 'PUBG', 'Free Fire', 'EA FC', 'PES'].map((game) => (
                    <Button
                      key={game}
                      variant={gameFilter === game ? "default" : "outline"}
                      size="sm"
                      onClick={() => setGameFilter(game)}
                      className="glass-button"
                    >
                      {game === 'all' ? 'All Games' : game}
                    </Button>
                  ))}
                </div>
                
                {/* Format Filter */}
                <div className="flex flex-wrap gap-2 mb-8">
                  <div className="text-sm font-medium text-muted-foreground mr-4 flex items-center">Format:</div>
                  {['all', '1v1', '2v2', '3v3', '4v4', '5v5'].map((formatFilter) => (
                    <Button
                      key={formatFilter}
                      variant="outline"
                      size="sm"
                      className="glass-button"
                      onClick={() => {
                        // Add format filtering logic here if needed
                        console.log('Format filter:', formatFilter);
                      }}
                    >
                      {formatFilter === 'all' ? 'All Formats' : formatFilter}
                    </Button>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredUpcoming.filter(t => !t.featured).map((tournament) => (
                    <Card key={tournament.id} className="glass-card game-card overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-semibold">
                              {tournament.game}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {tournament.format || '1v1'}
                            </Badge>
                          </div>
                          <Badge className={`${getStatusColor(tournament.status)} text-white`}>
                            {getStatusText(tournament.status)}
                          </Badge>
                        </div>
                        
                        <h3 className="text-lg font-bold mb-2">{tournament.name}</h3>
                        <p className="text-sm text-foreground/70 mb-4">{tournament.description}</p>
                        
                        {/* Prize Pool */}
                        <div className="text-center mb-4 p-3 glass rounded-lg">
                          <div className="text-2xl font-bold text-primary mb-1">
                            ₦{Number(tournament.prizePool).toLocaleString()}
                          </div>
                          <div className="text-sm text-foreground/70">Prize Pool</div>
                        </div>
                        
                        {/* Tournament Details */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-foreground/70">Entry Fee:</span>
                            <span className="font-semibold text-accent">₦{Number(tournament.entryFee).toLocaleString()}</span>
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
                            <span className="text-foreground/70">Start:</span>
                            <span className="font-semibold text-primary">
                              {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : ''} {tournament.startTime}
                            </span>
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
                        
                        <Link to={`/tournaments/${tournament.id}`}>
                          <Button 
                            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                            disabled={tournament.status === "full"}
                          >
                            {tournament.status === "full" ? "Tournament Full" : "View Details"}
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              {/* Live Tournaments */}
              <TabsContent value="live" className="mt-8">
                <div className="space-y-6">
                  {liveTournaments.map((tournament) => (
                    <Card key={tournament.id} className="glass-card">
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className="text-xl font-bold">{tournament.name}</h3>
                              <Badge className="bg-destructive text-destructive-foreground animate-pulse">
                                🔴 LIVE
                              </Badge>
                              <Badge variant="secondary">{tournament.game}</Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-foreground/50">Prize Pool:</span>
                                <div className="font-semibold text-primary">{tournament.prizePool}</div>
                              </div>
                              <div>
                                <span className="text-foreground/50">Players:</span>
                                <div className="font-semibold">{tournament.participants}</div>
                              </div>
                              <div>
                                <span className="text-foreground/50">Current Round:</span>
                                <div className="font-semibold">{tournament.currentRound}</div>
                              </div>
                              <div>
                                <span className="text-foreground/50">Time Left:</span>
                                <div className="font-semibold text-destructive">{tournament.timeRemaining}</div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 md:mt-0 md:ml-6">
                            <Link to={`/tournaments/${tournament.id}`}>
                              <Button className="bg-gradient-to-r from-destructive to-destructive/80 hover:opacity-90">
                                <Zap className="mr-2 h-4 w-4" />
                                Watch Live
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              {/* Completed Tournaments */}
              <TabsContent value="completed" className="mt-8">
                <div className="space-y-6">
                  {completedTournaments.map((tournament) => (
                    <Card key={tournament.id} className="glass-card">
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className="text-xl font-bold">{tournament.name}</h3>
                              <Badge variant="secondary">{tournament.game}</Badge>
                              <Badge className="bg-success text-success-foreground">
                                Completed
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-foreground/50">Prize Pool:</span>
                                <div className="font-semibold text-primary">{tournament.prizePool}</div>
                              </div>
                              <div>
                                <span className="text-foreground/50">Winner:</span>
                                <div className="font-semibold text-accent">{tournament.winner}</div>
                              </div>
                              <div>
                                <span className="text-foreground/50">Winner Prize:</span>
                                <div className="font-semibold text-success">{tournament.winnerPrize}</div>
                              </div>
                              <div>
                                <span className="text-foreground/50">Completed:</span>
                                <div className="font-semibold">{tournament.completedDate}</div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 md:mt-0 md:ml-6">
                            <Link to={`/tournaments/${tournament.id}`}>
                              <Button variant="outline" className="glass-button">
                                <Crown className="mr-2 h-4 w-4" />
                                View Results
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Tournament Features */}
        <section className="py-16 bg-gradient-to-b from-background/50 to-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Join TacktixEdge Tournaments?</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="glass-card text-center">
                <div className="p-6">
                  <Trophy className="h-12 w-12 mx-auto text-primary mb-4" />
                  <h3 className="font-bold mb-2">Massive Prize Pools</h3>
                  <p className="text-sm text-foreground/70">
                    Weekly tournaments with prizes ranging from ₦10K to ₦500K. The bigger the tournament, the bigger the rewards.
                  </p>
                </div>
              </Card>
              
              <Card className="glass-card text-center">
                <div className="p-6">
                  <Users className="h-12 w-12 mx-auto text-accent mb-4" />
                  <h3 className="font-bold mb-2">Professional Format</h3>
                  <p className="text-sm text-foreground/70">
                    Official tournament brackets, live streaming, and professional oversight for the ultimate esports experience.
                  </p>
                </div>
              </Card>
              
              <Card className="glass-card text-center">
                <div className="p-6">
                  <Calendar className="h-12 w-12 mx-auto text-success mb-4" />
                  <h3 className="font-bold mb-2">Regular Schedule</h3>
                  <p className="text-sm text-foreground/70">
                    New tournaments every week across all supported games. Never miss a chance to compete and win big.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Tournaments;