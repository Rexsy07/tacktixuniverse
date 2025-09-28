import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet, Plus, ArrowUpRight, ArrowDownLeft, 
  Copy, Check, Clock, AlertTriangle, CreditCard 
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useProfile } from "@/hooks/useProfile";
import { useTransactions } from "@/hooks/useTransactions";
import { Link } from "react-router-dom";
import { useWalletHolds } from "@/hooks/useWalletHolds";

const DashboardWallet = () => {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankDetails, setBankDetails] = useState({
    accountName: "",
    accountNumber: "",
    bankName: ""
  });
  const [copied, setCopied] = useState(false);

  const { wallet, loading: profileLoading } = useProfile();
  const { transactions, loading: transactionsLoading, createDepositRequest, createWithdrawRequest } = useTransactions();
  const { holdsDetailed, holds, heldTotal } = useWalletHolds();

  // Bank details for deposits
  const bankInfo = {
    accountName: "Chippercash/eze onyinyechi",
    accountNumber: "9851479231",
    bankName: "PAYSTACK-TITAN",
    sortCode: "011"
  };

  // Calculate pending amounts from transactions
  const pendingDeposit = transactions
    .filter(t => t.type === 'deposit' && t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const pendingWithdrawal = transactions
    .filter(t => t.type === 'withdrawal' && t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || parseInt(depositAmount) < 100) {
      return;
    }
    const reference = `DEP-${Date.now().toString().slice(-6)}`;
    await createDepositRequest(parseInt(depositAmount), reference);
    setDepositAmount("");
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || parseInt(withdrawAmount) < 200) {
      return;
    }
    if (parseInt(withdrawAmount) > (wallet?.balance || 0)) {
      return;
    }
    await createWithdrawRequest(parseInt(withdrawAmount), bankDetails);
    setWithdrawAmount("");
    setBankDetails({ accountName: "", accountNumber: "", bankName: "" });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit": return <ArrowDownLeft className="h-4 w-4 text-success" />;
      case "withdrawal": return <ArrowUpRight className="h-4 w-4 text-warning" />;
      case "match_win": return <ArrowDownLeft className="h-4 w-4 text-success" />;
      case "match_loss": return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      default: return <Wallet className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success";
      case "pending": return "bg-warning";
      case "failed": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  if (profileLoading) {
    return (
      <DashboardLayout title="Wallet" description="Loading wallet...">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Wallet"
      description="Manage your deposits, withdrawals, and transaction history"
    >
      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="glass-card">
          <div className="p-6 text-center">
            <Wallet className="h-8 w-8 mx-auto text-primary mb-2" />
            <div className="text-2xl font-bold">₦{(wallet?.balance || 0).toLocaleString()}</div>
            <div className="text-sm text-foreground/70">Available Balance</div>
          </div>
        </Card>
        
        <Card className="glass-card">
          <div className="p-6 text-center">
            <Clock className="h-8 w-8 mx-auto text-warning mb-2" />
            <div className="text-2xl font-bold">₦{pendingDeposit.toLocaleString()}</div>
            <div className="text-sm text-foreground/70">Pending Deposit</div>
          </div>
        </Card>
        
        <Card className="glass-card">
          <div className="p-6 text-center">
            <ArrowUpRight className="h-8 w-8 mx-auto text-accent mb-2" />
            <div className="text-2xl font-bold">₦{pendingWithdrawal.toLocaleString()}</div>
            <div className="text-sm text-foreground/70">Pending Withdrawal</div>
          </div>
        </Card>

        <Card className="glass-card">
          <div className="p-6 text-center">
            <Wallet className="h-8 w-8 mx-auto text-foreground mb-2" />
            <div className="text-2xl font-bold">₦{heldTotal.toLocaleString()}</div>
            <div className="text-sm text-foreground/70">Escrowed (Held)</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Deposit & Withdraw */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="deposit" className="w-full">
            <TabsList className="grid w-full grid-cols-2 glass-card">
              <TabsTrigger value="deposit">Deposit Funds</TabsTrigger>
              <TabsTrigger value="withdraw">Withdraw Funds</TabsTrigger>
            </TabsList>
            
            {/* Deposit Tab */}
            <TabsContent value="deposit" className="mt-6">
              <Card className="glass-card">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-4">Deposit Money</h3>
                  
                  <form onSubmit={handleDeposit} className="space-y-4 mb-6">
                    <div>
                      <Label htmlFor="amount">Deposit Amount (₦)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter amount (min ₦100)"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        min="100"
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent">
                      <Plus className="mr-2 h-4 w-4" />
                      Request Deposit
                    </Button>
                  </form>

                  {depositAmount && parseInt(depositAmount) >= 100 && (
                    <div className="bg-muted/20 rounded-lg p-4">
                      <h4 className="font-semibold mb-3 flex items-center">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Transfer Instructions
                      </h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground/70">Account Name:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{bankInfo.accountName}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(bankInfo.accountName)}
                            >
                              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground/70">Account Number:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{bankInfo.accountNumber}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(bankInfo.accountNumber)}
                            >
                              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground/70">Bank:</span>
                          <span className="font-mono text-sm">{bankInfo.bankName}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground/70">Reference:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-primary">
                              DEP-{Date.now().toString().slice(-6)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(`DEP-${Date.now().toString().slice(-6)}`)}
                            >
                              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-warning/10 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-semibold text-warning mb-1">Important:</p>
                            <p className="text-foreground/70">
                              Use the exact reference code above when making your transfer. 
                              Deposits are processed within 5-15 minutes during business hours.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
            
            {/* Withdraw Tab */}
            <TabsContent value="withdraw" className="mt-6">
              <Card className="glass-card">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-4">Withdraw Money</h3>
                  
                  <form onSubmit={handleWithdraw} className="space-y-4">
                    <div>
                      <Label htmlFor="withdrawAmount">Withdrawal Amount (₦)</Label>
                      <Input
                        id="withdrawAmount"
                        type="number"
                        placeholder="Enter amount (min ₦200)"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        min="200"
                        max={wallet?.balance || 0}
                        required
                      />
                      <p className="text-xs text-foreground/60 mt-1">
                        Available: ₦{(wallet?.balance || 0).toLocaleString()}
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="accountName">Account Name</Label>
                      <Input
                        id="accountName"
                        type="text"
                        placeholder="Full name as on bank account"
                        value={bankDetails.accountName}
                        onChange={(e) => setBankDetails(prev => ({...prev, accountName: e.target.value}))}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input
                        id="accountNumber"
                        type="text"
                        placeholder="10-digit account number"
                        value={bankDetails.accountNumber}
                        onChange={(e) => setBankDetails(prev => ({...prev, accountNumber: e.target.value}))}
                        maxLength={10}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        type="text"
                        placeholder="e.g., First Bank Nigeria"
                        value={bankDetails.bankName}
                        onChange={(e) => setBankDetails(prev => ({...prev, bankName: e.target.value}))}
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full" variant="outline">
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      Request Withdrawal
                    </Button>
                  </form>
                  
                  <div className="mt-4 p-3 bg-info/10 rounded-lg">
                    <p className="text-sm text-foreground/70">
                      Withdrawal requests are processed within 24 hours during business days. 
                      A small processing fee may apply.
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Transaction History */}
        <div className="space-y-8">
          <Card className="glass-card">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">Recent Transactions</h3>
              
              {transactionsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 mx-auto text-foreground/30 mb-4" />
                  <p className="text-foreground/70">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 glass rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <div className="text-sm font-semibold capitalize">
                            {transaction.type.replace('_', ' ')}
                          </div>
                          <div className="text-xs text-foreground/60">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${
                          transaction.amount > 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}₦{Math.abs(transaction.amount).toLocaleString()}
                        </div>
                        <Badge className={`${getStatusColor(transaction.status)} text-white text-xs`}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {transactions.length > 10 && (
                <Button variant="outline" className="w-full mt-4">
                  View All Transactions
                </Button>
              )}
            </div>
          </Card>

          {/* Held Funds */}
          <Card className="glass-card">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">Escrowed Holds</h3>
              {heldTotal === 0 ? (
                <div className="text-foreground/70">No held funds</div>
              ) : (
                <div className="space-y-3">
                  {holdsDetailed.map(h => (
                    <div key={h.id} className="flex items-center justify-between p-3 glass rounded-lg">
                      <div>
                        <div className="text-sm text-foreground/70">{h.game_name || 'Game'}</div>
                        <Link to={`/matches/${h.match_id}`} className="font-mono text-sm text-primary hover:underline">
                          {h.mode_name ? `${h.mode_name} • ` : ''}{h.match_id.substring(0, 8)}…
                        </Link>
                      </div>
                      <div className="text-right">
                        <div className="text-foreground/70 text-xs">Held Amount</div>
                        <div className="text-lg font-bold">₦{h.amount.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardWallet;