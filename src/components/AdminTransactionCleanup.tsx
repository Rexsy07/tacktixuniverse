import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Trash2, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { 
  findDuplicateWinTransactions, 
  removeDuplicateWinTransactions, 
  cleanupAllDuplicateTransactions,
  DuplicateTransaction 
} from '@/utils/transactionSafeguards';
import { 
  fixAllDuplicateTransactions, 
  analyzeAllDuplicates, 
  SystemFixReport 
} from '@/utils/systemWideFix';
import { Input } from '@/components/ui/input';

const AdminTransactionCleanup = () => {
  const [loading, setLoading] = useState(false);
  const [matchId, setMatchId] = useState('');
  const [duplicates, setDuplicates] = useState<DuplicateTransaction[]>([]);
  const [globalCleanupResult, setGlobalCleanupResult] = useState<{ processed: number; removed: number; kept: number } | null>(null);
  const [systemReport, setSystemReport] = useState<SystemFixReport | null>(null);

  const findDuplicatesForMatch = async () => {
    if (!matchId.trim()) {
      toast.error('Please enter a match ID');
      return;
    }

    try {
      setLoading(true);
      const found = await findDuplicateWinTransactions(matchId.trim());
      setDuplicates(found);
      
      if (found.length === 0) {
        toast.success('No duplicate transactions found for this match');
      } else {
        toast.warning(`Found ${found.length} duplicate transactions`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Error finding duplicates');
    } finally {
      setLoading(false);
    }
  };

  const cleanupMatchDuplicates = async () => {
    if (!matchId.trim()) {
      toast.error('Please enter a match ID');
      return;
    }

    try {
      setLoading(true);
      const result = await removeDuplicateWinTransactions(matchId.trim());
      
      if (result.removed > 0) {
        toast.success(`Removed ${result.removed} duplicate transactions, kept ${result.kept} valid transactions`);
        // Refresh the list
        await findDuplicatesForMatch();
      } else {
        toast.info('No duplicate transactions to remove');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error removing duplicates');
    } finally {
      setLoading(false);
    }
  };

  const cleanupAllDuplicates = async () => {
    try {
      setLoading(true);
      toast.loading('Scanning all matches for duplicate transactions...');
      
      const result = await cleanupAllDuplicateTransactions();
      setGlobalCleanupResult(result);
      
      toast.dismiss();
      if (result.removed > 0) {
        toast.success(`Global cleanup complete: Processed ${result.processed} matches, removed ${result.removed} duplicates, kept ${result.kept} valid transactions`);
      } else {
        toast.success(`Global cleanup complete: Processed ${result.processed} matches, no duplicates found`);
      }
    } catch (e: any) {
      toast.dismiss();
      toast.error(e.message || 'Error during global cleanup');
    } finally {
      setLoading(false);
    }
  };

  const analyzeSystem = async () => {
    try {
      setLoading(true);
      toast.loading('Analyzing entire system for duplicate transactions...');
      
      const report = await analyzeAllDuplicates();
      setSystemReport(report);
      
      toast.dismiss();
      if (report.totalDuplicatesFound > 0) {
        toast.warning(`Analysis complete: Found ${report.totalDuplicatesFound} duplicate transactions across ${report.matchesWithDuplicates} matches affecting ${report.affectedUsers} users`);
      } else {
        toast.success('System analysis complete: No duplicate transactions found');
      }
    } catch (e: any) {
      toast.dismiss();
      toast.error(e.message || 'Error during system analysis');
    } finally {
      setLoading(false);
    }
  };

  const fixSystemWide = async () => {
    try {
      setLoading(true);
      toast.loading('Fixing all duplicate transactions system-wide...');
      
      const report = await fixAllDuplicateTransactions();
      setSystemReport(report);
      
      toast.dismiss();
      if (report.totalDuplicatesRemoved > 0) {
        toast.success(`System fix complete: Removed ${report.totalDuplicatesRemoved} duplicate transactions, recovered ₦${report.totalAmountRecovered.toLocaleString()}`);
      } else {
        toast.info('System fix complete: No duplicate transactions found');
      }
    } catch (e: any) {
      toast.dismiss();
      toast.error(e.message || 'Error during system-wide fix');
    } finally {
      setLoading(false);
    }
  };

  const groupedDuplicates = duplicates.reduce((acc, tx) => {
    const userId = tx.user_id;
    if (!acc[userId]) {
      acc[userId] = [];
    }
    acc[userId].push(tx);
    return acc;
  }, {} as Record<string, DuplicateTransaction[]>);

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Transaction Duplicate Cleanup
          </CardTitle>
          <CardDescription>
            Find and remove duplicate match win transactions that may have been created due to system bugs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Match-specific cleanup */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Clean Up Specific Match</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Enter match ID (e.g., 0b1e6380-70dd-455e-af73-19759daaa54f)"
                value={matchId}
                onChange={(e) => setMatchId(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={findDuplicatesForMatch}
                disabled={loading}
                variant="outline"
              >
                <Search className="h-4 w-4 mr-2" />
                Find Duplicates
              </Button>
              <Button
                onClick={cleanupMatchDuplicates}
                disabled={loading || duplicates.length === 0}
                className="bg-warning hover:bg-warning/80 text-warning-foreground"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Duplicates
              </Button>
            </div>
          </div>

          {/* Global cleanup */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-destructive">Global Cleanup</h3>
                <p className="text-sm text-foreground/70">
                  Scan all matches and remove duplicate transactions system-wide
                </p>
              </div>
              <Button
                onClick={cleanupAllDuplicates}
                disabled={loading}
                variant="destructive"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                {loading ? 'Processing...' : 'Clean All Duplicates'}
              </Button>
            </div>

            {globalCleanupResult && (
              <Card className="bg-success/10 border-success">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span className="font-semibold text-success">Global Cleanup Results</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Matches Processed</div>
                      <div className="text-2xl font-bold text-success">{globalCleanupResult.processed}</div>
                    </div>
                    <div>
                      <div className="font-medium">Duplicates Removed</div>
                      <div className="text-2xl font-bold text-warning">{globalCleanupResult.removed}</div>
                    </div>
                    <div>
                      <div className="font-medium">Valid Transactions Kept</div>
                      <div className="text-2xl font-bold text-primary">{globalCleanupResult.kept}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results display */}
      {duplicates.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Found Duplicate Transactions</CardTitle>
            <CardDescription>
              {Object.keys(groupedDuplicates).length} users with duplicate transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(groupedDuplicates).map(([userId, userTransactions]) => (
                <Card key={userId} className="border-destructive/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-semibold">User: {userId.substring(0, 8)}...</div>
                        <div className="text-sm text-foreground/70">
                          {userTransactions.length} duplicate transactions
                        </div>
                      </div>
                      <Badge variant="destructive">
                        Total: ₦{userTransactions.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {userTransactions.map((tx, index) => (
                        <div key={tx.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            {index === 0 ? (
                              <Badge className="bg-success text-success-foreground">KEEP</Badge>
                            ) : (
                              <Badge variant="destructive">REMOVE</Badge>
                            )}
                            <span className="font-mono text-sm">{tx.id.substring(0, 8)}...</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">₦{tx.amount.toLocaleString()}</div>
                            <div className="text-xs text-foreground/60">
                              {new Date(tx.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminTransactionCleanup;