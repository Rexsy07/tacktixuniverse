import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Gamepad2, Trophy, Wallet, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminFees } from "@/hooks/useAdminData";

interface DailyMetric { date: string; value: number }
interface GameRow { name: string; matches: number; percent: number }
interface UserRow { user_id: string; username: string; matches: number }
interface FeeRow { id: string; match_id: string; fee_amount: number; created_at: string }

const currency = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' });

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'games' | 'users' | 'revenue'>('overview');

  const [metrics, setMetrics] = useState({
    activeUsers: 0,
    matchesToday: 0,
    revenue: 0,
    activeTournaments: 0
  });

  const [gameRows, setGameRows] = useState<GameRow[]>([]);
  const [overviewMatches7d, setOverviewMatches7d] = useState<DailyMetric[]>([]);
  const [overviewSignups7d, setOverviewSignups7d] = useState<DailyMetric[]>([]);
  const [overviewRevenue7d, setOverviewRevenue7d] = useState<DailyMetric[]>([]);
  const [topUsers, setTopUsers] = useState<UserRow[]>([]);
  const [recentFees, setRecentFees] = useState<FeeRow[]>([]);
  const { fees } = useAdminFees();
  const [tournamentRevenue, setTournamentRevenue] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      try {
        // Active users (last 24h appearing in matches)
        const since = new Date();
        since.setDate(since.getDate() - 1);
        const { data: recent } = await supabase
          .from('matches')
          .select('creator_id, opponent_id, created_at')
          .gte('created_at', since.toISOString());
        const activeSet = new Set<string>();
        (recent || []).forEach((m: any) => {
          if (m.creator_id) activeSet.add(m.creator_id);
          if (m.opponent_id) activeSet.add(m.opponent_id);
        });

        // Matches today
        const todayStr = new Date().toISOString().split('T')[0];
        const { count: matchesToday } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${todayStr}T00:00:00.000Z`);

        // Revenue will be sourced from fees hook (lifetime)
        const revenue = 0; // initialize; will be overwritten below via fees effect

        // Active tournaments
        const { count: activeTournaments } = await supabase
          .from('tournaments')
          .select('*', { count: 'exact', head: true })
          .neq('status', 'completed');

        setMetrics({
          activeUsers: activeSet.size,
          matchesToday: matchesToday || 0,
          revenue,
          activeTournaments: activeTournaments || 0
        });

        // Game popularity breakdown (last 30 days matches by game)
        const since30 = new Date();
        since30.setDate(since30.getDate() - 30);
        const { data: matches30 } = await supabase
          .from('matches')
          .select('game_id, games(name)')
          .gte('created_at', since30.toISOString());
        const byGame = new Map<string, { name: string; count: number }>();
        (matches30 || []).forEach((m: any) => {
          const name = m.games?.name || 'Unknown';
          const v = byGame.get(m.game_id) || { name, count: 0 };
          v.count += 1;
          byGame.set(m.game_id, v);
        });
        const total = Array.from(byGame.values()).reduce((s, v) => s + v.count, 0) || 1;
        const breakdown = Array.from(byGame.values())
          .map(v => ({ name: v.name, matches: v.count, percent: Math.round((v.count / total) * 100) }))
          .sort((a, b) => b.matches - a.matches);
        setGameRows(breakdown);

        // Overview 7d: matches per day
        const start7 = new Date();
        start7.setDate(start7.getDate() - 6); // include today
        const { data: last7Matches } = await supabase
          .from('matches')
          .select('created_at')
          .gte('created_at', new Date(start7.toISOString().split('T')[0] + 'T00:00:00.000Z').toISOString());
        const perDayMatches = aggregateByDay(last7Matches || [], 'created_at');
        setOverviewMatches7d(perDayMatches);

        // Overview 7d: signups per day (profiles.created_at)
        const { data: last7Profiles } = await supabase
          .from('profiles')
          .select('created_at')
          .gte('created_at', new Date(start7.toISOString().split('T')[0] + 'T00:00:00.000Z').toISOString());
        const perDaySignups = aggregateByDay(last7Profiles || [], 'created_at');
        setOverviewSignups7d(perDaySignups);

        // Overview 7d: revenue per day
        try {
          const { data: last7Fees, error: feesErr } = await supabase
            .from('platform_fees')
            .select('fee_amount, created_at')
            .gte('created_at', new Date(start7.toISOString().split('T')[0] + 'T00:00:00.000Z').toISOString());
          if (feesErr && (feesErr as any).code !== 'PGRST205') throw feesErr;
          const perDayRevenue = aggregateByDay(last7Fees || [], 'created_at', 'fee_amount');
          setOverviewRevenue7d(perDayRevenue);
        } catch (_) {
          setOverviewRevenue7d(buildEmpty7d());
        }

        // Users tab: top users (by matches in last 30d)
        const { data: monthMatches } = await supabase
          .from('matches')
          .select('creator_id, opponent_id, created_at')
          .gte('created_at', since30.toISOString());
        const counts = new Map<string, number>();
        (monthMatches || []).forEach((m: any) => {
          if (m.creator_id) counts.set(m.creator_id, (counts.get(m.creator_id) || 0) + 1);
          if (m.opponent_id) counts.set(m.opponent_id, (counts.get(m.opponent_id) || 0) + 1);
        });
        const topIds = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([id]) => id);
        let profilesById = new Map<string, any>();
        if (topIds.length) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, username')
            .in('user_id', topIds);
          profilesById = new Map((profiles || []).map((p: any) => [p.user_id, p]));
        }
        setTopUsers(topIds.map((id) => ({ user_id: id, username: profilesById.get(id)?.username || 'Unknown', matches: counts.get(id) || 0 })));

        // Revenue tab: recent fees
        try {
          const { data: recent, error: recentErr } = await supabase
            .from('platform_fees')
            .select('id, match_id, fee_amount, created_at')
            .order('created_at', { ascending: false })
            .limit(50);
          if (recentErr && (recentErr as any).code !== 'PGRST205') throw recentErr;
          setRecentFees(recent || []);
        } catch (_) {
          setRecentFees([]);
        }
      } catch (e: any) {
        toast.error(e.message || 'Failed to load analytics');
      }
    };
    load();
  }, []);

  // Fetch tournament revenue lifetime (admin RPC), fallback to client-side computation
  useEffect(() => {
    const fetchTR = async () => {
      // First try RPC
      try {
        const { data, error } = await supabase.rpc('admin_tournament_revenue_lifetime');
        if (!error) {
          const val = Number(data || 0);
          if (val > 0) {
            setTournamentRevenue(val);
            return;
          }
        }
      } catch (_) {}

      // Fallback: compute from tournaments and participants
      try {
        const { data: tournaments, error: tErr } = await supabase
          .from('tournaments')
          .select('id, entry_fee, prize_pool, current_participants');
        if (tErr || !tournaments) {
          setTournamentRevenue(0);
          return;
        }
        const ids = tournaments.map((t: any) => t.id);
        let partCounts = new Map<string, number>();
        if (ids.length > 0) {
          const { data: parts, error: pErr } = await supabase
            .from('tournament_participants')
            .select('tournament_id')
            .in('tournament_id', ids);
          if (!pErr && parts) {
            parts.forEach((p: any) => {
              partCounts.set(p.tournament_id, (partCounts.get(p.tournament_id) || 0) + 1);
            });
          }
        }
        const sum = (tournaments || []).reduce((acc: number, t: any) => {
          const participants = Number(t.current_participants ?? partCounts.get(t.id) ?? 0) || 0;
          const entry = Number(t.entry_fee || 0) || 0;
          const pool = Number(t.prize_pool || 0) || 0;
          const rev = Math.max(0, participants * entry - pool);
          return acc + rev;
        }, 0);
        setTournamentRevenue(sum);
      } catch {
        setTournamentRevenue(0);
      }
    };
    fetchTR();
  }, []);

  // Keep revenue metric in sync with platform fees + tournament revenue
  useEffect(() => {
    const pf = Number(fees?.lifetime || 0);
    const tr = Number(tournamentRevenue || 0);
    setMetrics((m) => ({ ...m, revenue: pf + tr }));
  }, [fees?.lifetime, tournamentRevenue]);

  const handleExportReport = () => {
    try {
      let filename = 'analytics.csv';
      let rows: string[][] = [];

      if (activeTab === 'overview') {
        rows.push(['Date', 'Matches', 'Signups', 'Revenue (NGN)']);
        const map: Record<string, { m: number; u: number; r: number }> = {};
        overviewMatches7d.forEach(d => { map[d.date] = { ...(map[d.date]||{m:0,u:0,r:0}), m: d.value }; });
        overviewSignups7d.forEach(d => { map[d.date] = { ...(map[d.date]||{m:0,u:0,r:0}), u: d.value }; });
        overviewRevenue7d.forEach(d => { map[d.date] = { ...(map[d.date]||{m:0,u:0,r:0}), r: d.value }; });
        Object.keys(map).sort().forEach(date => rows.push([date, String(map[date].m), String(map[date].u), String(map[date].r)]));
        filename = 'overview_7d.csv';
      } else if (activeTab === 'games') {
        rows.push(['Game', 'Matches', 'Share %']);
        gameRows.forEach(g => rows.push([g.name, String(g.matches), String(g.percent)]));
        filename = 'games.csv';
      } else if (activeTab === 'users') {
        rows.push(['User', 'Matches']);
        topUsers.forEach(u => rows.push([u.username, String(u.matches)]));
        filename = 'top_users.csv';
      } else if (activeTab === 'revenue') {
        // Export both summary numbers and recent fees
        rows.push(['Metric', 'Amount']);
        rows.push(['Platform Fees (Lifetime)', String(fees?.lifetime || 0)]);
        rows.push(['Tournament Revenue (Lifetime)', String(tournamentRevenue || 0)]);
        rows.push(['Combined Revenue (Lifetime)', String((fees?.lifetime || 0) + (tournamentRevenue || 0))]);
        rows.push([]);
        rows.push(['Recent ID', 'Match ID', 'Fee Amount', 'Created At']);
        recentFees.forEach(f => rows.push([f.id, f.match_id, String(f.fee_amount), f.created_at]));
        filename = 'revenue_summary_and_recent.csv';
      }

      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("CSV exported");
    } catch (e: any) {
      toast.error(e.message || 'Failed to export');
    }
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
              Export CSV
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
                <div className="text-2xl font-bold">{metrics.activeUsers.toLocaleString()}</div>
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
                <div className="text-2xl font-bold">{metrics.matchesToday.toLocaleString()}</div>
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
                <div className="text-2xl font-bold">{currency.format(metrics.revenue)}</div>
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
                <div className="text-2xl font-bold">{metrics.activeTournaments}</div>
                <div className="text-sm text-muted-foreground">
                  Active tournaments
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
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
                    <CardTitle>Match Activity (7 days)</CardTitle>
                    <CardDescription>Matches per day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Matches</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {overviewMatches7d.map(row => (
                          <TableRow key={`m-${row.date}`}>
                            <TableCell>{row.date}</TableCell>
                            <TableCell className="text-right">{row.value}</TableCell>
                          </TableRow>
                        ))}
                        {overviewMatches7d.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground">No data</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Growth (7 days)</CardTitle>
                    <CardDescription>New registrations per day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Signups</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {overviewSignups7d.map(row => (
                          <TableRow key={`u-${row.date}`}>
                            <TableCell>{row.date}</TableCell>
                            <TableCell className="text-right">{row.value}</TableCell>
                          </TableRow>
                        ))}
                        {overviewSignups7d.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground">No data</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue (7 days)</CardTitle>
                  <CardDescription>Platform fees per day</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overviewRevenue7d.map(row => (
                        <TableRow key={`r-${row.date}`}>
                          <TableCell>{row.date}</TableCell>
                          <TableCell className="text-right">{currency.format(row.value)}</TableCell>
                        </TableRow>
                      ))}
                      {overviewRevenue7d.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground">No data</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="games" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Game Popularity</CardTitle>
                  <CardDescription>Matches by game (last 30 days)</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Game</TableHead>
                        <TableHead className="text-right">Matches</TableHead>
                        <TableHead className="text-right">Share %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gameRows.map((g) => (
                        <TableRow key={g.name}>
                          <TableCell>{g.name}</TableCell>
                          <TableCell className="text-right">{g.matches}</TableCell>
                          <TableCell className="text-right">{g.percent}%</TableCell>
                        </TableRow>
                      ))}
                      {gameRows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">No data</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Users</CardTitle>
                  <CardDescription>Most active players by matches (last 30 days)</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead className="text-right">Matches</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topUsers.map((u) => (
                        <TableRow key={u.user_id}>
                          <TableCell>{u.username}</TableCell>
                          <TableCell className="text-right">{u.matches}</TableCell>
                        </TableRow>
                      ))}
                      {topUsers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground">No data</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6">
              {/* Fee summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <div className="p-4 text-center">
                    <div className="text-xs text-muted-foreground">Tournament Revenue (Lifetime)</div>
                    <div className="text-2xl font-bold">{currency.format(tournamentRevenue || 0)}</div>
                  </div>
                </Card>
                <Card>
                  <div className="p-4 text-center">
                    <div className="text-xs text-muted-foreground">Fees Today</div>
                    <div className="text-2xl font-bold">{currency.format(fees.today || 0)}</div>
                  </div>
                </Card>
                <Card>
                  <div className="p-4 text-center">
                    <div className="text-xs text-muted-foreground">Fees Last 30 Days</div>
                    <div className="text-2xl font-bold">{currency.format(fees.last30Days || 0)}</div>
                  </div>
                </Card>
                <Card>
                  <div className="p-4 text-center">
                    <div className="text-xs text-muted-foreground">Lifetime Fees</div>
                    <div className="text-2xl font-bold">{currency.format(fees.lifetime || 0)}</div>
                  </div>
                </Card>
                <Card>
                  <div className="p-4 text-center">
                    <div className="text-xs text-muted-foreground">Recent Entries</div>
                    <div className="text-2xl font-bold">{fees.recent?.length || 0}</div>
                  </div>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Platform Fees</CardTitle>
                  <CardDescription>Most recent fee entries</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Match</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentFees.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="font-mono text-xs">{f.id}</TableCell>
                          <TableCell className="font-mono text-xs">{f.match_id}</TableCell>
                          <TableCell className="text-right">{currency.format(f.fee_amount)}</TableCell>
                          <TableCell className="text-right">{new Date(f.created_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      {recentFees.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">No data</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                    <TableCaption>Showing up to 50 most recent entries.</TableCaption>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

function aggregateByDay(rows: any[], tsField: string, valueField?: string): DailyMetric[] {
  const map = new Map<string, number>();
  const today = new Date();
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push(key);
    map.set(key, 0);
  }
  rows.forEach((r: any) => {
    const key = new Date(r[tsField]).toISOString().split('T')[0];
    if (!map.has(key)) return;
    const inc = valueField ? (r[valueField] || 0) : 1;
    map.set(key, (map.get(key) || 0) + inc);
  });
  return days.map((d) => ({ date: d, value: map.get(d) || 0 }));
}

function buildEmpty7d(): DailyMetric[] {
  const today = new Date();
  const days: DailyMetric[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push({ date: key, value: 0 });
  }
  return days;
}

export default AdminAnalytics;
