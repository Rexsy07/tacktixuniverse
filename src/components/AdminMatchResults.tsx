import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, User, Users, Clock, Trophy, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface MatchResult {
  id: string;
  match_id: string;
  uploader_id: string;
  uploader_username: string;
  uploader_team: string;
  result_type: string;
  result_data: any;
  screenshot_url?: string;
  uploaded_at: string;
  verified: boolean;
  admin_reviewed: boolean;
}

interface AdminMatchResultsProps {
  matchId: string;
  format: string;
}

const AdminMatchResults = ({ matchId, format }: AdminMatchResultsProps) => {
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchMatchResults = async () => {
    try {
      setLoading(true);
      
      // Use the optimized SQL function to get results with team info
      const { data: resultsData, error } = await supabase.rpc('get_match_results_with_teams', {
        p_match_id: matchId
      });

      if (error) throw error;

      // Map to our interface format
      const enrichedResults: MatchResult[] = (resultsData || []).map(result => ({
        id: result.id,
        match_id: result.match_id,
        uploader_id: result.uploader_id,
        uploader_username: result.uploader_username || 'Unknown',
        uploader_team: result.uploader_team || 'Unknown',
        result_type: result.result_type,
        result_data: result.result_data,
        screenshot_url: result.screenshot_url,
        uploaded_at: result.uploaded_at,
        verified: result.verified || false,
        admin_reviewed: result.admin_reviewed || false,
      }));

      setResults(enrichedResults);
    } catch (error: any) {
      console.error('Error fetching match results:', error);
      toast.error('Failed to load match results');
    } finally {
      setLoading(false);
    }
  };

  const markAsReviewed = async (resultId: string) => {
    try {
      const { error } = await supabase
        .from('match_results')
        .update({ admin_reviewed: true })
        .eq('id', resultId);

      if (error) throw error;

      setResults(prev => prev.map(r => 
        r.id === resultId ? { ...r, admin_reviewed: true } : r
      ));

      toast.success('Marked as reviewed');
    } catch (error: any) {
      toast.error('Failed to mark as reviewed');
    }
  };

  const getResultTypeColor = (type: string) => {
    switch (type) {
      case 'win': return 'bg-green-500';
      case 'loss': return 'bg-red-500';
      case 'dispute': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getTeamColor = (team: string) => {
    switch (team) {
      case 'A': return 'text-blue-600';
      case 'B': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const formatResultData = (data: any) => {
    if (!data) return 'No data';
    
    if (typeof data === 'string') return data;
    
    if (data.score) return `Score: ${data.score}`;
    if (data.winner) return `Winner: ${data.winner}`;
    if (data.reason) return `Reason: ${data.reason}`;
    
    return JSON.stringify(data, null, 2);
  };

  useEffect(() => {
    if (open) {
      fetchMatchResults();
    }
  }, [open, matchId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FileText className="h-4 w-4 mr-1" />
          View Results
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Match Results Upload History
          </DialogTitle>
          <DialogDescription>
            All results uploaded for this {format} match by participants
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading results...</div>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No results uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={result.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getResultTypeColor(result.result_type)}`}></div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className={getTeamColor(result.uploader_team)}>
                            {result.uploader_username} (Team {result.uploader_team})
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {new Date(result.uploaded_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={result.result_type === 'win' ? 'default' : result.result_type === 'loss' ? 'destructive' : 'secondary'} className="capitalize">
                        {result.result_type}
                      </Badge>
                      {result.verified && (
                        <Badge variant="outline" className="text-green-600">
                          <Trophy className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {!result.admin_reviewed && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsReviewed(result.id)}
                          className="text-xs"
                        >
                          Mark Reviewed
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="bg-muted rounded p-3">
                    <div className="text-sm">
                      <strong>Result Details:</strong>
                      <pre className="mt-1 text-xs whitespace-pre-wrap">
                        {formatResultData(result.result_data)}
                      </pre>
                    </div>
                  </div>

                  {result.screenshot_url && (
                    <div>
                      <div className="text-sm font-medium mb-2">Screenshot:</div>
                      <img 
                        src={result.screenshot_url} 
                        alt="Match result screenshot"
                        className="max-w-full h-auto max-h-48 rounded border cursor-pointer hover:opacity-80"
                        onClick={() => window.open(result.screenshot_url, '_blank')}
                      />
                    </div>
                  )}

                  {index < results.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AdminMatchResults;