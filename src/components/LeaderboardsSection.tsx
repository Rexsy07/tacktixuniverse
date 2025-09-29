import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, Award, TrendingUp, Users, Crown } from "lucide-react";
import { useLeaderboards } from "@/hooks/useLeaderboards";
import { useGames } from "@/hooks/useGames";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LeaderboardRowSkeleton } from "@/components/ui/loading-skeletons";

const LeaderboardsSection = () => {
  const [activeTab, setActiveTab] = useState('global');
  const { globalLeaderboard, gameLeaderboards, loading, error } = useLeaderboards();
  const { games } = useGames();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const handleViewFullLeaderboard = () => {
    navigate('/leaderboards');
  };

  const handleStartCompeting = () => {
    if (!user) {
      navigate('/signup');
      return;
    }
    navigate('/games');
  };

  const getLeaderboardData = () => {
    if (activeTab === 'global') {
      return globalLeaderboard.slice(0, 5).map((player, index) => ({
        rank: index + 1,
        username: player.username,
        earnings: `₦${player.total_earnings.toLocaleString()}`,
        matches: player.total_matches,
        winRate: Math.round(player.win_rate),
        badge: index < 3 ? ['🏆 Champion', '💎 Elite', '⚡ Pro'][index] : undefined
      }));
    }

    const entries = gameLeaderboards[activeTab] || [];
    return entries.slice(0, 5).map((player, index) => ({
      rank: index + 1,
      username: player.username,
      earnings: `₦${player.total_earnings.toLocaleString()}`,
      matches: player.total_matches,
      winRate: Math.round(player.win_rate),
      badge: index < 3 ? ['🏆 Champion', '💎 Elite', '⚡ Pro'][index] : undefined
    }));
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Award className="h-6 w-6 text-amber-600" />;
      default: return <span className="text-lg font-bold text-foreground/70">#{rank}</span>;
    }
  };

  const tabs = [
    { id: 'global', name: 'Global', icon: Trophy },
    ...(games?.slice(0, 2).map(game => ({
      id: game.id,
      name: game.short_name,
      icon: TrendingUp
    })) || [])
  ];

  return (
    <section id="leaderboards" className="py-16 bg-gradient-to-b from-background to-background/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Leaderboards
            </span>
          </h2>
          <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
            See who's dominating the competition. Climb the ranks and earn your spot among Nigeria's gaming elite.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="glass-card p-2 flex flex-wrap justify-center gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 ${
                    activeTab === tab.id 
                      ? "bg-gradient-to-r from-primary to-accent glow-primary" 
                      : "hover:bg-muted/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="truncate">{tab.name}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Leaderboard */}
          <div className="lg:col-span-2">
            <Card className="glass-card">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">
                    {activeTab === 'global' 
                      ? 'Top Earners This Month' 
                      : `${(games.find(g => g.id === activeTab)?.short_name || games.find(g => g.id === activeTab)?.name || 'Game')} Champions`}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    Updated Live
                  </Badge>
                </div>

                <div className="leaderboard-container space-y-4 content-transition" style={{"--content-min-height": "440px"} as React.CSSProperties}>
                  {loading ? (
                    // Show skeleton rows to prevent layout shift
                    [...Array(5)].map((_, i) => (
                      <LeaderboardRowSkeleton key={`skeleton-${i}`} />
                    ))
                  ) : error ? (
                    <div className="text-center py-8 min-h-[200px] flex items-center justify-center">
                      <p className="text-destructive">Error loading leaderboard: {error}</p>
                    </div>
                  ) : getLeaderboardData().length === 0 ? (
                    <div className="text-center py-8 min-h-[200px] flex items-center justify-center">
                      <p className="text-foreground/70">No leaderboard data available yet.</p>
                    </div>
                  ) : (
                    getLeaderboardData().map((player) => (
                      <div 
                        key={player.rank}
                        className={`leaderboard-row flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 rounded-lg transition-all duration-300 hover:bg-muted/20 overflow-hidden ${
                          player.rank <= 3 ? 'glass glow-primary' : 'bg-muted/10'
                        }`}
                      >
                        <div className="flex items-center space-x-4 min-w-0 flex-1">
                          {/* Rank */}
                          <div className="flex items-center justify-center w-10 h-10">
                            {getRankIcon(player.rank)}
                          </div>

                          {/* Avatar & Info */}
                          <div className="flex items-center space-x-3 min-w-0">
                            <Avatar className="h-12 w-12 border-2 border-primary/30">
                              <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold">
                                {player.username.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-semibold flex items-center space-x-2 min-w-0">
                                <span className="truncate">{player.username}</span>
                                {player.badge && (
                                  <Badge variant="outline" className="text-xs shrink-0">
                                    {player.badge}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-foreground/70 truncate">
                                {player.matches} matches • {player.winRate}% win rate
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Earnings */}
                        <div className="text-left sm:text-right w-full sm:w-auto sm:flex-none">
                          <div className="text-base sm:text-lg font-bold text-primary sm:max-w-[16ch] sm:truncate">
                            {player.earnings}
                          </div>
                          <div className="text-xs text-foreground/50">
                            Total Earnings
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6 text-center">
                  <Button variant="outline" className="glass-button" onClick={handleViewFullLeaderboard}>
                    View Full Leaderboard
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Side Stats */}
          <div className="space-y-6">
            {/* Weekly Champion */}
            {globalLeaderboard.length > 0 && (
              <Card className="glass-card glow-primary">
                <div className="p-6 text-center">
                  <Crown className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                  <h4 className="font-bold mb-2">Top Player</h4>
                  <div className="text-2xl font-bold text-primary mb-1">
                    {globalLeaderboard[0]?.username || 'No Data'}
                  </div>
                  <div className="text-sm text-foreground/70 mb-4">
                    {globalLeaderboard[0] ? `${Math.round(globalLeaderboard[0].win_rate)}% Win Rate • ₦${globalLeaderboard[0].total_earnings.toLocaleString()}` : 'No data available'}
                  </div>
                  <Badge className="bg-gradient-to-r from-primary to-accent">
                    🏆 Current Leader
                  </Badge>
                </div>
              </Card>
            )}

            {/* Quick Stats - Admin only */}
            {isAdmin && (
              <Card className="glass-card">
                <div className="p-6">
                  <h4 className="font-bold mb-4">Platform Stats</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Total Players:</span>
                      <span className="font-semibold">
                        {globalLeaderboard.length > 0 ? globalLeaderboard.length : '0'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Total Matches:</span>
                      <span className="font-semibold text-primary">
                        {globalLeaderboard.reduce((sum, player) => sum + player.total_matches, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Total Winnings:</span>
                      <span className="font-semibold text-success">
                        ₦{globalLeaderboard.reduce((sum, player) => sum + player.total_earnings, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Active Players:</span>
                      <span className="font-semibold text-accent">
                        {globalLeaderboard.filter(player => player.total_matches > 0).length}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <div className="glass-card max-w-2xl mx-auto p-8">
            <h3 className="text-2xl font-bold mb-4">
              Climb the Ranks
            </h3>
            <p className="text-foreground/70 mb-6">
              Every match counts towards your position on the leaderboard. 
              Start winning today and see your name among the legends.
            </p>
            <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary" onClick={handleStartCompeting}>
              <TrendingUp className="mr-2 h-5 w-5" />
              Start Competing
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeaderboardsSection;