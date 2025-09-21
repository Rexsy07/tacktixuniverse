import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Users, Zap, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { useGames } from "@/hooks/useGames";

const Games = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { games: dbGames, loading } = useGames();

  // Transform database games to match the expected format
  const games = dbGames.map(game => ({
    id: game.id,
    name: game.name,
    shortName: game.short_name,
    cover: game.cover_image_url,
    description: game.description || "Popular mobile game",
    modes: game.game_modes?.map(mode => mode.name) || [],
    stakes: `₦${game.min_stake?.toLocaleString()} - ₦${game.max_stake?.toLocaleString()}`,
    activeMatches: game.active_matches_count || 0,
    playersOnline: game.players_online || 0,
    popularity: game.active_matches_count && game.active_matches_count > 30 ? "Very High" : 
                game.active_matches_count && game.active_matches_count > 15 ? "High" : "Medium"
  }));

  const filteredGames = games.filter(game =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.shortName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPopularityColor = (popularity: string) => {
    switch (popularity) {
      case "Very High": return "text-primary";
      case "High": return "text-accent";
      case "Medium": return "text-success";
      default: return "text-foreground/70";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground/70">Loading games...</p>
        </div>
      </div>
    );
  }

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
                  Choose Your Game
                </span>
              </h1>
              <p className="text-xl text-foreground/70 max-w-3xl mx-auto mb-8">
                Select from Nigeria's most popular mobile games. Create challenges, join matches, and prove your skills.
              </p>
              
              {/* Search Bar */}
              <div className="max-w-md mx-auto relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/50" />
                <Input
                  type="text"
                  placeholder="Search games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 glass-card border-primary/20"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Games Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredGames.map((game) => (
                <Card key={game.id} className="glass-card game-card overflow-hidden group">
                  <div className="relative">
                    <img 
                      src={game.cover} 
                      alt={game.name}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-primary/90 text-primary-foreground">
                        {game.shortName}
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <Badge variant="secondary" className={getPopularityColor(game.popularity)}>
                        {game.popularity} Popularity
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{game.name}</h3>
                    <p className="text-foreground/70 text-sm mb-4 leading-relaxed">
                      {game.description}
                    </p>
                    
                    {/* Game Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 glass rounded-lg">
                        <Users className="h-5 w-5 mx-auto text-primary mb-1" />
                        <div className="text-sm font-semibold">{game.playersOnline}</div>
                        <div className="text-xs text-foreground/50">Online</div>
                      </div>
                      <div className="text-center p-3 glass rounded-lg">
                        <Zap className="h-5 w-5 mx-auto text-accent mb-1" />
                        <div className="text-sm font-semibold">{game.activeMatches}</div>
                        <div className="text-xs text-foreground/50">Active Matches</div>
                      </div>
                    </div>
                    
                    {/* Game Modes */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold mb-2">Available Modes:</h4>
                      <div className="flex flex-wrap gap-2">
                        {game.modes.slice(0, 3).map((mode, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {mode}
                          </Badge>
                        ))}
                        {game.modes.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{game.modes.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Stakes Range */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground/70">Stake Range:</span>
                        <span className="font-semibold text-primary">{game.stakes}</span>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <Link to={`/games/${game.shortName?.toLowerCase().replace(/\s+/g, '-')}`}>
                      <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary">
                        <Trophy className="mr-2 h-4 w-4" />
                        View Game Details
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
            
            {filteredGames.length === 0 && (
              <div className="text-center py-12">
                <div className="text-foreground/50 mb-4">No games found matching your search.</div>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery("")}
                  className="glass-button"
                >
                  Clear Search
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-gradient-to-b from-background/50 to-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass-card max-w-4xl mx-auto p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Start Playing?
              </h2>
              <p className="text-foreground/70 mb-6">
                Join thousands of Nigerian gamers competing for real rewards. 
                Your skills determine your earnings.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/sign-up">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary">
                    Sign Up Now
                  </Button>
                </Link>
                <Link to="/tournaments">
                  <Button size="lg" variant="outline" className="glass-button">
                    View Tournaments
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Games;