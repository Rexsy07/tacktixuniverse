import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Filter, Check, X, Clock, 
  ArrowDownLeft, ArrowUpRight, AlertCircle, Eye 
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import { toast } from "sonner";
import { useAdminFees } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";

const AdminWallet = () => {
  const navigate = useNavigate();
  const { fees, loading } = useAdminFees();
  const [depositRequests, setDepositRequests] = useState<any[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    let mounted = true;
    const loadTransactions = async () => {
      try {
        if (!mounted) return;
        setLoadingTx(prev => prev && mounted ? prev : false); // avoid spinner after first load
        // Deposits
        const { data: deposits, error: depErr } = await supabase
          .from('transactions')
          .select('id, user_id, amount, status, reference_code, created_at, metadata')
          .eq('type', 'deposit')
          .order('created_at', { ascending: false })
          .limit(100);
        if (depErr) throw depErr;
        setDepositRequests((deposits || []).map(d => ({
          id: d.id,
          user: d.user_id.substring(0, 8) + '…',
          amount: d.amount,
          status: d.status,
          submittedAt: d.created_at,
          reference: d.reference_code,
          bankDetails: d.metadata?.bank_details,
          rejectionReason: d.metadata?.rejection_reason
        })));

        // Withdrawals
        const { data: withdrawals, error: wErr } = await supabase
          .from('transactions')
          .select('id, user_id, amount, status, created_at, metadata')
          .eq('type', 'withdrawal')
          .order('created_at', { ascending: false })
          .limit(100);
        if (wErr) throw wErr;
        setWithdrawalRequests((withdrawals || []).map(w => ({
          id: w.id,
          user: w.user_id.substring(0, 8) + '…',
          amount: w.amount,
          status: w.status,
          submittedAt: w.created_at,
          accountName: w.metadata?.account_name ?? w.metadata?.accountName,
          accountNumber: w.metadata?.account_number ?? w.metadata?.accountNumber,
          bankName: w.metadata?.bank_name ?? w.metadata?.bankName
        })));
      } catch (e) {
        console.error('Error loading transactions:', e);
      } finally {
        setLoadingTx(false);
      }
    };
    // Polling + realtime for non-intrusive updates
    const interval = setInterval(loadTransactions, 12000);
    const ch = supabase
      .channel('admin-wallet-transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, loadTransactions)
      .subscribe();

    loadTransactions();

    return () => {
      mounted = false;
      clearInterval(interval);
      try { ch.unsubscribe(); supabase.removeChannel(ch); } catch (_) {}
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success text-success-foreground";
      case "pending": return "bg-warning text-warning-foreground";
      case "processing": return "bg-primary text-primary-foreground";
      case "rejected": return "bg-destructive text-destructive-foreground";
      case "failed": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleApproveDeposit = async (id: string) => {
    // Atomically complete deposit and credit wallet balance via RPC
    const { error } = await supabase.rpc('admin_complete_deposit', { p_tx_id: id });
    if (error) return toast.error(error.message);
    toast.success(`Deposit ${id} approved successfully`);
    setDepositRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'completed' } : r));
  };

  const handleRejectDeposit = async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'failed', processed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('type', 'deposit');
    if (error) return toast.error(error.message);
    toast.error(`Deposit ${id} rejected`);
    setDepositRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'failed' } : r));
  };

  const handleAcceptWithdrawal = async (id: string) => {
    // Accept the withdrawal: atomically debit wallet and complete tx
    const { error } = await supabase.rpc('admin_complete_withdrawal', { p_tx_id: id });
    if (error) return toast.error(error.message);
    toast.success(`Withdrawal ${id} approved`);
    setWithdrawalRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'completed' } : r));
  };

  const handleRejectWithdrawal = async (id: string) => {
    // Deny the withdrawal: mark as failed (no wallet change)
    const { error } = await supabase.rpc('admin_reject_withdrawal', { p_tx_id: id, p_reason: null });
    if (error) return toast.error(error.message);
    toast.error(`Withdrawal ${id} denied`);
    setWithdrawalRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'failed' } : r));
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      <div className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Wallet Management</h1>
          <p className="text-foreground/70">Review and process deposit and withdrawal requests</p>
        </div>

        {/* Platform Fees Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card">
            <div className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto text-success mb-2" />
              <div className="text-2xl font-bold">₦{(fees.today || 0).toLocaleString()}</div>
              <div className="text-sm text-foreground/70">Fees Today</div>
            </div>
          </Card>
          <Card className="glass-card">
            <div className="p-4 text-center">
              <ArrowDownLeft className="h-6 w-6 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">₦{(fees.last30Days || 0).toLocaleString()}</div>
              <div className="text-sm text-foreground/70">Fees Last 30 Days</div>
            </div>
          </Card>
          <Card className="glass-card">
            <div className="p-4 text-center">
              <ArrowUpRight className="h-6 w-6 mx-auto text-accent mb-2" />
              <div className="text-2xl font-bold">₦{(fees.lifetime || 0).toLocaleString()}</div>
              <div className="text-sm text-foreground/70">Lifetime Fees</div>
            </div>
          </Card>
          <Card className="glass-card">
            <div className="p-4 text-center">
              <AlertCircle className="h-6 w-6 mx-auto text-foreground mb-2" />
              <div className="text-2xl font-bold">{fees.recent.length}</div>
              <div className="text-sm text-foreground/70">Recent Fee Entries</div>
            </div>
          </Card>
        </div>

        {/* Recent Fees */}
        <Card className="glass-card mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recent Platform Fees</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fees.recent.map((f) => (
                <div key={f.id} className="p-4 glass rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-sm text-foreground/70">Match</div>
                    <div className="font-mono text-sm">{f.match_id.substring(0, 8)}…</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">₦{f.fee_amount.toLocaleString()}</div>
                    <div className="text-xs text-foreground/60">{new Date(f.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
              {!fees.recent.length && (
                <div className="text-foreground/60">No recent fee entries</div>
              )}
            </div>
          </div>
        </Card>

        <Tabs defaultValue="deposits" className="w-full">
          <TabsList className="grid w-full grid-cols-2 glass-card mb-8">
            <TabsTrigger value="deposits">Deposit Requests</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawal Requests</TabsTrigger>
          </TabsList>

          {/* Deposits Tab */}
          <TabsContent value="deposits">
            {/* Search and Filter */}
            <Card className="glass-card mb-6">
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/50" />
                    <Input
                      placeholder="Search by user or reference..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={filterStatus === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={filterStatus === "pending" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus("pending")}
                    >
                      Pending
                    </Button>
                    <Button
                      variant={filterStatus === "completed" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus("completed")}
                    >
                      Completed
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Deposits List */}
            <div className="space-y-4">
              {depositRequests
                .filter(r => (filterStatus === 'all' ? true : r.status === filterStatus))
                .filter(r => r.user.toLowerCase().includes(searchQuery.toLowerCase()) || (r.reference || '').toLowerCase().includes(searchQuery.toLowerCase()))
                .map((request) => (
                <Card key={request.id} className="glass-card">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-bold text-lg">{request.user}</h3>
                          <p className="text-sm text-foreground/70">ID: {request.id}</p>
                        </div>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          ₦{request.amount.toLocaleString()}
                        </div>
                        <div className="text-sm text-foreground/70">
                          {new Date(request.submittedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-foreground/50 text-sm">Reference:</span>
                        <div className="font-mono text-sm">{request.reference}</div>
                      </div>
                      <div>
                        <span className="text-foreground/50 text-sm">Bank Details:</span>
                        <div className="text-sm">{request.bankDetails}</div>
                      </div>
                    </div>

                    {request.rejectionReason && (
                      <div className="mb-4 p-3 bg-destructive/10 rounded-lg">
                        <span className="text-destructive text-sm font-semibold">Rejection Reason: </span>
                        <span className="text-sm">{request.rejectionReason}</span>
                      </div>
                    )}
                    
                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApproveDeposit(request.id)}
                          className="bg-success hover:bg-success/80"
                          size="sm"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleRejectDeposit(request.id)}
                          variant="destructive"
                          size="sm"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/admin/wallet/receipt/${request.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Receipt
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals">
            {/* Search and Filter */}
            <Card className="glass-card mb-6">
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/50" />
                    <Input
                      placeholder="Search by user..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={filterStatus === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={filterStatus === "pending" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus("pending")}
                    >
                      Pending
                    </Button>
                    <Button
                      variant={filterStatus === "completed" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus("completed")}
                    >
                      Completed
                    </Button>
                    <Button
                      variant={filterStatus === "failed" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus("failed")}
                    >
                      Denied
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Withdrawals List */}
            <div className="space-y-4">
              {withdrawalRequests
                .filter(r => (filterStatus === 'all' ? true : r.status === filterStatus))
                .filter(r => r.user.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((request) => (
                <Card key={request.id} className="glass-card">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-bold text-lg">{request.user}</h3>
                          <p className="text-sm text-foreground/70">ID: {request.id}</p>
                        </div>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          ₦{request.amount.toLocaleString()}
                        </div>
                        <div className="text-sm text-foreground/70">
                          {new Date(request.submittedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <span className="text-foreground/50 text-sm">Account Name:</span>
                        <div className="font-semibold text-sm">{request.accountName}</div>
                      </div>
                      <div>
                        <span className="text-foreground/50 text-sm">Account Number:</span>
                        <div className="font-mono text-sm">{request.accountNumber}</div>
                      </div>
                      <div>
                        <span className="text-foreground/50 text-sm">Bank:</span>
                        <div className="text-sm">{request.bankName}</div>
                      </div>
                    </div>
                    
                  <div className="flex gap-2">
                      {request.status === "pending" && (
                        <>
                          <Button
                            onClick={() => handleAcceptWithdrawal(request.id)}
                            className="bg-success hover:bg-success/80"
                            size="sm"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Accept
                          </Button>
                          <Button
                            onClick={() => handleRejectWithdrawal(request.id)}
                            variant="destructive"
                            size="sm"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Deny
                          </Button>
                        </>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/admin/wallet/withdrawal/${request.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminWallet;