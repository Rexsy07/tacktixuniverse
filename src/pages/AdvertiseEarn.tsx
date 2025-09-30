import { useEffect, useMemo, useState } from "react";
import { useAdvertiseSubmissions } from "@/hooks/useAdvertiseSubmissions";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Download, ExternalLink, History, Link2, PlayCircle, ShieldCheck } from "lucide-react";

// Configurable: payout rate per 1,000 views (NGN). Adjust later or wire to platform settings.
const RATE_PER_1000_NGN = 500;

// Placeholder image path. Replace this file later by adding your watermark image to /public and updating the href/src.
const WATERMARK_IMAGE_PATH = "/watermark-template.png"; // TODO: replace when you add the actual file

// Types
interface Submission {
  id: string;
  url: string;
  platform: string;
  views: number;
  createdAt: string; // ISO date
}

function formatMoney(ngn: number) {
  return `₦${ngn.toLocaleString()}`;
}

function calcEarnings(views: number) {
  // Earnings are paid per 1,000 views
  return Math.floor(views / 1000) * RATE_PER_1000_NGN;
}

const AdvertiseEarn = () => {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("YouTube");
  const [views, setViews] = useState<number>(0);
  const [subs, setSubs] = useState<Submission[]>([]);

  const { submissions, loading, error, create } = useAdvertiseSubmissions();

  // Persist locally per user as a temporary store until backend wiring is added
  const storageKey = useMemo(() => (user ? `ad_submissions:${user.id}` : "ad_submissions:guest"), [user?.id]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setSubs(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(subs));
    } catch {
      // ignore
    }
  }, [subs, storageKey]);

  // Prefer Supabase rows if available; fall back to local state if not loaded yet
  const merged = submissions.length ? submissions.map(s => ({ id: s.id, url: s.url, platform: s.platform, views: s.views, createdAt: s.created_at })) as Submission[] : subs;
  const totalViews = merged.reduce((acc, s) => acc + (s.views || 0), 0);
  const totalEarnings = merged.reduce((acc, s) => acc + calcEarnings(s.views || 0), 0);

  // Simple relative time helper for 'age' display (e.g., '2 days ago')
  function relativeTime(iso: string) {
    try {
      const then = new Date(iso).getTime();
      const now = Date.now();
      const diff = Math.max(0, now - then);
      const secs = Math.floor(diff / 1000);
      const mins = Math.floor(secs / 60);
      const hours = Math.floor(mins / 60);
      const days = Math.floor(hours / 24);
      if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
      if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      if (mins > 0) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
      return `${secs} second${secs !== 1 ? 's' : ''} ago`;
    } catch {
      return '';
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    const payload = {
      platform,
      url: url.trim(),
      views: Number.isFinite(views) ? Math.max(0, Math.floor(views)) : 0,
    };
    try {
      await create(payload);
    } catch (err) {
      // Fallback to local list only if insert fails (e.g., table not yet created)
      const newItem: Submission = {
        id: crypto.randomUUID(),
        url: payload.url,
        platform: payload.platform,
        views: payload.views,
        createdAt: new Date().toISOString(),
      };
      setSubs((prev) => [newItem, ...prev]);
    }
    setUrl("");
    setViews(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container pt-28 pb-12">
        {/* Top: Instructions and Watermark Download */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl">Advertise & Earn</CardTitle>
              <CardDescription>
                Create and post short videos about TacktixEdge on your favorite platforms. Add our watermark to your videos and earn weekly per 1,000 views.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="md:col-span-2">
                  <div className="rounded-lg overflow-hidden border">
                    {/* Placeholder preview - replace the src after you upload your image to /public */}
                    <img src={WATERMARK_IMAGE_PATH} alt="Watermark Template (replace later)" className="w-full h-auto object-contain bg-muted" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Download the watermark image and place it on your video as a visible overlay. Keep it unobstructed and clearly visible for the full duration.
                  </p>
                </div>
                <div className="space-y-3">
                  <Button asChild className="w-full">
                    <a href={WATERMARK_IMAGE_PATH} download>
                      <Download className="h-4 w-4 mr-2" /> Download Watermark
                    </a>
                  </Button>
                  <div className="text-sm space-y-2">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary mt-0.5" />
                      <p>Videos must include the watermark to qualify.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <PlayCircle className="h-4 w-4 text-primary mt-0.5" />
                      <p>Eligible platforms: YouTube, TikTok, Instagram, Facebook, X, Snapchat.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <History className="h-4 w-4 text-primary mt-0.5" />
                      <p>Payouts calculated weekly per 1,000 views: <strong>{formatMoney(RATE_PER_1000_NGN)}</strong>.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Earnings Summary</CardTitle>
              <CardDescription>Track your total views and estimated earnings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Total Views</div>
                <div className="text-2xl font-semibold">{totalViews.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Estimated Earnings</div>
                <div className="text-2xl font-semibold">{formatMoney(totalEarnings)}</div>
              </div>
              <div className="text-xs text-muted-foreground">Estimates based on {formatMoney(RATE_PER_1000_NGN)} per 1,000 views. Final payouts occur weekly after verification.</div>
            </CardContent>
          </Card>
        </div>

        {/* Submission + History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Submit Video</CardTitle>
              <CardDescription>Paste the public link to your video and enter current views.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <select
                    id="platform"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                  >
                    <option>YouTube</option>
                    <option>TikTok</option>
                    <option>Instagram</option>
                    <option>Facebook</option>
                    <option>X</option>
                    <option>Snapchat</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">Video URL</Label>
                  <Input
                    id="url"
                    placeholder="https://..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="views">Current Views</Label>
                  <Input
                    id="views"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={Number.isFinite(views) ? views : 0}
                    onChange={(e) => setViews(Number(e.target.value))}
                    placeholder="e.g. 12000"
                  />
                </div>
                <Button type="submit" className="w-full">Submit</Button>
                <p className="text-xs text-muted-foreground">
                  Your submissions will appear in your history. We recommend updating views weekly for accurate payouts.
                </p>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Your Uploads</CardTitle>
              <CardDescription>History of your submitted promotional videos.</CardDescription>
            </CardHeader>
            <CardContent>
              {merged.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No submissions yet. Paste a video URL on the left to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Video</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">Earnings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {merged.map((s) => {
                        const earn = calcEarnings(s.views);
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="whitespace-nowrap">{new Date(s.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{s.platform}</Badge>
                            </TableCell>
                            <TableCell className="max-w-[280px]">
                              <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center text-primary hover:underline">
                                <Link2 className="h-4 w-4 mr-1" />
                                <span className="truncate inline-block align-middle max-w-[240px]">{s.url}</span>
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </TableCell>
                            <TableCell className="text-right">{s.views.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-medium">{formatMoney(earn)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Helper text */}
        <div className="mt-8 text-xs text-muted-foreground">
          Need help? See <Link to="/support/faq" className="underline">FAQ</Link> or <Link to="/support/contact" className="underline">contact support</Link>.
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdvertiseEarn;