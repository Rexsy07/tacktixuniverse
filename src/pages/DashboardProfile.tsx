import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Edit, Trophy, Target, Star, 
  Gamepad2, TrendingUp, Calendar, Award 
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useProfile } from "@/hooks/useProfile";
import { useGames } from "@/hooks/useGames";
import { useMatches } from "@/hooks/useMatches";

const DashboardProfile = () => {
  const [editMode, setEditMode] = useState(false);
  const { 
    profile, 
    stats, 
    loading, 
    updateProfile 
  } = useProfile();
  const { games } = useGames();
  const { matches } = useMatches();

  // Local state for form inputs
  const [profileForm, setProfileForm] = useState({
    username: profile?.username || "",
    full_name: profile?.full_name || "",
    avatar_url: profile?.avatar_url || ""
  });

  // Update form when profile loads
  useState(() => {
    if (profile) {
      setProfileForm({
        username: profile.username || "",
        full_name: profile.full_name || "",
        avatar_url: profile.avatar_url || ""
      });
    }
  });

  const achievements = [
    { id: 1, name: "First Victory", description: "Won your first match", icon: Trophy, earned: (stats?.total_wins || 0) >= 1 },
    { id: 2, name: "Winning Streak", description: "Won 5 matches in a row", icon: Target, earned: (stats?.longest_win_streak || 0) >= 5 },
    { id: 3, name: "Top Earner", description: "Earned ₦10,000 in total", icon: Star, earned: (stats?.total_earnings || 0) >= 10000 },
    { id: 4, name: "Tournament Champion", description: "Won a tournament", icon: Award, earned: (stats?.tournaments_won || 0) > 0 },
    { id: 5, name: "Legendary Player", description: "Reach 100 total wins", icon: TrendingUp, earned: (stats?.total_wins || 0) >= 100 }
  ];

  const recentMatches = matches.slice(0, 5).map(match => ({
    opponent: match.opponent_profile?.username || match.creator_profile?.username || "Unknown",
    game: match.games?.name || "Game",
    result: match.winner_id === profile?.user_id ? "won" : "lost",
    stake: match.stake_amount,
    date: match.completed_at || match.created_at
  }));

  const handleSaveProfile = async () => {
    await updateProfile({
      username: profileForm.username,
      full_name: profileForm.full_name,
      avatar_url: profileForm.avatar_url
    });
    setEditMode(false);
  };

  if (loading) {
    return (
      <DashboardLayout title="Profile" description="Loading your profile...">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const winRate = stats?.total_matches ? Math.round((stats.total_wins / stats.total_matches) * 100) : 0;

  return (
    <DashboardLayout 
      title="Profile"
      description="Manage your account settings and view your gaming statistics"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div>
          <Card className="glass-card">
            <div className="p-6 text-center">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center mb-4">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-white" />
                )}
              </div>
              
              <h2 className="text-xl font-bold mb-2">{profile?.username || "Anonymous"}</h2>
              <Badge variant="secondary" className="mb-4">
                Rank #{stats?.current_rank || "Unranked"} Global
              </Badge>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{winRate}%</div>
                  <div className="text-sm text-foreground/70">Win Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">₦{(stats?.total_earnings || 0).toLocaleString()}</div>
                  <div className="text-sm text-foreground/70">Total Earnings</div>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setEditMode(!editMode)}
              >
                <Edit className="mr-2 h-4 w-4" />
                {editMode ? "Cancel Edit" : "Edit Profile"}
              </Button>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="glass-card mt-6">
            <div className="p-6">
              <h3 className="font-bold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-foreground/70">Total Matches:</span>
                  <span className="font-semibold">{stats?.total_matches || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Wins:</span>
                  <span className="font-semibold text-success">{stats?.total_wins || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Losses:</span>
                  <span className="font-semibold text-destructive">{stats?.total_losses || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Best Streak:</span>
                  <span className="font-semibold">{stats?.longest_win_streak || 0} wins</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3 glass-card">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="history">Match History</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-6">
              <Card className="glass-card">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-6">Profile Information</h3>
                  
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={profileForm.username}
                          onChange={(e) => setProfileForm(prev => ({...prev, username: e.target.value}))}
                          disabled={!editMode}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="full_name">Display Name</Label>
                        <Input
                          id="full_name"
                          value={profileForm.full_name}
                          onChange={(e) => setProfileForm(prev => ({...prev, full_name: e.target.value}))}
                          disabled={!editMode}
                        />
                      </div>
                    </div>
                    
                    {editMode && (
                      <Button type="submit" className="bg-gradient-to-r from-primary to-accent">
                        Save Changes
                      </Button>
                    )}
                  </form>
                </div>
              </Card>
            </TabsContent>


            {/* Achievements Tab */}
            <TabsContent value="achievements" className="mt-6">
              <Card className="glass-card">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-6">Achievements</h3>
                  
                  <div className="app-grid">
                    {achievements.map((achievement) => {
                      const Icon = achievement.icon;
                      return (
                        <div key={achievement.id} className={`p-4 rounded-lg border ${
                          achievement.earned 
                            ? 'border-primary bg-primary/5' 
                            : 'border-muted bg-muted/5'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              achievement.earned ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            }`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{achievement.name}</h4>
                              <p className="text-sm text-foreground/70">{achievement.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Match History Tab */}
            <TabsContent value="history" className="mt-6">
              <Card className="glass-card">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-6">Recent Match History</h3>
                  
                  <div className="space-y-3">
                    {recentMatches.length === 0 ? (
                      <div className="text-center py-8">
                        <Gamepad2 className="h-12 w-12 mx-auto text-foreground/30 mb-4" />
                        <p className="text-foreground/70">No matches played yet</p>
                      </div>
                    ) : (
                      recentMatches.map((match, index) => (
                        <div key={index} className="glass rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge className={match.result === "won" ? "bg-success" : "bg-destructive"}>
                                {match.result.toUpperCase()}
                              </Badge>
                              <div>
                                <div className="font-semibold">vs {match.opponent}</div>
                                <div className="text-sm text-foreground/70">{match.game}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-primary">
                                {match.result === "won" ? "+" : "-"}₦{match.stake?.toLocaleString()}
                              </div>
                              <div className="text-xs text-foreground/60">
                                {new Date(match.date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardProfile;