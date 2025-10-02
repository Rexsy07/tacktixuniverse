import { useState } from 'react';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdvertisePayments } from '@/hooks/useAdvertisePayments';
import { useAdvertiseSubmissions } from '@/hooks/useAdvertiseSubmissions';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  RefreshCw,
  Eye,
  Calendar,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const AdvertisePayments = () => {
  const { 
    payments, 
    loading: paymentsLoading, 
    error: paymentsError,
    totalEarnings,
    completedPayments,
    fetchUserPayments 
  } = useAdvertisePayments();
  
  const { 
    submissions, 
    loading: submissionsLoading 
  } = useAdvertiseSubmissions();

  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('all');

  const formatMoney = (amount: number) => `₦${amount.toLocaleString()}`;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'processing':
        return 'default';
      default:
        return 'outline';
    }
  };

  const filteredPayments = payments.filter(payment => 
    selectedStatus === 'all' || payment.payment_status === selectedStatus
  );

  // Calculate summary stats from submissions
  const submissionStats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    paid: submissions.filter(s => s.status === 'paid').length,
    totalViews: submissions.reduce((sum, s) => sum + s.views, 0),
    approvedViews: submissions.filter(s => s.status === 'approved' || s.status === 'paid').reduce((sum, s) => sum + s.views, 0),
    pendingEarnings: submissions.filter(s => s.status === 'approved').reduce((sum, s) => sum + Math.floor(s.views / 1000) * s.rate_per_1000, 0)
  };

  // Payment status counters
  const paymentCounters = payments.reduce((acc, payment) => {
    acc[payment.payment_status] = (acc[payment.payment_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const loading = paymentsLoading || submissionsLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container pt-28 pb-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Payment History</h1>
            <p className="text-foreground/70">Track your advertising earnings and payment status</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchUserPayments} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
            <Button asChild>
              <Link to="/advertise-earn">
                <TrendingUp className="h-4 w-4 mr-2" />
                Submit Videos
              </Link>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">{formatMoney(totalEarnings)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed Payments</p>
                  <p className="text-2xl font-bold">{completedPayments.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Earnings</p>
                  <p className="text-2xl font-bold">{formatMoney(submissionStats.pendingEarnings)}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">{submissionStats.totalViews.toLocaleString()}</p>
                </div>
                <Eye className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="payments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
            <TabsTrigger value="overview">Earnings Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>Your advertising payment records</CardDescription>
                  </div>
                  {loading && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {/* Status Filters */}
                <div className="mb-4 flex flex-wrap gap-2">
                  <Badge
                    variant={selectedStatus === 'all' ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSelectedStatus('all')}
                  >
                    All ({payments.length})
                  </Badge>
                  {(['pending', 'processing', 'completed', 'failed'] as const).map(status => (
                    <Badge
                      key={status}
                      variant={selectedStatus === status ? 'default' : 'outline'}
                      className="cursor-pointer capitalize"
                      onClick={() => setSelectedStatus(status)}
                    >
                      {status} ({paymentCounters[status] || 0})
                    </Badge>
                  ))}
                </div>

                {/* Payments Table */}
                <div className="overflow-x-auto">
                  {filteredPayments.length === 0 ? (
                    <div className="text-center py-12">
                      <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No payments yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Your approved submissions will generate payments weekly.
                      </p>
                      <Button asChild>
                        <Link to="/advertise-earn">Submit Your First Video</Link>
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Week</TableHead>
                          <TableHead className="text-right">Submissions</TableHead>
                          <TableHead className="text-right">Views</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Transaction ID</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPayments.map(payment => (
                          <TableRow key={payment.id}>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(payment.payout_week), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell className="text-right">
                              {payment.total_submissions}
                            </TableCell>
                            <TableCell className="text-right">
                              {payment.total_views.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatMoney(payment.amount_ngn)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(payment.payment_status)}
                                <Badge 
                                  variant={getStatusVariant(payment.payment_status)}
                                  className="capitalize"
                                >
                                  {payment.payment_status}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-mono">
                              {payment.transaction_reference || '-'}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm">
                              {payment.paid_at ? 
                                format(new Date(payment.paid_at), 'MMM dd, HH:mm') : 
                                format(new Date(payment.created_at), 'MMM dd, HH:mm')
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview">
            <div className="grid gap-6">
              {/* Submission Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Submission Summary
                  </CardTitle>
                  <CardDescription>Your video submission performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">{submissionStats.total}</div>
                      <div className="text-sm text-muted-foreground">Total Submissions</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{submissionStats.pending}</div>
                      <div className="text-sm text-muted-foreground">Pending Review</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{submissionStats.approved}</div>
                      <div className="text-sm text-muted-foreground">Approved</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{submissionStats.paid}</div>
                      <div className="text-sm text-muted-foreground">Paid</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Earnings Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Earnings Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div>
                        <div className="font-semibold text-green-700 dark:text-green-300">Total Paid</div>
                        <div className="text-sm text-muted-foreground">
                          From {completedPayments.length} completed payments
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatMoney(totalEarnings)}
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div>
                        <div className="font-semibold text-yellow-700 dark:text-yellow-300">Pending Payout</div>
                        <div className="text-sm text-muted-foreground">
                          From {submissionStats.approved} approved submissions
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-yellow-600">
                        {formatMoney(submissionStats.pendingEarnings)}
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                      <div>
                        <div className="font-semibold">Rate per 1,000 views</div>
                        <div className="text-sm text-muted-foreground">Current payout rate</div>
                      </div>
                      <div className="text-2xl font-bold">₦500</div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">Next Payout</div>
                        <div className="text-sm text-muted-foreground">
                          Payments are processed weekly on Mondays
                        </div>
                      </div>
                      <Button asChild>
                        <Link to="/advertise-earn">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Add More Videos
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default AdvertisePayments;