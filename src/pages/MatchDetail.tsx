import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowLeft, Clock, Users, Trophy, Target, 
  Upload, Eye, CheckCircle, XCircle, AlertTriangle,
  Calendar, MapPin, Settings, Coins, Bell
} from "lucide-react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import TeamParticipants from "@/components/TeamParticipants";
import JoinTeamMatch from "@/components/JoinTeamMatch";
import { getFormatDisplayName, isTeamFormat } from "@/utils/gameFormats";
import { useMatchParticipants } from "@/hooks/useMatchParticipants";
import { useMatchPot } from "@/hooks/useMatchPot";

interface MatchDetail {
  id: string;
  creator_id: string;
  opponent_id?: string;
  game_id: string;
  game_mode_id: string;
  format: string;
  map_name?: string;
  stake_amount: number;
  status: string;
  custom_rules?: string;
  duration_minutes?: number;
  winner_id?: string;
  creator_result?: string;
  opponent_result?: string;
  creator_proof_url?: string;
  opponent_proof_url?: string;
  admin_decision?: string;
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  games?: {
    id: string;
    name: string;
    short_name: string;
    description: string;
    cover_image_url?: string;
  };
  game_modes?: {
    id: string;
    name: string;
    description: string;
    formats: string[];
    maps?: string[];
  };
  creator_profile?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  opponent_profile?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

const MatchDetail = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // Load participants to allow team members to mark match as done
  const { participants } = useMatchParticipants(matchId);
  const { pot, contributors, loading: potLoading, refetch: refetchPot } = useMatchPot(matchId);

  useEffect(() => {
    if (matchId) {
      fetchMatchDetails();
    }
  }, [matchId]);

