import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Users, Trophy, Target } from "lucide-react";

import codmCover from "@/assets/codm-cover.jpg";
import pubgCover from "@/assets/pubg-cover.jpg";
import freefireCover from "@/assets/freefire-cover.jpg";
import eafcCover from "@/assets/eafc-cover.jpg";
import pesCover from "@/assets/pes-cover.jpg";

interface Game {
  id: string;
  name: string;
  shortName: string;
  image: string;
  description: string;
  modes: string[];
  minStake: string;
  maxStake: string;
  activeMatches: number;
  popularModes: string[];
}

const GamesGrid = () => {
  const games: Game[] = [
    {
      id: 'codm',
      name: 'Call of Duty: Mobile',
      shortName: 'CODM',
      image: codmCover,
      description: "Nigeria's #1 tactical shooter. Battle Royale, Multiplayer modes, and intense 1v1 duels.",
      modes: ['1v1', '2v2', '5v5', 'Battle Royale', 'TDM', 'Domination', 'Search & Destroy'],
      minStake: '₦200',
      maxStake: '₦10,000',
      activeMatches: 147,
      popularModes: ['1v1 Sniper', 'TDM', 'Battle Royale']
    },
    {
      id: 'pubg',
      name: 'PUBG Mobile',
      shortName: 'PUBG',
      image: pubgCover,
      description: "Classic Battle Royale with up to 100 players. Arena modes and intense survival gameplay.",
      modes: ['Battle Royale', '1v1 Arena', 'TDM', '4v4', 'Squad'],
      minStake: '₦300',
      maxStake: '₦8,000',
      activeMatches: 89,
      popularModes: ['Battle Royale', '1v1 Arena', 'Squad']
    },
    {
      id: 'freefire',
      name: 'Free Fire MAX',
      shortName: 'Free Fire',
      image: freefireCover,
      description: "Fast-paced BR optimized for all devices. Perfect for quick competitive matches.",
      modes: ['Battle Royale', 'Clash Squad', '1v1', '2v2'],
      minStake: '₦150',
      maxStake: '₦5,000',
      activeMatches: 203,
      popularModes: ['Battle Royale', 'Clash Squad', '1v1']
    },
    {
      id: 'eafc',
      name: 'EA FC Mobile',
      shortName: 'EA FC',
      image: eafcCover,
      description: "Ultimate football experience with realistic gameplay and official teams.",
      modes: ['1v1', '2v2', 'Ultimate Team', 'Season Mode'],
      minStake: '₦250',
      maxStake: '₦7,000',
      activeMatches: 76,
      popularModes: ['1v1 Ultimate', '2v2 Classic', 'Season']
    },
    {
      id: 'pes',
      name: 'PES Mobile',
      shortName: 'PES',
      image: pesCover,
      description: "Professional football simulation with advanced tactics and real player stats.",
      modes: ['1v1', '2v2', 'Master League', 'Online Challenge'],
      minStake: '₦200',
      maxStake: '₦6,000',
      activeMatches: 54,
      popularModes: ['1v1 Classic', 'Master League', '2v2']
    },
    {
      id: 'bloodstrike',
      name: 'Blood Strike',
      shortName: 'Blood Strike',
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop',
      description: "FPS optimized for all devices. Fast-paced action with multiple game modes.",
      modes: ['Battle Royale', 'TDM', '1v1', 'Squad'],
      minStake: '₦100',
      maxStake: '₦4,000',
      activeMatches: 32,
      popularModes: ['Battle Royale', 'TDM', '1v1']
    }
  ];

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {games.map((game) => (
            <Card key={game.id} className="glass-card overflow-hidden game-card group">
              {/* Game Cover */}
              <div className="relative overflow-hidden">
                <img
                  src={game.image}
                  alt={game.name}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                
                {/* Active Matches Badge */}
                <Badge className="absolute top-4 right-4 bg-primary/90 text-primary-foreground">
                  <Users className="h-3 w-3 mr-1" />
                  {game.activeMatches} active
                </Badge>

                {/* Game Logo/Name */}
                <div className="absolute bottom-4 left-4">
                  <h3 className="font-bold text-lg text-white">{game.shortName}</h3>
                </div>
              </div>

              {/* Game Content */}
              <div className="p-6">
                <h4 className="font-semibold mb-2 text-foreground">{game.name}</h4>
                <p className="text-sm text-foreground/70 mb-4 line-clamp-2">
                  {game.description}
                </p>

                {/* Popular Modes */}
                <div className="mb-4">
                  <p className="text-xs text-foreground/50 mb-2">Popular Modes:</p>
                  <div className="flex flex-wrap gap-1">
                    {game.popularModes.map((mode) => (
                      <Badge key={mode} variant="outline" className="text-xs">
                        {mode}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Stake Range */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm">
                    <span className="text-foreground/50">Stakes:</span>
                    <span className="font-semibold text-primary ml-1">
                      {game.minStake} - {game.maxStake}
                    </span>
                  </div>
                  <Trophy className="h-4 w-4 text-accent" />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    size="sm"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Find Match
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="glass-button border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Target className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12">
          <p className="text-foreground/60 mb-4">
            More games coming soon! Have a request?
          </p>
          <Button variant="outline" className="glass-button">
            Suggest a Game
          </Button>
        </div>
      </div>
    </section>
  );
};

export default GamesGrid;