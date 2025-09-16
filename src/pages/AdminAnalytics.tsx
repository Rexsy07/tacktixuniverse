import { useNavigate } from "react-router-dom";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Users, Gamepad2, Trophy, Wallet, Download } from "lucide-react";
import { toast } from "sonner";

const AdminAnalytics = () => {
  const navigate = useNavigate();

  const handleExportReport = () => {
    toast.success("Analytics report exported successfully");
  };
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 ml-64 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Platform performance and insights</p>
            </div>
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-green-600">+12.5%</span>
                  <span className="text-muted-foreground ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Gamepad2 className="h-4 w-4 mr-2" />
                  Matches Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89</div>
                <div className="flex items-center text-sm">
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  <span className="text-red-600">-3.2%</span>
                  <span className="text-muted-foreground ml-1">from yesterday</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Wallet className="h-4 w-4 mr-2" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦45.6k</div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-green-600">+8.7%</span>
                  <span className="text-muted-foreground ml-1">this week</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Trophy className="h-4 w-4 mr-2" />
                  Tournaments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <div className="text-sm text-muted-foreground">
                  Active tournaments
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="games">Games</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Match Activity</CardTitle>
                    <CardDescription>Matches per day over the last 7 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Chart placeholder - Match activity graph</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                    <CardDescription>New registrations over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Chart placeholder - User growth graph</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="games" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Game Popularity</CardTitle>
                  <CardDescription>Matches by game type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Call of Duty Mobile</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }}></div>
                        </div>
                        <span className="text-sm text-muted-foreground">65%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>PUBG Mobile</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                        <span className="text-sm text-muted-foreground">45%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Free Fire</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: '35%' }}></div>
                        </div>
                        <span className="text-sm text-muted-foreground">35%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>EA FC Mobile</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: '25%' }}></div>
                        </div>
                        <span className="text-sm text-muted-foreground">25%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Demographics</CardTitle>
                    <CardDescription>Age and location breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Chart placeholder - Demographics pie chart</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Performers</CardTitle>
                    <CardDescription>Most active players this month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {["ProGamer123", "ElitePlayer", "ChampionX", "MasterZ", "LegendKing"].map((player, index) => (
                        <div key={player} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">#{index + 1}</span>
                            <span>{player}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{45 - index * 3} matches</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                  <CardDescription>Platform commission and fees</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-green-600">₦32.1k</div>
                      <p className="text-sm text-muted-foreground">Match Fees</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">₦8.7k</div>
                      <p className="text-sm text-muted-foreground">Tournament Entry</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">₦4.8k</div>
                      <p className="text-sm text-muted-foreground">Premium Features</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminAnalytics;