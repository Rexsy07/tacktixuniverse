import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Crown, Medal, Star, Gamepad2, TrendingUp } from "lucide-react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { useLeaderboards } from "@/hooks/useLeaderboards";
import { useGames } from "@/hooks/useGames";

const Leaderboards = () => {
  const [timePeriod, setTimePeriod] = useState("weekly");
  const [selectedGame, setSelectedGame] = useState("global");
  const { globalLeaderboard, gameLeaderboards, loading } = useLeaderboards();
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
            <Tabs value={selectedGame} onValueChange={setSelectedGame} className="w-full">
              <TabsList className="grid w-full grid-cols-2 glass-card mb-8">
                <TabsTrigger value="global">Global Ranking</TabsTrigger>
                <TabsTrigger value="games">Game Rankings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="global">
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-4 text-foreground/70">Loading leaderboard...</p>
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
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                {getRankIcon(index + 1)}
                                <Badge className="absolute -top-2 -right-2 text-xs" variant="secondary">
                                  #{index + 1}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                                  <span className="text-white font-bold text-lg">
                                    {entry.username[0]?.toUpperCase()}
                                  </span>
                                </div>
                                
                                <div>
                                  <h3 className="font-bold text-lg">{entry.username}</h3>
                                  <div className="flex items-center gap-2">
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
                            
                            <div className="text-right">
                              <div className="text-2xl font-bold text-success">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {games.map((game) => (
                    <Card key={game.id} className="glass-card">
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                            <Gamepad2 className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{game.name}</h3>
                            <p className="text-sm text-foreground/70">Top Players</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {(gameLeaderboards[game.id] || globalLeaderboard.slice(0, 3)).map((entry, index) => (
                            <div key={entry.user_id} className="flex items-center justify-between p-2 glass rounded">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">{index + 1}</span>
                                </div>
                                <span className="font-medium text-sm">{entry.username}</span>
                              </div>
                              <span className="text-success font-semibold text-sm">
                                ₦{entry.total_earnings.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
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