  const fetchMatchDetails = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          games(*),
          game_modes(*)
        `)
        .eq('id', matchId)
        .single();

      if (error) throw error;

      // Fetch creator and opponent profiles
      const userIds = [data.creator_id];
      if (data.opponent_id) userIds.push(data.opponent_id);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      const matchWithProfiles = {
        ...data,
        creator_profile: profiles?.find(p => p.user_id === data.creator_id),
        opponent_profile: data.opponent_id ? profiles?.find(p => p.user_id === data.opponent_id) : null
      };

      setMatch(matchWithProfiles);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching match details:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success";
      case "in_progress": return "bg-destructive";
      case "awaiting_opponent": return "bg-primary";
      case "pending_result": return "bg-warning";
      case "cancelled": return "bg-muted";
      case "disputed": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Completed";
      case "in_progress": return "Live";
      case "awaiting_opponent": return "Waiting for Opponent";
      case "pending_result": return "Pending Result";
      case "cancelled": return "Cancelled";
      case "disputed": return "Disputed";
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />;
      case "in_progress": return <Target className="h-4 w-4" />;
      case "awaiting_opponent": return <Clock className="h-4 w-4" />;
      case "pending_result": return <Upload className="h-4 w-4" />;
      case "cancelled": return <XCircle className="h-4 w-4" />;
      case "disputed": return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const canAcceptChallenge = () => {
    // Only allow accepting for 1v1 matches
    // Team matches use the join team functionality instead
    return match?.status === 'awaiting_opponent' && 
           match?.format === '1v1' &&
           match?.creator_id !== user?.id && 
           !match?.opponent_id;
  };

  const canUploadResult = () => {
    return match?.status === 'in_progress' && 
           (match?.creator_id === user?.id || match?.opponent_id === user?.id);
  };

  const isTeamParticipant = () => {
    if (!user) return false;
    return participants?.some(p => p.user_id === user.id) || false;
  };

  const canMarkDone = () => {
    if (!match || !user) return false;
    const isDirectParticipant = match.creator_id === user.id || match.opponent_id === user.id;
    return match.status === 'in_progress' && (isDirectParticipant || isTeamParticipant());
  };

  const canCancelMatch = () => {
    // Allow creator to cancel before an opponent joins
    return match?.status === 'awaiting_opponent' && match?.creator_id === user?.id;
  };

  const handleCancelMatch = async () => {
    if (!user || !match) return;
    try {
      const { error } = await supabase.rpc('cancel_match_escrow', {
        p_match_id: match.id,
      });
      if (error) throw error;
      toast.success('Match cancelled and funds refunded.');
      fetchMatchDetails();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel match');
    }
  };

  // Sanitize file names for Supabase Storage (avoid spaces/special chars)
  const sanitizeFileName = (name: string) => {
    const parts = name.split('.');
    const ext = parts.length > 1 ? parts.pop() : undefined;
    const base = parts.join('.')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-_.]/g, '');
    return ext ? `${base}.${ext.toLowerCase()}` : base;
  };

  const handleUploadProof = async () => {
    if (!user || !match || !file) return;
    try {
      setUploading(true);

      // Basic client-side validation
      if (file.size === 0) {
        throw new Error('Selected file is empty. Please choose another file.');
      }

      const role = match.creator_id === user.id ? 'creator' : 'opponent';
      const safeName = sanitizeFileName(file.name);
      // Store proofs under a user-specific prefix to satisfy common Storage RLS policies
      // (e.g., name LIKE auth.uid() || '/%'). Also avoid upsert to not require UPDATE privilege.
      const path = `${user.id}/${match.id}-${role}-${Date.now()}-${safeName}`;

      const { data: upload, error: uploadError } = await supabase.storage
        .from('match-proofs')
        .upload(path, file, {
          upsert: false,
          contentType: file.type || 'application/octet-stream',
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      const { data: url } = supabase.storage
        .from('match-proofs')
        .getPublicUrl(upload.path);

      const update: any = role === 'creator'
        ? { creator_proof_url: url.publicUrl }
        : { opponent_proof_url: url.publicUrl };

      // Move to pending_result once any proof is uploaded
      if (match.status === 'in_progress') {
        update.status = 'pending_result';
      }

      const { error: updErr } = await supabase
        .from('matches')
        .update({ ...update, updated_at: new Date().toISOString() })
        .eq('id', match.id);

      if (updErr) throw updErr;

      toast.success('Proof uploaded');
      setFile(null);
      fetchMatchDetails();
    } catch (err: any) {
      console.error('Upload proof error:', err);
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleMarkDone = async () => {
    if (!user || !match) return;
    try {
      // Only allow transition from in_progress to pending_result
      if (match.status !== 'in_progress') return;

      const { error: updErr } = await supabase
        .from('matches')
        .update({ status: 'pending_result', updated_at: new Date().toISOString() })
        .eq('id', match.id);

      if (updErr) throw updErr;

      toast.success('Notified admins. Awaiting winner selection.');
      fetchMatchDetails();
    } catch (err: any) {
      console.error('Error marking match done:', err);
      toast.error(err.message || 'Failed to notify admins');
    }
  };

  const handleAcceptChallenge = async () => {
    if (!user || !match) return;

    try {
      // Accept via RPC which also performs escrow hold on the opponent and updates match
      const { error } = await supabase.rpc('accept_challenge_with_escrow', {
        p_match_id: match.id,
        p_user_id: user.id,
      });

      if (error) throw error;
      
      toast.success('Challenge accepted successfully!');
      fetchMatchDetails(); // Refresh the match data
    } catch (err: any) {
      const raw = err.message || '';
      const msg = raw.includes('INSUFFICIENT_FUNDS')
        ? 'Insufficient balance to accept this challenge.'
        : raw.includes('USER_SUSPENDED')
          ? 'Your account is suspended and cannot accept matches.'
          : (raw || 'Failed to accept challenge');
      toast.error(msg);
      console.error('Error accepting challenge:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground/70">Loading match details...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Match Not Found</h1>
          <p className="text-foreground/70 mb-6">The match you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link to="/matches">
            <Button>Back to Matches</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isCreator = match.creator_id === user?.id;
  const isOpponent = match.opponent_id === user?.id;
  
  // Allow access for:
  // 1. Creator and opponent
  // 2. Any logged-in user for open challenges (awaiting_opponent)
  // 3. Any participant in team matches (check match_participants)
  const canView = isCreator || isOpponent || 
                  match.status === 'awaiting_opponent' || 
                  match.status === 'in_progress';

  if (!canView || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-foreground/70 mb-6">You don't have permission to view this match.</p>
          <Link to="/matches">
            <Button>Back to Matches</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link to="/matches" className="inline-flex items-center text-primary hover:text-primary/80 mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Matches
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Match Details
                  </span>
                </h1>
                <p className="text-foreground/70">
                  {match.games?.name} • {match.game_modes?.name} • {match.format}
                </p>
              </div>
              
              <div className="mt-4 md:mt-0">
                <Badge className={`${getStatusColor(match.status)} text-white flex items-center gap-2`}>
                  {getStatusIcon(match.status)}
                  {getStatusText(match.status)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Match Info */}
              <Card className="glass-card">
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4">Match Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <span className="text-foreground/60 text-sm">Game:</span>
                        <div className="font-semibold">{match.games?.name}</div>
                      </div>
                      
                      <div>
                        <span className="text-foreground/60 text-sm">Mode:</span>
                        <div className="font-semibold">{match.game_modes?.name}</div>
                      </div>
                      
                      <div>
                        <span className="text-foreground/60 text-sm">Format:</span>
                        <div className="font-semibold">
                          <Badge variant="outline">{getFormatDisplayName(match.format)}</Badge>
                        </div>
                      </div>
                      
                      {match.map_name && (
                        <div>
                          <span className="text-foreground/60 text-sm">Map:</span>
                          <div className="font-semibold">{match.map_name}</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <span className="text-foreground/60 text-sm">Stake Amount (per player):</span>
                        <div className="font-semibold text-primary text-xl">
                          ₦{match.stake_amount.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-foreground/60 text-sm">Current Pot:</span>
                        <div className="font-semibold text-success text-xl">
                          {potLoading ? '—' : `₦${pot.toLocaleString()}`} <span className="text-xs text-muted-foreground">({contributors} contributors)</span>
                        </div>
                      </div>
                      
                      {match.duration_minutes && (
                        <div>
                          <span className="text-foreground/60 text-sm">Duration:</span>
                          <div className="font-semibold">{match.duration_minutes} minutes</div>
                        </div>
                      )}
                      
                      <div>
                        <span className="text-foreground/60 text-sm">Created:</span>
                        <div className="font-semibold">
                          {new Date(match.created_at).toLocaleDateString()} at {new Date(match.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                      
                      {match.accepted_at && (
                        <div>
                          <span className="text-foreground/60 text-sm">Accepted:</span>
                          <div className="font-semibold">
                            {new Date(match.accepted_at).toLocaleDateString()} at {new Date(match.accepted_at).toLocaleTimeString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {match.custom_rules && (
                    <div className="mt-6">
                      <span className="text-foreground/60 text-sm">Custom Rules:</span>
                      <div className="mt-2 p-3 bg-muted/20 rounded-lg">
                        <p className="text-sm">{match.custom_rules}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Team Participants */}
              <Card className="glass-card">
                <div className="p-6">
                  <TeamParticipants
                    matchId={match.id}
                    format={match.format}
                    winnerId={match.winner_id}
                    creatorId={match.creator_id}
                    opponentId={match.opponent_id}
                  />
                </div>
              </Card>

              {/* Join Team Section for Team Matches */}
              {match.status === 'awaiting_opponent' && isTeamFormat(match.format) && (
                <JoinTeamMatch
                  matchId={match.id}
                  format={match.format}
                  creatorId={match.creator_id}
                  onJoinSuccess={fetchMatchDetails}
                />
              )}

              {/* Results */}
              {match.status === 'completed' && (
                <Card className="glass-card">
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">Match Results</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-3">Creator Result</h3>
                        <div className="flex items-center gap-2">
                          {match.creator_result === 'win' ? (
                            <CheckCircle className="h-5 w-5 text-success" />
                          ) : match.creator_result === 'loss' ? (
                            <XCircle className="h-5 w-5 text-destructive" />
                          ) : (
                            <Clock className="h-5 w-5 text-warning" />
                          )}
                          <span className="capitalize">{match.creator_result || 'Pending'}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-3">Opponent Result</h3>
                        <div className="flex items-center gap-2">
                          {match.opponent_result === 'win' ? (
                            <CheckCircle className="h-5 w-5 text-success" />
                          ) : match.opponent_result === 'loss' ? (
                            <XCircle className="h-5 w-5 text-destructive" />
                          ) : (
                            <Clock className="h-5 w-5 text-warning" />
                          )}
                          <span className="capitalize">{match.opponent_result || 'Pending'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {match.admin_decision && (
                      <div className="mt-4 p-3 bg-warning/10 rounded-lg">
                        <h4 className="font-semibold text-warning mb-2">Admin Decision:</h4>
                        <p className="text-sm">{match.admin_decision}</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions */}
              <Card className="glass-card">
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-4">Actions</h3>
                  
                  <div className="space-y-3">
                    {canAcceptChallenge() && (
                      <Button 
                        className="w-full bg-gradient-to-r from-primary to-accent"
                        onClick={handleAcceptChallenge}
                      >
                        <Target className="mr-2 h-4 w-4" />
                        Accept Challenge
                      </Button>
                    )}
                    
                    {canUploadResult() && (
                      <div className="space-y-2">
                        <Input 
                          type="file" 
                          accept="image/*,video/*"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <Button 
                          variant="outline" 
                          className="w-full"
                          disabled={!file || uploading}
                          onClick={handleUploadProof}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {uploading ? 'Uploading...' : 'Upload Proof'}
                        </Button>
                      </div>
                    )}

                    {canMarkDone() && (
                      <Button
                        className="w-full bg-primary"
                        onClick={handleMarkDone}
                      >
                        <Bell className="mr-2 h-4 w-4" />
                        I'm Done — Notify Admin
                      </Button>
                    )}

                    {match.status === 'pending_result' && (isCreator || isOpponent || isTeamParticipant()) && (
                      <Button
                        className="w-full"
                        variant="secondary"
                        disabled
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Awaiting Admin Decision
                      </Button>
                    )}

                    {canCancelMatch() && (
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        onClick={handleCancelMatch}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Match
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.print()}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Print Details
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Quick Stats */}
              <Card className="glass-card">
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-4">Quick Stats</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Total Stake:</span>
                      <span className="font-semibold">₦{(match.stake_amount * 2).toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Winner Prize:</span>
                      <span className="font-semibold text-success">₦{match.stake_amount.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Platform Fee:</span>
                      <span className="font-semibold">₦{(match.stake_amount * 0.05).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MatchDetail;
