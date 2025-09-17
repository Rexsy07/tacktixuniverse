import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, Users, Zap, Filter } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useLiveMatches } from "@/hooks/useMatches";
import { useAuth } from "@/hooks/useAuth";

const LiveMatchFeed = () => {
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const { liveMatches, loading } = useLiveMatches();
  const { user } = useAuth();

  // Transform live matches to expected format
  const matches = liveMatches.map(match => ({
    id: match.id,
    game: match.games?.short_name || "Game",
    mode: match.game_modes?.name || "Mode",
    stake: `₦${match.stake_amount?.toLocaleString()}`,
    player1: match.creator_profile?.username || "Player1",
    player2: match.opponent_profile?.username,
    status: match.status === 'awaiting_opponent' ? 'awaiting' as const : 
            match.status === 'in_progress' ? 'in-progress' as const : 'completed' as const,
    timeLeft: match.status === 'awaiting_opponent' ? undefined : 
              match.status === 'in_progress' ? 'LIVE' : undefined
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress': return 'bg-destructive';
      case 'awaiting': return 'bg-primary';
      case 'completed': return 'bg-success';
      default: return 'bg-muted';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in-progress': return 'Live';
      case 'awaiting': return 'Open';
      case 'completed': return 'Finished';
      default: return status;
    }
  };

  return (
    <section className="py-16 bg-gradient-to-b from-background to-background/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Live Match Feed
            </span>
          </h2>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Join the action! See what's happening right now on TacktixEdge.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {['all', 'CODM', 'PUBG', 'Free Fire', 'EA FC', 'PES'].map((gameFilter) => (
            <Button
              key={gameFilter}
              variant={filter === gameFilter ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(gameFilter)}
              className="glass-button"
            >
              {gameFilter === 'all' ? 'All Games' : gameFilter}
            </Button>
          ))}
        </div>

        {/* Live Matches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-foreground/70">Loading live matches...</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users className="h-16 w-16 mx-auto text-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Active Matches</h3>
              <p className="text-foreground/70 mb-6">Be the first to create a challenge!</p>
              <Link to="/create-challenge">
                <Button>Create Challenge</Button>
              </Link>
            </div>
          ) : (
            matches.map((match) => (
              <Card key={match.id} className="glass-card hover:glow-primary transition-all duration-300 game-card">
                <div className="p-6">
                  {/* Match Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="font-semibold">
                        {match.game}
                      </Badge>
                      <Badge className={`${getStatusColor(match.status)} text-white`}>
                        {getStatusText(match.status)}
                      </Badge>
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {match.stake}
                    </div>
                  </div>

                  {/* Match Details */}
                  <div className="mb-4">
                    <p className="text-sm text-foreground/70 mb-2">{match.mode}</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{match.player1}</span>
                        {match.status === 'in-progress' && (
                          <span className="text-xs text-destructive animate-pulse">🔴 LIVE</span>
                        )}
                      </div>
                      {match.player2 ? (
                        <div className="text-sm font-medium text-accent">
                          vs {match.player2}
                        </div>
                      ) : (
                        <div className="text-sm text-foreground/50">
                          Awaiting opponent...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Match Status */}
                  {match.timeLeft && (
                    <div className="flex items-center space-x-2 mb-4">
                      <Clock className="h-4 w-4 text-foreground/50" />
                      <span className="text-sm text-foreground/70">
                        {match.status === 'in-progress' ? match.timeLeft : `Time remaining: ${match.timeLeft}`}
                      </span>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button 
                    className="w-full"
                    variant={match.status === 'awaiting' ? 'default' : 'outline'}
                    disabled={match.status === 'completed'}
                    onClick={() => navigate(`/matches/${match.id}`)}
                  >
                    {match.status === 'awaiting' && 'Join Match'}
                    {match.status === 'in-progress' && 'Watch Live'}
                    {match.status === 'completed' && 'View Results'}
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Ticker/Scrolling Feed */}
        <div className="glass-card p-4 overflow-hidden">
          <div className="flex items-center space-x-4 mb-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-semibold">Live Updates</span>
          </div>
          <div className="relative">
            <div className="animate-marquee whitespace-nowrap">
              <span className="mx-8">🔥 ₦500 CODM Search & Destroy - NaijaSharpShooter vs LagosWarrior (LIVE)</span>
              <span className="mx-8">⚡ ₦2,000 PUBG Battle Royale Kill Race - Open for challengers!</span>
              <span className="mx-8">🏆 ₦1,000 PES Online Match - Messi9ja vs CR7Lagos (LIVE)</span>
              <span className="mx-8">💫 ₦800 Free Fire Clash Squad - FireKing needs opponent</span>
              <span className="mx-8">⚽ ₦1,500 EA FC Head-to-Head - Match completed</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-8">
          <Link to={user ? "/create-challenge" : "/sign-up"}>
            <Button size="lg" className="bg-gradient-to-r from-primary to-accent glow-primary">
              <Users className="mr-2 h-5 w-5" />
              {user ? "Create Your Challenge" : "Join TacktixEdge"}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LiveMatchFeed;