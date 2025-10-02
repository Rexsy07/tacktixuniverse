import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AdminSidebar from "@/components/AdminSidebar";
import { Check, X, ArrowLeft } from "lucide-react";

interface TxRow {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  status: string;
  reference_code: string | null;
  description: string | null;
  metadata: any;
  created_at: string;
  processed_at?: string | null;
}

const AdminWithdrawalDetail = () => {
  const navigate = useNavigate();
  const { txId } = useParams<{ txId: string }>();
  const [tx, setTx] = useState<TxRow | null>(null);
  const [loading, setLoading] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success text-success-foreground";
      case "pending": return "bg-warning text-warning-foreground";
      case "failed": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const fetchTx = async () => {
    if (!txId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('id, user_id, amount, type, status, reference_code, description, metadata, created_at, processed_at')
        .eq('id', txId)
        .single();
      if (error) throw error;
      setTx(data as TxRow);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load withdrawal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTx();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txId]);

  const handleAccept = async () => {
    if (!txId) return;
    const { error } = await supabase.rpc('admin_complete_withdrawal', { p_tx_id: txId });
    if (error) return toast.error(error.message);
    toast.success('Withdrawal approved');
    await fetchTx();
  };

  const handleDeny = async () => {
    if (!txId) return;
    const { error } = await supabase.rpc('admin_reject_withdrawal', { p_tx_id: txId, p_reason: null });
    if (error) return toast.error(error.message);
    toast.error('Withdrawal denied');
    await fetchTx();
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="ml-64 p-8">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/wallet')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Wallet
          </Button>
          <h1 className="text-2xl font-bold">Withdrawal Details</h1>
        </div>

        <Card className="glass-card p-6">
          {loading ? (
            <div>Loading...</div>
          ) : !tx ? (
            <div className="text-foreground/70">Withdrawal not found.</div>
          ) : tx.type !== 'withdrawal' ? (
            <div className="text-foreground/70">This transaction is not a withdrawal.</div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-foreground/60">Transaction ID</div>
                  <div className="font-mono text-sm">{tx.id}</div>
                </div>
                <Badge className={getStatusColor(tx.status)}>{tx.status.toUpperCase()}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-foreground/60">User</div>
                  <div className="font-mono text-sm">{tx.user_id}</div>
                </div>
                <div>
                  <div className="text-sm text-foreground/60">Amount</div>
                  <div className="text-xl font-bold">₦{Number(tx.amount).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-foreground/60">Created</div>
                  <div className="text-sm">{new Date(tx.created_at).toLocaleString()}</div>
                </div>
                {tx.processed_at && (
                  <div>
                    <div className="text-sm text-foreground/60">Processed</div>
                    <div className="text-sm">{new Date(tx.processed_at).toLocaleString()}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-foreground/60">Reference</div>
                  <div className="font-mono text-sm">{tx.reference_code || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-foreground/60">Description</div>
                  <div className="text-sm">{tx.description || '-'}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-sm text-foreground/60">Bank Details</div>
                  <div className="text-sm">
                    {(tx.metadata?.account_name || tx.metadata?.accountName) ? (
                      <div className="space-y-1">
                        <div><span className="text-foreground/60">Name:</span> {tx.metadata.account_name ?? tx.metadata.accountName}</div>
                        <div><span className="text-foreground/60">Number:</span> {tx.metadata.account_number ?? tx.metadata.accountNumber}</div>
                        <div><span className="text-foreground/60">Bank:</span> {tx.metadata.bank_name ?? tx.metadata.bankName}</div>
                      </div>
                    ) : (
                      <span>-</span>
                    )}
                  </div>
                </div>
                {tx.metadata?.rejection_reason && (
                  <div className="md:col-span-2">
                    <div className="text-sm text-foreground/60">Rejection Reason</div>
                    <div className="text-sm">{tx.metadata.rejection_reason}</div>
                  </div>
                )}
              </div>

              {tx.status === 'pending' && (
                <div className="flex gap-2">
                  <Button onClick={handleAccept} className="bg-success hover:bg-success/80" size="sm">
                    <Check className="mr-2 h-4 w-4" /> Accept
                  </Button>
                  <Button onClick={handleDeny} variant="destructive" size="sm">
                    <X className="mr-2 h-4 w-4" /> Deny
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminWithdrawalDetail;
