import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, Filter, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useLiveMatches } from "@/hooks/useMatches";
import { useAuth } from "@/hooks/useAuth";
import { useGames } from "@/hooks/useGames";
import MatchCard from "@/components/MatchCard";
import { MatchCardSkeleton } from "@/components/ui/loading-skeletons";

const LiveMatchFeed = () => {
  const [filter, setFilter] = useState('all');
  const { liveMatches, loading } = useLiveMatches();
  const { games, loading: gamesLoading } = useGames();
  const { user } = useAuth();

  // Transform live matches to expected format with additional data
  const allMatches = liveMatches.map(match => ({
    id: match.id,
    game: match.games?.short_name || "Game",
    mode: match.game_modes?.name || "Mode",
    stake: `₦${match.stake_amount?.toLocaleString()}`,
    format: match.format || '1v1',
    player1: match.creator_profile?.username || "Player1",
    player2: match.opponent_profile?.username,
    status: match.status === 'awaiting_opponent' ? 'awaiting' as const : 
            match.status === 'in_progress' ? 'in-progress' as const : 'completed' as const,
    timeLeft: match.status === 'awaiting_opponent' ? undefined : 
              match.status === 'in_progress' ? 'LIVE' : undefined,
    creator_id: match.creator_id,
    opponent_id: match.opponent_id,
    winner_id: match.winner_id
  }));

  // Filter matches based on selected game
  const matches = filter === 'all' 
    ? allMatches 
    : allMatches.filter(match => match.game === filter);


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

        {/* Game Selection Filter */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Select Game to Watch Live</h3>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              key="all"
              variant={filter === 'all' ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter('all')}
              className="glass-button"
            >
              <Search className="mr-2 h-4 w-4" />
              All Games
            </Button>
            {!gamesLoading && games.map((game) => (
              <Button
                key={game.short_name}
                variant={filter === game.short_name ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(game.short_name)}
                className="glass-button"
              >
                {game.short_name}
                {game.active_matches_count !== undefined && (
                  <span className="ml-2 px-2 py-1 text-xs bg-primary/20 rounded-full">
                    {game.active_matches_count}
                  </span>
                )}
              </Button>
            ))}
          </div>
          {filter !== 'all' && (
            <p className="text-center text-sm text-foreground/70 mt-2">
              Showing live matches for <span className="font-semibold text-primary">{filter}</span>
            </p>
          )}
        </div>

        {/* Live Matches Grid */}
        <div className="matches-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 content-transition" style={{"--content-min-height": "400px"} as React.CSSProperties}>
          {loading ? (
            // Show skeleton cards to prevent layout shift
            [...Array(3)].map((_, i) => (
              <MatchCardSkeleton key={`skeleton-${i}`} />
            ))
          ) : matches.length === 0 ? (
            <div className="col-span-full text-center py-12 min-h-[300px] flex flex-col items-center justify-center">
              <Users className="h-16 w-16 mx-auto text-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Active Matches</h3>
              <p className="text-foreground/70 mb-6">Be the first to create a challenge!</p>
              <Link to="/create-challenge">
                <Button>Create Challenge</Button>
              </Link>
            </div>
          ) : (
            matches.map((match) => (
              <div key={match.id} className="match-card-slot">
                <MatchCard match={match} />
              </div>
            ))
          )}
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