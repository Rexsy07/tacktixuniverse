import { useState } from "react";
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

const AdminWallet = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const depositRequests = [
    {
      id: "DEP001234",
      user: "NaijaSharpShooter",
      amount: 2000,
      status: "pending",
      submittedAt: "2024-01-20T10:30:00",
      reference: "TXN123456789",
      bankDetails: "First Bank - Acc: 1234567890"
    },
    {
      id: "DEP001235",
      user: "LagosWarrior",
      amount: 1500,
      status: "completed",
      submittedAt: "2024-01-20T09:15:00",
      reference: "TXN987654321",
      bankDetails: "GTBank - Acc: 9876543210"
    },
    {
      id: "DEP001236",
      user: "AbujaTitan",
      amount: 3000,
      status: "rejected",
      submittedAt: "2024-01-20T08:45:00",
      reference: "TXN456789123",
      bankDetails: "Access Bank - Acc: 4567891234",
      rejectionReason: "Invalid transfer receipt"
    }
  ];

  const withdrawalRequests = [
    {
      id: "WTH001234",
      user: "FreeFire King",
      amount: 5000,
      status: "pending",
      submittedAt: "2024-01-20T11:20:00",
      accountName: "John Ademola",
      accountNumber: "1122334455",
      bankName: "UBA"
    },
    {
      id: "WTH001235", 
      user: "ChampionCODM",
      amount: 3500,
      status: "processing",
      submittedAt: "2024-01-20T10:10:00",
      accountName: "Samuel Okafor",
      accountNumber: "5566778899",
      bankName: "Zenith Bank"
    },
    {
      id: "WTH001236",
      user: "WarzoneMaster",
      amount: 2800,
      status: "completed",
      submittedAt: "2024-01-19T16:30:00",
      accountName: "Ibrahim Hassan",
      accountNumber: "9988776655",
      bankName: "First Bank"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success text-success-foreground";
      case "pending": return "bg-warning text-warning-foreground";
      case "processing": return "bg-primary text-primary-foreground";
      case "rejected": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleApproveDeposit = (id: string) => {
    toast.success(`Deposit ${id} approved successfully`);
    // Handle approval logic
  };

  const handleRejectDeposit = (id: string) => {
    toast.error(`Deposit ${id} rejected`);
    // Handle rejection logic
  };

  const handleProcessWithdrawal = (id: string) => {
    toast.success(`Withdrawal ${id} marked as processing`);
    // Handle processing logic
  };

  const handleCompleteWithdrawal = (id: string) => {
    toast.success(`Withdrawal ${id} marked as completed`);
    // Handle completion logic
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      <div className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Wallet Management</h1>
          <p className="text-foreground/70">Review and process deposit and withdrawal requests</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card">
            <div className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto text-warning mb-2" />
              <div className="text-2xl font-bold">15</div>
              <div className="text-sm text-foreground/70">Pending Requests</div>
            </div>
          </Card>
          <Card className="glass-card">
            <div className="p-4 text-center">
              <ArrowDownLeft className="h-6 w-6 mx-auto text-success mb-2" />
              <div className="text-2xl font-bold">₦125K</div>
              <div className="text-sm text-foreground/70">Deposits Today</div>
            </div>
          </Card>
          <Card className="glass-card">
            <div className="p-4 text-center">
              <ArrowUpRight className="h-6 w-6 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">₦89K</div>
              <div className="text-sm text-foreground/70">Withdrawals Today</div>
            </div>
          </Card>
          <Card className="glass-card">
            <div className="p-4 text-center">
              <AlertCircle className="h-6 w-6 mx-auto text-destructive mb-2" />
              <div className="text-2xl font-bold">3</div>
              <div className="text-sm text-foreground/70">Disputes</div>
            </div>
          </Card>
        </div>

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
              {depositRequests.map((request) => (
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
                      variant={filterStatus === "processing" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus("processing")}
                    >
                      Processing
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Withdrawals List */}
            <div className="space-y-4">
              {withdrawalRequests.map((request) => (
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
                        <Button
                          onClick={() => handleProcessWithdrawal(request.id)}
                          className="bg-primary hover:bg-primary/80"
                          size="sm"
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Process
                        </Button>
                      )}
                      
                      {request.status === "processing" && (
                        <Button
                          onClick={() => handleCompleteWithdrawal(request.id)}
                          className="bg-success hover:bg-success/80"
                          size="sm"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Mark as Paid
                        </Button>
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