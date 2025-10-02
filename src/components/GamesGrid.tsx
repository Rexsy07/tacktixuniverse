import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Users, Trophy, Target } from "lucide-react";
import { useGames } from "@/hooks/useGames";
import { withBase } from "@/utils/url";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { GameCardSkeleton } from "@/components/ui/loading-skeletons";

const GamesGrid = () => {
  const { games, loading, error } = useGames();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleFindMatch = (gameId: string) => {
    if (!user) {
      navigate('/signup');
      return;
    }
    navigate(`/games/${gameId}`);
  };

  const handleGameDetails = (gameId: string) => {
    navigate(`/games/${gameId}`);
  };

  const handleSuggestGame = () => {
    navigate('/support');
  };

  return (
    <section id="games" className="py-16 bg-gradient-to-b from-background/50 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Supported Games
            </span>
          </h2>
          <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
            Challenge opponents across Nigeria's most popular mobile games. From tactical shooters to football sims.
          </p>
        </div>

        {/* Games Grid */}
        <div className="app-grid content-transition" style={{"--content-min-height": "420px"} as React.CSSProperties}>
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={`game-skel-${i}`} className="card-slot card-slot--game">
                <Card className="glass-card overflow-hidden">
                  {/* Use dedicated skeleton */}
                  {/* Imported below */}
                </Card>
              </div>
            ))
          ) : error ? (
            <div className="col-span-full text-center py-12">
              <p className="text-destructive">Error loading games: {error}</p>
            </div>
          ) : games.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-foreground/70">No games available at the moment.</p>
            </div>
          ) : (
            games.map((game) => (
              <div key={game.id} className="card-slot card-slot--game">
                <Card className="glass-card overflow-hidden game-card group">
                  {/* Game Cover */}
                  <div className="relative overflow-hidden">
                    <img
                      src={withBase(game.cover_image_url)}
                      alt={game.name}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                    
                    {/* Active Matches Badge */}
                    <Badge className="absolute top-4 right-4 bg-primary/90 text-primary-foreground">
                      <Users className="h-3 w-3 mr-1" />
                      {game.active_matches_count || 0} active
                    </Badge>
  
                    {/* Game Logo/Name */}
                    <div className="absolute bottom-4 left-4">
                      <h3 className="font-bold text-lg text-white">{game.short_name}</h3>
                    </div>
                  </div>
  
                  {/* Game Content */}
                  <div className="p-6">
                    <h4 className="font-semibold mb-2 text-foreground">{game.name}</h4>
                    <p className="text-sm text-foreground/70 mb-4 line-clamp-2">
                      {game.description}
                    </p>
  
                    {/* Game Modes */}
                    {game.game_modes && game.game_modes.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-foreground/50 mb-2">Available Modes:</p>
                        <div className="flex flex-wrap gap-1">
                          {game.game_modes.slice(0, 3).map((mode) => (
                            <Badge key={mode.id} variant="outline" className="text-xs">
                              {mode.name}
                            </Badge>
                          ))}
                          {game.game_modes.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{game.game_modes.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
  
                    {/* Stake Range */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm">
                        <span className="text-foreground/50">Min Stake:</span>
                        <span className="font-semibold text-primary ml-1">
                          ₦{game.min_stake?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <Trophy className="h-4 w-4 text-accent" />
                    </div>
  
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                        size="sm"
                        onClick={() => handleFindMatch(game.id)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Find Match
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="glass-button border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        onClick={() => handleGameDetails(game.id)}
                        title="View Game Details"
                      >
                        <Target className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            ))
          )}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12">
          <p className="text-foreground/60 mb-4">
            More games coming soon! Have a request?
          </p>
          <Button variant="outline" className="glass-button" onClick={handleSuggestGame}>
            Suggest a Game
          </Button>
        </div>
      </div>
    </section>
  );
};

export default GamesGrid;