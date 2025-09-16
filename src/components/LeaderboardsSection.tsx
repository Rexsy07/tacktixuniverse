import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, Award, TrendingUp, Users, Crown } from "lucide-react";

interface Player {
  rank: number;
  username: string;
  earnings: string;
  matches: number;
  winRate: number;
  game?: string;
  badge?: string;
}

const LeaderboardsSection = () => {
  const [activeTab, setActiveTab] = useState('global');

  const globalLeaders: Player[] = [
    {
      rank: 1,
      username: "NaijaKing",
      earnings: "₦847,500",
      matches: 156,
      winRate: 89,
      badge: "🏆 Champion"
    },
    {
      rank: 2,
      username: "LagosLegend",
      earnings: "₦623,200",
      matches: 134,
      winRate: 85,
      badge: "💎 Elite"
    },
    {
      rank: 3,
      username: "AbujaMaster",
      earnings: "₦578,900",
      matches: 142,
      winRate: 82,
      badge: "⚡ Pro"
    },
    {
      rank: 4,
      username: "KanoChampion",
      earnings: "₦445,600",
      matches: 98,
      winRate: 87,
    },
    {
      rank: 5,
      username: "IbadanAce",
      earnings: "₦398,750",
      matches: 89,
      winRate: 79,
    }
  ];

  const codmLeaders: Player[] = [
    {
      rank: 1,
      username: "SniperKing9ja",
      earnings: "₦324,500",
      matches: 78,
      winRate: 92,
      game: "CODM"
    },
    {
      rank: 2,
      username: "TacticalMaster",
      earnings: "₦298,750",
      matches: 65,
      winRate: 88,
      game: "CODM"
    },
    {
      rank: 3,
      username: "RushWarrior",
      earnings: "₦267,300",
      matches: 89,
      winRate: 84,
      game: "CODM"
    }
  ];

  const pubgLeaders: Player[] = [
    {
      rank: 1,
      username: "ChickenDinner",
      earnings: "₦445,200",
      matches: 56,
      winRate: 86,
      game: "PUBG"
    },
    {
      rank: 2,
      username: "SquadLeader",
      earnings: "₦378,600",
      matches: 48,
      winRate: 83,
      game: "PUBG"
    },
    {
      rank: 3,
      username: "BattleRoyale",
      earnings: "₦334,900",
      matches: 67,
      winRate: 79,
      game: "PUBG"
    }
  ];

  const getLeaderboardData = () => {
    switch (activeTab) {
      case 'codm': return codmLeaders;
      case 'pubg': return pubgLeaders;
      default: return globalLeaders;
    }
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
    { id: 'codm', name: 'CODM', icon: TrendingUp },
    { id: 'pubg', name: 'PUBG', icon: Users },
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
          <div className="glass-card p-2 flex gap-2">
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
                  <span>{tab.name}</span>
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
                    {activeTab === 'global' ? 'Top Earners This Month' : 
                     activeTab === 'codm' ? 'CODM Champions' : 'PUBG Masters'}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    Updated Live
                  </Badge>
                </div>

                <div className="space-y-4">
                  {getLeaderboardData().map((player) => (
                    <div 
                      key={player.rank}
                      className={`flex items-center justify-between p-4 rounded-lg transition-all duration-300 hover:bg-muted/20 ${
                        player.rank <= 3 ? 'glass glow-primary' : 'bg-muted/10'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        {/* Rank */}
                        <div className="flex items-center justify-center w-10 h-10">
                          {getRankIcon(player.rank)}
                        </div>

                        {/* Avatar & Info */}
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12 border-2 border-primary/30">
                            <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold">
                              {player.username.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold flex items-center space-x-2">
                              <span>{player.username}</span>
                              {player.badge && (
                                <Badge variant="outline" className="text-xs">
                                  {player.badge}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-foreground/70">
                              {player.matches} matches • {player.winRate}% win rate
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Earnings */}
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {player.earnings}
                        </div>
                        <div className="text-xs text-foreground/50">
                          Total Earnings
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <Button variant="outline" className="glass-button">
                    View Full Leaderboard
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Side Stats */}
          <div className="space-y-6">
            {/* Weekly Champion */}
            <Card className="glass-card glow-primary">
              <div className="p-6 text-center">
                <Crown className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                <h4 className="font-bold mb-2">Weekly Champion</h4>
                <div className="text-2xl font-bold text-primary mb-1">NaijaKing</div>
                <div className="text-sm text-foreground/70 mb-4">
                  89% Win Rate • ₦125,400 This Week
                </div>
                <Badge className="bg-gradient-to-r from-primary to-accent">
                  🏆 Undefeated Streak: 15
                </Badge>
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="glass-card">
              <div className="p-6">
                <h4 className="font-bold mb-4">Platform Stats</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-foreground/70">Total Players:</span>
                    <span className="font-semibold">12,547</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/70">Matches Today:</span>
                    <span className="font-semibold text-primary">1,834</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/70">Winnings Paid:</span>
                    <span className="font-semibold text-success">₦2.4M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/70">Active Now:</span>
                    <span className="font-semibold text-accent">456</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Achievements */}
            <Card className="glass-card">
              <div className="p-6">
                <h4 className="font-bold mb-4">Latest Achievements</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-yellow-500 text-yellow-900">🏆</Badge>
                    <span className="text-foreground/70">
                      <strong>SniperKing9ja</strong> earned "Sharpshooter"
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-purple-500 text-purple-900">💎</Badge>
                    <span className="text-foreground/70">
                      <strong>LagosLegend</strong> hit 100 wins
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-blue-500 text-blue-900">⚡</Badge>
                    <span className="text-foreground/70">
                      <strong>AbujaMaster</strong> won 10 in a row
                    </span>
                  </div>
                </div>
              </div>
            </Card>
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
            <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary">
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