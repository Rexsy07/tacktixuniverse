import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, Users, Zap, Clock, Target, Crown, 
  ArrowLeft, Filter, Calendar, Coins, Eye 
} from "lucide-react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useMatches } from "@/hooks/useMatches";
import { useLeaderboards } from "@/hooks/useLeaderboards";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { RefreshOverlay, RefreshIndicator } from "@/components/ui/refresh-indicator";
import { 
  GameHeroSkeleton, 
  GameModeSkeleton, 
  ChallengeCardSkeleton, 
  LeaderboardEntrySkeleton 
} from "@/components/ui/game-skeletons";

import { withBase } from "@/utils/url";

const GameDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stakeFilter, setStakeFilter] = useState("all");
  const [gameData, setGameData] = useState<any>(null);
  const [gameModes, setGameModes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { matches: openChallenges, refreshing: challengesRefreshing } = useMatches();
  const { globalLeaderboard } = useLeaderboards();


  useEffect(() => {
    if (slug) {
      fetchGameData();
    }
  }, [slug]);

  const fetchGameData = async () => {
    try {
      setLoading(true);

      // Fetch game data (support short_name, id, or name fragment)
      const normalized = (slug as string).replace(/-/g, ' ').trim();

      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(slug as string);

      let game: any = null;
      let gameError: any = null;

      if (isUuid) {
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .eq('id', slug)
          .maybeSingle();
        game = data;
        gameError = error;
      } else {
        // Try matching by short_name (case-insensitive), then by name
        let res = await supabase
          .from('games')
          .select('*')
          .ilike('short_name', slug as string)
          .maybeSingle();

        if (!res.data) {
          res = await supabase
            .from('games')
            .select('*')
            .ilike('short_name', normalized)
            .maybeSingle();
        }

        if (!res.data) {
          // In case of stray spaces or punctuation in short_name, match contains
          res = await supabase
            .from('games')
            .select('*')
            .ilike('short_name', `%${normalized}%`)
            .maybeSingle();
        }

        if (!res.data) {
          res = await supabase
            .from('games')
            .select('*')
            .ilike('name', normalized)
            .maybeSingle();
        }

        if (!res.data) {
          res = await supabase
            .from('games')
            .select('*')
            .ilike('name', `%${normalized}%`)
            .maybeSingle();
        }

        game = res.data;
        gameError = res.error;
      }

      if (gameError || !game) {
        console.error('Game not found with slug or name:', { slug, error: gameError });
        return;
      }

      // Fetch game modes for this game
      const { data: modes, error: modesError } = await supabase
        .from('game_modes')
        .select('*')
        .eq('game_id', game.id);

      if (modesError) {
        console.error('Error fetching game modes:', modesError);
      }

      // Normalize formats: split entries containing commas into separate items, trim, dedupe
      const normalizedModes = (modes || []).map((m: any) => ({
        ...m,
        formats: Array.isArray(m.formats)
          ? Array.from(new Set(m.formats.flatMap((f: any) => String(f).split(',')).map((s: string) => s.trim()).filter(Boolean)))
          : []
      }));

      // Fetch active matches count
      const { count: activeMatches } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', game.id)
        .eq('status', 'awaiting_opponent')
        .is('opponent_id', null);
        
      // Calculate online players from recent matches (simplified)
      const { count: onlinePlayers } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', game.id)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Last hour
        
      // Calculate average stake from matches
      const { data: stakeData } = await supabase
        .from('matches')
        .select('stake_amount')
        .eq('game_id', game.id)
        .not('stake_amount', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);
      
      const avgStake = stakeData && stakeData.length > 0 
        ? stakeData.reduce((sum, match) => sum + (match.stake_amount || 0), 0) / stakeData.length
        : 100;
      
      setGameData({
        ...game,
        modes: normalizedModes,
        cover: withBase(game.cover_image_url),
        playersOnline: onlinePlayers || 0,
        activeMatches: activeMatches || 0,
        avgStake: `₦${Math.round(avgStake)}`
      });

      setGameModes(normalizedModes);

    } catch (error) {
      console.error('Error fetching game data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptChallenge = (matchId: string) => {
    if (!user) {
      toast.error("Please log in to accept challenges");
      navigate("/auth");
      return;
    }
    
    // Navigate to the match detail page where users can accept the challenge
    navigate(`/match/${matchId}`);
    toast.success("Redirecting to match details...");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          {/* Game Hero Section Skeleton */}
          <section className="py-8 bg-gradient-to-b from-background to-background/50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-6">
                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              </div>
              
              <GameHeroSkeleton />
            </div>
          </section>

          {/* Game Content Tabs Skeleton */}
          <section className="py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="glass-card mb-8 animate-pulse">
                <div className="h-12 bg-muted rounded" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GameModeSkeleton />
                <GameModeSkeleton />
                <GameModeSkeleton />
                <GameModeSkeleton />
              </div>
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Game Not Found</h1>
          <Link to="/games">
            <Button>Back to Games</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Filter challenges for this game
  const gameOpenChallenges = openChallenges.filter(challenge => 
    challenge.games?.short_name?.toLowerCase() === slug?.toLowerCase()
  ).slice(0, 10);

  // Filter leaderboard for this game  
  const gameLeaderboard = globalLeaderboard.slice(0, 10); // Show top global players for now

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Game Hero Section */}
        <section className="py-8 bg-gradient-to-b from-background to-background/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <Link to="/games" className="inline-flex items-center text-primary hover:text-primary/80">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Games
              </Link>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Game Info */}
              <div className="lg:col-span-2">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="relative">
                    <img 
                      src={gameData.cover} 
                      alt={gameData.name}
                      className="w-full md:w-48 h-64 object-cover rounded-lg"
                    />
                    <Badge className="absolute top-4 right-4 bg-primary">
                      {gameData.short_name}
                    </Badge>
                  </div>
                  
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold mb-4">
                      <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {gameData.name}
                      </span>
                    </h1>
                    <p className="text-foreground/70 mb-6 leading-relaxed">
                      {gameData.description}
                    </p>
                    
                    {/* Game Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 glass rounded-lg">
                        <Users className="h-5 w-5 mx-auto text-primary mb-1" />
                        <div className="font-semibold">{gameData.playersOnline}</div>
                        <div className="text-xs text-foreground/50">Online</div>
                      </div>
                      <div className="text-center p-3 glass rounded-lg">
                        <Zap className="h-5 w-5 mx-auto text-accent mb-1" />
                        <div className="font-semibold">{gameData.activeMatches}</div>
                        <div className="text-xs text-foreground/50">Active</div>
                      </div>
                      <div className="text-center p-3 glass rounded-lg">
                        <Coins className="h-5 w-5 mx-auto text-success mb-1" />
                        <div className="font-semibold">{gameData.avgStake}</div>
                        <div className="text-xs text-foreground/50">Avg Stake</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link to="/create-challenge">
                    <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary">
                      <Trophy className="mr-2 h-4 w-4" />
                      Create Challenge
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full glass-button"
                    onClick={() => {
                      if (!user) {
                        // For non-logged users, show available challenges on the same page
                        const challengesTab = document.querySelector('[value="challenges"]');
                        if (challengesTab) {
                          (challengesTab as HTMLElement).click();
                          setTimeout(() => {
                            challengesTab.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }
                        toast.info("Showing available challenges. Log in to accept them!");
                        return;
                      }
                      
                      // Navigate to matches page where users can see all available challenges
                      // Add the current game as a query parameter for potential filtering
                      navigate(`/matches?game=${gameData.short_name || gameData.id}`);
                      toast.success(`Finding matches for ${gameData.name}...`);
                    }}
                  >
                    <Target className="mr-2 h-4 w-4" />
                    Find Match
                  </Button>
                  <Link to="/tournaments">
                    <Button variant="outline" className="w-full glass-button">
                      <Crown className="mr-2 h-4 w-4" />
                      View Tournaments
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Game Content Tabs */}
        <section className="py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Tabs defaultValue="modes" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 glass-card">
                <TabsTrigger value="modes" className="text-xs sm:text-sm py-2 sm:py-3 text-center">Game Modes</TabsTrigger>
                <TabsTrigger value="challenges" className="text-xs sm:text-sm py-2 sm:py-3 text-center">Open Challenges</TabsTrigger>
                <TabsTrigger value="leaderboard" className="text-xs sm:text-sm py-2 sm:py-3 text-center">Leaderboard</TabsTrigger>
                <TabsTrigger value="stats" className="text-xs sm:text-sm py-2 sm:py-3 text-center">Statistics</TabsTrigger>
              </TabsList>
              
              {/* Game Modes */}
              <TabsContent value="modes" className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {gameModes.map((mode, index) => (
                    <Card 
                      key={mode.id} 
                      className="glass-card smooth-fade-in smooth-update"
                      style={{ animationDelay: `${index * 0.15}s` }}
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold">{mode.name}</h3>
                          <Badge variant="secondary">
                            {mode.max_stake >= 10000000 ? `₦${mode.min_stake}+` : `₦${mode.min_stake} - ₦${mode.max_stake}`}
                          </Badge>
                        </div>
                        <p className="text-foreground/70 mb-4">{mode.description}</p>
                        
                        {/* Formats */}
                        {mode.formats && (
                          <div className="mb-3">
                            <h4 className="text-sm font-semibold mb-2 text-foreground/80">Formats:</h4>
                            <div className="flex flex-wrap gap-2">
                              {mode.formats.map((format: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {format}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Maps */}
                        {mode.maps && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold mb-2 text-foreground/80">Maps:</h4>
                            <div className="text-sm text-foreground/60 leading-relaxed">
                              {mode.maps.join(", ")}
                            </div>
                          </div>
                        )}
                        
                        <Link to={`/create-challenge?game=${gameData.id}&mode=${mode.id}`}>
                          <Button className="w-full" variant="outline">
                            Create {mode.name} Challenge
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              {/* Open Challenges */}
              <TabsContent value="challenges" className="mt-8">
                <div className="mb-6 flex flex-wrap gap-4 justify-between items-center">
                  <div className="flex flex-wrap gap-4">
                    <Button
                      variant={stakeFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStakeFilter("all")}
                      className="glass-button"
                    >
                      All Stakes
                    </Button>
                    <Button
                      variant={stakeFilter === "low" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStakeFilter("low")}
                      className="glass-button"
                    >
                      Under ₦1,000
                    </Button>
                    <Button
                      variant={stakeFilter === "high" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStakeFilter("high")}
                      className="glass-button"
                    >
                      Over ₦1,000
                    </Button>
                  </div>
                  
                  <RefreshIndicator isRefreshing={challengesRefreshing} />
                </div>
                
                <RefreshOverlay isRefreshing={challengesRefreshing}>
                  <div className="space-y-4">
                    {gameOpenChallenges.length === 0 ? (
                      <div className="text-center py-12">
                        <Trophy className="h-16 w-16 mx-auto text-foreground/30 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Open Challenges</h3>
                        <p className="text-foreground/70">Be the first to create a challenge for {gameData.name}!</p>
                      </div>
                    ) : (
                      gameOpenChallenges.map((challenge, index) => (
                        <Card 
                          key={challenge.id} 
                          className="glass-card smooth-fade-in smooth-update"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-4 mb-2">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                                    <span className="text-white font-bold">
                                      {challenge.creator_profile?.username?.[0]?.toUpperCase() || 'A'}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">{challenge.creator_profile?.username || 'Anonymous'}</h4>
                                    <div className="flex items-center gap-2 text-sm text-foreground/70">
                                      <Badge variant="outline">{challenge.format}</Badge>
                                      <span>•</span>
                                      <span>{challenge.game_modes?.name}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                  <div>
                                    <span className="text-foreground/50">Stake:</span>
                                    <div className="font-bold text-primary">₦{challenge.stake_amount.toLocaleString()}</div>
                                  </div>
                                  <div>
                                    <span className="text-foreground/50">Posted:</span>
                                    <div>{new Date(challenge.created_at).toLocaleTimeString()}</div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-4 md:mt-0 flex gap-2">
                                <Link to={`/match/${challenge.id}`}>
                                  <Button variant="outline" className="glass-button">
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Match
                                  </Button>
                                </Link>
                                {user?.id !== challenge.creator_id && (
                                  <Button 
                                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                                    onClick={() => handleAcceptChallenge(challenge.id)}
                                  >
                                    Accept Challenge
                                  </Button>
                                )}
                                {user?.id === challenge.creator_id && (
                                  <Button variant="outline" disabled>
                                    Your Challenge
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </RefreshOverlay>
              </TabsContent>
              
              {/* Leaderboard */}
              <TabsContent value="leaderboard" className="mt-8">
                <Card className="glass-card">
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-6 text-center">Top Players</h3>
                    
                    {gameLeaderboard.length === 0 ? (
                      <div className="text-center py-12">
                        <Trophy className="h-16 w-16 mx-auto text-foreground/30 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Leaderboard Data</h3>
                        <p className="text-foreground/70">Play some matches to see the leaderboard!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {gameLeaderboard.map((entry, index) => (
                          <div key={entry.user_id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 glass rounded-lg">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                index === 0 ? 'bg-yellow-500' : 
                                index === 1 ? 'bg-gray-400' : 
                                index === 2 ? 'bg-amber-600' : 'bg-muted'
                              } text-white`}>
                                {index + 1}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold truncate">{entry.username || 'Anonymous'}</div>
                                <div className="text-sm text-foreground/70 truncate">
                                  {entry.total_matches} matches • {entry.win_rate}% win rate
                                </div>
                              </div>
                            </div>
                            <div className="sm:text-right w-full sm:w-auto">
                              <div className="font-bold text-success">
                                ₦{entry.total_earnings.toLocaleString()}
                              </div>
                              <div className="text-sm text-foreground/70">Earnings</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
              
              {/* Statistics */}
              <TabsContent value="stats" className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="glass-card text-center p-6">
                    <Trophy className="h-8 w-8 mx-auto text-primary mb-2" />
                    <div className="text-2xl font-bold">₦{gameData.min_stake.toLocaleString()}</div>
                    <div className="text-sm text-foreground/70">Total Prize Pool</div>
                  </Card>
                  
                  <Card className="glass-card text-center p-6">
                    <Users className="h-8 w-8 mx-auto text-accent mb-2" />
                    <div className="text-2xl font-bold">{gameData.playersOnline}</div>
                    <div className="text-sm text-foreground/70">Active Players</div>
                  </Card>
                  
                  <Card className="glass-card text-center p-6">
                    <Zap className="h-8 w-8 mx-auto text-success mb-2" />
                    <div className="text-2xl font-bold">{gameData.activeMatches}</div>
                    <div className="text-sm text-foreground/70">Matches Today</div>
                  </Card>
                  
                  <Card className="glass-card text-center p-6">
                    <Clock className="h-8 w-8 mx-auto text-warning mb-2" />
                    <div className="text-2xl font-bold">2.5m</div>
                    <div className="text-sm text-foreground/70">Avg Match Time</div>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default GameDetail;