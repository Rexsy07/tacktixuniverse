import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAdminAdvertisePayments, AdvertisePayment } from '@/hooks/useAdvertisePayments';
import { useAuth } from '@/hooks/useAuth';
import { 
  Calculator, 
  DollarSign, 
  Download, 
  Filter, 
  Loader2, 
  RefreshCw, 
  Send, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

const paymentStatuses: AdvertisePayment['payment_status'][] = ['pending', 'processing', 'completed', 'failed'];

const AdminPayouts = () => {
  const { user } = useAuth();
  const {
    payments,
    weeklyPayouts,
    loading,
    error,
    fetchAllPayments,
    calculateWeeklyPayouts,
    processWeeklyPayments,
    updatePaymentStatus,
    totalAmount,
    pendingPayments,
    completedPayments
  } = useAdminAdvertisePayments();

  const [statusFilter, setStatusFilter] = useState<AdvertisePayment['payment_status'] | ''>('');
  const [selectedWeek, setSelectedWeek] = useState<string>(
    format(new Date(), 'yyyy-MM-dd') // Current week
  );
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<AdvertisePayment | null>(null);
  const [updateForm, setUpdateForm] = useState({
    status: '' as AdvertisePayment['payment_status'],
    notes: '',
    transactionRef: ''
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchAllPayments(statusFilter || undefined);
  }, [statusFilter, fetchAllPayments]);

  const handleCalculatePayouts = async () => {
    if (!selectedWeek) return;
    await calculateWeeklyPayouts(selectedWeek);
  };

  const handleProcessPayouts = async () => {
    if (!user?.id || !selectedWeek) return;
    
    setProcessing(true);
    try {
      const count = await processWeeklyPayments(selectedWeek, user.id);
      setShowPayoutModal(false);
      // Show success toast or notification
      console.log(`Processed ${count} payments for week ${selectedWeek}`);
    } catch (error) {
      console.error('Failed to process payments:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdatePayment = async () => {
    if (!selectedPayment) return;
    
    setProcessing(true);
    try {
      await updatePaymentStatus(
        selectedPayment.id,
        updateForm.status,
        updateForm.notes || undefined,
        updateForm.transactionRef || undefined
      );
      setShowUpdateModal(false);
      setSelectedPayment(null);
      setUpdateForm({ status: '' as AdvertisePayment['payment_status'], notes: '', transactionRef: '' });
    } catch (error) {
      console.error('Failed to update payment:', error);
    } finally {
      setProcessing(false);
    }
  };

  const openUpdateModal = (payment: AdvertisePayment) => {
    setSelectedPayment(payment);
    setUpdateForm({
      status: payment.payment_status,
      notes: payment.payment_notes || '',
      transactionRef: payment.transaction_reference || ''
    });
    setShowUpdateModal(true);
  };

  const getStatusIcon = (status: AdvertisePayment['payment_status']) => {
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

  const formatMoney = (amount: number) => `₦${amount.toLocaleString()}`;

  const counters = payments.reduce((acc, payment) => {
    acc[payment.payment_status] = (acc[payment.payment_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="ml-64 p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Advertise Payouts</h1>
            <p className="text-foreground/70">Manage advertising payments and process weekly payouts</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchAllPayments()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={() => setShowPayoutModal(true)}>
              <Calculator className="h-4 w-4 mr-2" /> Process Payouts
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Payments</p>
                  <p className="text-2xl font-bold">{payments.length}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">{formatMoney(totalAmount)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{pendingPayments.length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{completedPayments.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="payments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="payments">Payment Management</TabsTrigger>
            <TabsTrigger value="calculator">Payout Calculator</TabsTrigger>
          </TabsList>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>Manage and track all advertising payments</CardDescription>
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
                {/* Filters */}
                <div className="mb-4 flex flex-wrap gap-2 items-center">
                  <Badge 
                    variant={statusFilter === '' ? 'default' : 'outline'} 
                    onClick={() => setStatusFilter('')} 
                    className="cursor-pointer"
                  >
                    All ({payments.length})
                  </Badge>
                  {paymentStatuses.map(status => (
                    <Badge 
                      key={status} 
                      variant={statusFilter === status ? 'default' : 'outline'} 
                      onClick={() => setStatusFilter(status)} 
                      className="cursor-pointer capitalize"
                    >
                      {status} ({counters[status] || 0})
                    </Badge>
                  ))}
                </div>

                {/* Payments Table */}
                <div className="overflow-x-auto">
                  {payments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No payments found
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Week</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead className="text-right">Submissions</TableHead>
                          <TableHead className="text-right">Views</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Transaction Ref</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map(payment => (
                          <TableRow key={payment.id}>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(payment.payout_week), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell className="text-xs font-mono">
                              {payment.user_id.slice(0, 8)}...
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
                                  variant={
                                    payment.payment_status === 'completed' ? 'secondary' :
                                    payment.payment_status === 'failed' ? 'destructive' :
                                    payment.payment_status === 'processing' ? 'default' : 'outline'
                                  }
                                  className="capitalize"
                                >
                                  {payment.payment_status}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              {payment.transaction_reference || '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => openUpdateModal(payment)}
                              >
                                Update
                              </Button>
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

          <TabsContent value="calculator">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Payout Calculator</CardTitle>
                <CardDescription>Calculate and process weekly payouts for approved submissions</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label htmlFor="week">Target Week (Monday)</Label>
                      <Input
                        id="week"
                        type="date"
                        value={selectedWeek}
                        onChange={(e) => setSelectedWeek(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleCalculatePayouts}>
                      <Calculator className="h-4 w-4 mr-2" />
                      Calculate
                    </Button>
                  </div>

                  {weeklyPayouts.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Payout Summary for {format(new Date(selectedWeek), 'MMM dd, yyyy')}
                      </h3>
                      
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User ID</TableHead>
                              <TableHead className="text-right">Submissions</TableHead>
                              <TableHead className="text-right">Total Views</TableHead>
                              <TableHead className="text-right">Earnings</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {weeklyPayouts.map(payout => (
                              <TableRow key={payout.user_id}>
                                <TableCell className="font-mono text-xs">
                                  {payout.user_id.slice(0, 8)}...
                                </TableCell>
                                <TableCell className="text-right">
                                  {payout.submission_count}
                                </TableCell>
                                <TableCell className="text-right">
                                  {payout.total_views.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  {formatMoney(payout.total_earnings)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">
                              Total: {formatMoney(weeklyPayouts.reduce((sum, p) => sum + p.total_earnings, 0))}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {weeklyPayouts.length} users • {weeklyPayouts.reduce((sum, p) => sum + p.submission_count, 0)} submissions
                            </p>
                          </div>
                          <Button onClick={() => setShowPayoutModal(true)}>
                            <Send className="h-4 w-4 mr-2" />
                            Process Payments
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Process Payout Modal */}
        <Dialog open={showPayoutModal} onOpenChange={setShowPayoutModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Weekly Payments</DialogTitle>
              <DialogDescription>
                This will create payment records and mark submissions as paid for the week of {format(new Date(selectedWeek), 'MMM dd, yyyy')}.
              </DialogDescription>
            </DialogHeader>
            
            {weeklyPayouts.length > 0 && (
              <div className="py-4">
                <div className="bg-muted/50 rounded p-4">
                  <p className="font-semibold">Payment Summary:</p>
                  <p>{weeklyPayouts.length} users will receive payments</p>
                  <p>Total amount: {formatMoney(weeklyPayouts.reduce((sum, p) => sum + p.total_earnings, 0))}</p>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPayoutModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleProcessPayouts} disabled={processing || weeklyPayouts.length === 0}>
                {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Process Payments
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Payment Modal */}
        <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Payment</DialogTitle>
              <DialogDescription>
                Update payment status and add transaction details.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="status">Payment Status</Label>
                <select
                  id="status"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, status: e.target.value as AdvertisePayment['payment_status'] }))}
                >
                  {paymentStatuses.map(status => (
                    <option key={status} value={status} className="capitalize">
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="transactionRef">Transaction Reference</Label>
                <Input
                  id="transactionRef"
                  placeholder="e.g., TXN123456789"
                  value={updateForm.transactionRef}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, transactionRef: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Payment Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this payment..."
                  value={updateForm.notes}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUpdateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdatePayment} disabled={processing}>
                {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Update Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPayouts;