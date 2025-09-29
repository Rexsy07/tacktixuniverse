import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Crown, Medal, Star, Gamepad2, TrendingUp, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { useLeaderboards } from "@/hooks/useLeaderboards";
import { useGames } from "@/hooks/useGames";

const Leaderboards = () => {
  const [timePeriod, setTimePeriod] = useState("weekly");
  const [selectedGame, setSelectedGame] = useState("global");
  const { globalLeaderboard, gameLeaderboards, loading, error } = useLeaderboards();
  const { games } = useGames();

  const currentLeaderboard = selectedGame === 'global' 
    ? globalLeaderboard 
    : gameLeaderboards[selectedGame] || [];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return <Trophy className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        <section className="py-16 bg-gradient-to-b from-background to-background/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Leaderboards
                </span>
              </h1>
              <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
                See where you rank among Nigeria's top mobile gamers
              </p>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Tabs value={selectedGame === 'global' ? 'global' : 'games'} onValueChange={(value) => {
              if (value === 'global') {
                setSelectedGame('global');
              } else {
                // Default to first available game when switching to games tab
                const firstGame = games[0]?.id;
                if (firstGame) {
                  setSelectedGame(firstGame);
                }
              }
            }} className="w-full">
              <TabsList className="grid w-full grid-cols-2 gap-2 glass-card mb-8">
                <TabsTrigger value="global" className="text-sm sm:text-base py-2 sm:py-3">Global Ranking</TabsTrigger>
                <TabsTrigger value="games" className="text-sm sm:text-base py-2 sm:py-3">Game Rankings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="global">
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-4 text-foreground/70">Loading leaderboard...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-12">
                      <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
                      <h3 className="text-xl font-semibold mb-2 text-red-600">Error Loading Leaderboard</h3>
                      <p className="text-foreground/70 mb-4">{error}</p>
                      <Button onClick={() => window.location.reload()} variant="outline">
                        Try Again
                      </Button>
                    </div>
                  ) : currentLeaderboard.length === 0 ? (
                    <div className="text-center py-12">
                      <Trophy className="h-16 w-16 mx-auto text-foreground/30 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Rankings Yet</h3>
                      <p className="text-foreground/70">Play some matches to see the leaderboard!</p>
                    </div>
                  ) : (
                    currentLeaderboard.map((entry, index) => (
                      <Card key={entry.user_id} className="glass-card">
                        <div className="p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                              <div className="relative shrink-0">
                                {getRankIcon(index + 1)}
                                <Badge className="absolute -top-2 -right-2 text-xs" variant="secondary">
                                  #{index + 1}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center shrink-0">
                                  <span className="text-white font-bold text-lg">
                                    {entry.username[0]?.toUpperCase()}
                                  </span>
                                </div>
                                
                                <div className="min-w-0">
                                  <h3 className="font-bold text-base sm:text-lg truncate">{entry.username}</h3>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {entry.favorite_game || 'Mixed'}
                                    </Badge>
                                    {entry.current_streak > 5 && (
                                      <Badge className="bg-gradient-to-r from-primary to-accent text-xs">
                                        🔥 {entry.current_streak} win streak
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-left sm:text-right w-full sm:w-auto">
                              <div className="text-xl sm:text-2xl font-bold text-success">
                                ₦{entry.total_earnings.toLocaleString()}
                              </div>
                              <div className="text-sm text-foreground/70">Total Earnings</div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="games">
                <div className="space-y-6">
                  {/* Game selector */}
                  <div className="flex flex-wrap gap-2">
                    {games.map((game) => (
                      <Button
                        key={game.id}
                        variant={selectedGame === game.id ? "default" : "outline"}
                        onClick={() => setSelectedGame(game.id)}
                        className="flex items-center gap-2"
                      >
                        <Gamepad2 className="h-4 w-4" />
                        {game.name}
                      </Button>
                    ))}
                  </div>

                  {/* Selected game leaderboard */}
                  {selectedGame !== 'global' && (
                    <div className="space-y-4">
                      {loading ? (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                          <p className="mt-4 text-foreground/70">Loading game leaderboard...</p>
                        </div>
                      ) : error ? (
                        <div className="text-center py-12">
                          <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
                          <h3 className="text-xl font-semibold mb-2 text-red-600">Error Loading Game Leaderboard</h3>
                          <p className="text-foreground/70 mb-4">{error}</p>
                          <Button onClick={() => window.location.reload()} variant="outline">
                            Try Again
                          </Button>
                        </div>
                      ) : (gameLeaderboards[selectedGame] || []).length === 0 ? (
                        <div className="text-center py-12">
                          <Trophy className="h-16 w-16 mx-auto text-foreground/30 mb-4" />
                          <h3 className="text-xl font-semibold mb-2">No Rankings Yet</h3>
                          <p className="text-foreground/70">No matches played for this game yet!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                              <Gamepad2 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-xl">
                                {games.find(g => g.id === selectedGame)?.name} Leaderboard
                              </h3>
                              <p className="text-foreground/70">Top players ranked by earnings</p>
                            </div>
                          </div>
                          
                          {(gameLeaderboards[selectedGame] || []).map((entry, index) => (
                            <Card key={entry.user_id} className="glass-card">
                              <div className="p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                  <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="relative shrink-0">
                                      {getRankIcon(index + 1)}
                                      <Badge className="absolute -top-2 -right-2 text-xs" variant="secondary">
                                        #{index + 1}
                                      </Badge>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center shrink-0">
                                        <span className="text-white font-bold text-lg">
                                          {entry.username[0]?.toUpperCase()}
                                        </span>
                                      </div>
                                      
                                      <div className="min-w-0">
                                        <h3 className="font-bold text-base sm:text-lg truncate">{entry.username}</h3>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <Badge variant="outline" className="text-xs">
                                            {entry.total_matches} matches
                                          </Badge>
                                          <Badge variant="outline" className="text-xs">
                                            {entry.win_rate.toFixed(1)}% win rate
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="text-left sm:text-right w-full sm:w-auto">
                                    <div className="text-xl sm:text-2xl font-bold text-success">
                                      ₦{entry.total_earnings.toLocaleString()}
                                    </div>
                                    <div className="text-sm text-foreground/70">Game Earnings</div>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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

export default Leaderboards;