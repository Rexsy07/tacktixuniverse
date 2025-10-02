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
import { toast } from "sonner";
import { 
  Download, 
  ExternalLink, 
  History, 
  Link2, 
  PlayCircle, 
  ShieldCheck,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Calculator,
  Eye,
  TrendingUp,
  Edit
} from "lucide-react";
import { validatePlatformUrl, formatMoney as utilFormatMoney, calculateEarnings } from "@/utils/advertiseUtils";

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

// Use utility functions
const formatMoney = utilFormatMoney;
const calcEarnings = (views: number) => calculateEarnings(views, RATE_PER_1000_NGN);

const AdvertiseEarn = () => {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("YouTube");
  const [views, setViews] = useState<number>(0);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [viewsError, setViewsError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editViews, setEditViews] = useState<number>(0);

  const { submissions, loading, error, create, updateViews } = useAdvertiseSubmissions();

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

  // Validation functions
  const validateUrl = (url: string, platform: string) => {
    if (!url.trim()) {
      setUrlError("URL is required");
      return false;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setUrlError("URL must start with http:// or https://");
      return false;
    }
    
    if (!validatePlatformUrl(platform, url)) {
      setUrlError(`Invalid URL for ${platform}. Please check the URL format.`);
      return false;
    }
    
    setUrlError("");
    return true;
  };
  
  const validateViewsCount = (viewCount: number) => {
    if (!Number.isFinite(viewCount) || viewCount < 0) {
      setViewsError("Views must be a positive number");
      return false;
    }
    
    if (viewCount < 100) {
      setViewsError("Videos must have at least 100 views to qualify");
      return false;
    }
    
    setViewsError("");
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedUrl = url.trim();
    const validViews = Number.isFinite(views) ? Math.max(0, Math.floor(views)) : 0;
    
    // Validate inputs
    const isUrlValid = validateUrl(trimmedUrl, platform);
    const isViewsValid = validateViewsCount(validViews);
    
    if (!isUrlValid || !isViewsValid) {
      return;
    }

    setSubmitting(true);
    
    const payload = {
      platform,
      url: trimmedUrl,
      views: validViews,
    };
    
    try {
      await create(payload);
      toast.success("Video submitted successfully! It will be reviewed by our team.");
      setUrl("");
      setViews(0);
    } catch (err) {
      console.error('Failed to submit:', err);
      toast.error("Failed to submit video. Please try again.");
      
      // Fallback to local list only if insert fails (e.g., table not yet created)
      const newItem: Submission = {
        id: crypto.randomUUID(),
        url: payload.url,
        platform: payload.platform,
        views: payload.views,
        createdAt: new Date().toISOString(),
      };
      setSubs((prev) => [newItem, ...prev]);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle inline editing of views
  const handleEditViews = async (submissionId: string, newViews: number) => {
    if (!Number.isFinite(newViews) || newViews < 0) {
      toast.error("Invalid view count");
      return;
    }
    
    try {
      await updateViews(submissionId, newViews);
      toast.success("Views updated successfully!");
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update views:', err);
      toast.error("Failed to update views. Please try again.");
    }
  };
  
  const startEditing = (submission: any) => {
    setEditingId(submission.id);
    setEditViews(submission.views);
  };
  
  const cancelEditing = () => {
    setEditingId(null);
    setEditViews(0);
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
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Earnings Summary
              </CardTitle>
              <CardDescription>Track your total views and estimated earnings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading && submissions.length === 0 ? (
                <div className="space-y-3">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                    <div className="h-8 bg-muted rounded w-32"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                    <div className="h-8 bg-muted rounded w-40"></div>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Total Views
                    </div>
                    <div className="text-2xl font-semibold">{totalViews.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Estimated Earnings
                    </div>
                    <div className="text-2xl font-semibold text-green-600">{formatMoney(totalEarnings)}</div>
                  </div>
                  
                  {/* Status breakdown */}
                  {submissions.length > 0 && (
                    <div className="border-t pt-3">
                      <div className="text-sm font-medium mb-2">Submission Status</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span>Pending: {submissions.filter(s => s.status === 'pending').length}</span>
                          </div>
                        </div>
                        <div className="text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Approved: {submissions.filter(s => s.status === 'approved').length}</span>
                          </div>
                        </div>
                        <div className="text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Paid: {submissions.filter(s => s.status === 'paid').length}</span>
                          </div>
                        </div>
                        <div className="text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>Rejected: {submissions.filter(s => s.status === 'rejected').length}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              <div className="text-xs text-muted-foreground border-t pt-3">
                ℹ️ Estimates based on {formatMoney(RATE_PER_1000_NGN)} per 1,000 views. Final payouts occur weekly after verification.
              </div>
              
              {totalEarnings > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Great work! You've earned {formatMoney(totalEarnings)} so far.
                    </span>
                  </div>
                  <Link 
                    to="/advertise-payments" 
                    className="text-xs text-green-600 hover:underline mt-1 block"
                  >
                    View payment history →
                  </Link>
                </div>
              )}
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
                    onChange={(e) => {
                      setPlatform(e.target.value);
                      if (url) validateUrl(url, e.target.value);
                    }}
                    disabled={submitting}
                  >
                    <option value="YouTube">YouTube</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="X">X (Twitter)</option>
                    <option value="Snapchat">Snapchat</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="url">Video URL</Label>
                  <Input
                    id="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (e.target.value) validateUrl(e.target.value, platform);
                      else setUrlError("");
                    }}
                    className={urlError ? "border-red-500" : ""}
                    disabled={submitting}
                    required
                  />
                  {urlError && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {urlError}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Paste the public link to your video (make sure it's accessible to everyone)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="views">Current Views</Label>
                  <div className="relative">
                    <Input
                      id="views"
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={Number.isFinite(views) ? views : ""}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setViews(val);
                        if (e.target.value) validateViewsCount(val);
                        else setViewsError("");
                      }}
                      placeholder="e.g. 12000"
                      className={viewsError ? "border-red-500" : ""}
                      disabled={submitting}
                    />
                    <Eye className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                  {viewsError && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {viewsError}
                    </div>
                  )}
                  {views > 0 && !viewsError && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Calculator className="h-4 w-4" />
                      Estimated earnings: <strong>{formatMoney(calcEarnings(views))}</strong>
                    </div>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitting || !!urlError || !!viewsError || !url.trim() || views <= 0}
                >
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {submitting ? "Submitting..." : "Submit Video"}
                </Button>
                
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    ✓ Your submissions will be reviewed by our team within 24-48 hours<br/>
                    ✓ Update view counts weekly for accurate payouts<br/>
                    ✓ Payouts are processed every Monday for approved videos
                  </p>
                  <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <Link 
                      to="/advertise-payments" 
                      className="text-sm text-blue-600 hover:underline font-medium"
                    >
                      View your payment history →
                    </Link>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Uploads</CardTitle>
                  <CardDescription>History of your submitted promotional videos.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.reload()}
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {merged.length === 0 ? (
                <div className="text-center py-8">
                  <PlayCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No submissions yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Submit your first video using the form on the left to start earning!
                  </p>
                  <div className="text-xs text-muted-foreground">
                    ✓ Create videos about TacktixEdge<br/>
                    ✓ Add our watermark overlay<br/>
                    ✓ Submit and start earning
                  </div>
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
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Earnings</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {merged.map((s) => {
                        const earn = calcEarnings(s.views);
                        const submission = submissions.find(sub => sub.id === s.id);
                        const status = submission?.status || 'pending';
                        const isEditing = editingId === s.id;
                        
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="whitespace-nowrap">
                              {new Date(s.createdAt).toLocaleDateString()}
                              <div className="text-xs text-muted-foreground">
                                {relativeTime(s.createdAt)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{s.platform}</Badge>
                            </TableCell>
                            <TableCell className="max-w-[280px]">
                              <a 
                                href={s.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex items-center text-primary hover:underline"
                                title={s.url}
                              >
                                <Link2 className="h-4 w-4 mr-1 flex-shrink-0" />
                                <span className="truncate inline-block align-middle max-w-[240px]">
                                  {s.url}
                                </span>
                                <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                              </a>
                            </TableCell>
                            <TableCell className="text-right">
                              {isEditing ? (
                                <div className="flex items-center gap-2 justify-end">
                                  <Input
                                    type="number"
                                    min={0}
                                    value={editViews}
                                    onChange={(e) => setEditViews(Number(e.target.value))}
                                    className="w-24 h-8"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleEditViews(s.id, editViews);
                                      } else if (e.key === 'Escape') {
                                        cancelEditing();
                                      }
                                    }}
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditViews(s.id, editViews)}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelEditing}
                                  >
                                    <AlertCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-2">
                                  <span>{s.views.toLocaleString()}</span>
                                  {status === 'pending' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => startEditing(s)}
                                      className="opacity-60 hover:opacity-100"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  status === 'approved' ? 'secondary' :
                                  status === 'rejected' ? 'destructive' :
                                  status === 'paid' ? 'default' : 'outline'
                                }
                                className="capitalize"
                              >
                                {status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="font-medium">
                                {formatMoney(earn)}
                              </div>
                              {earn > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  ₦{(earn / 1000).toFixed(1)}k
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {status === 'rejected' && submission?.review_note && (
                                <div className="group relative">
                                  <AlertCircle className="h-4 w-4 text-red-500 cursor-help" />
                                  <div className="absolute bottom-6 right-0 w-64 p-2 bg-black text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <strong>Rejection reason:</strong><br/>
                                    {submission.review_note}
                                  </div>
                                </div>
                              )}
                            </TableCell>
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