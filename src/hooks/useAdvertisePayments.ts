import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AdvertisePayment {
  id: string;
  user_id: string;
  submission_ids: string[];
  total_views: number;
  total_submissions: number;
  amount_ngn: number;
  rate_per_1000: number;
  payment_method: string;
  transaction_reference?: string | null;
  payment_status: 'pending' | 'processing' | 'completed' | 'failed';
  payment_notes?: string | null;
  paid_by?: string | null;
  paid_at?: string | null;
  payout_week: string; // date string
  created_at: string;
  updated_at: string;
}

export interface WeeklyPayoutSummary {
  user_id: string;
  submission_count: number;
  total_views: number;
  total_earnings: number;
  submission_ids: string[];
}

export function useAdvertisePayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<AdvertisePayment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id || null;

  const fetchUserPayments = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    
    const { data, error } = await supabase
      .from('advertise_payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      setError(error.message);
      setPayments([]);
    } else {
      setPayments((data as AdvertisePayment[]) || []);
    }
    setLoading(false);
  }, [userId]);

  // Realtime subscription for user payments
  useEffect(() => {
    if (!userId) return;
    
    const channel = supabase
      .channel('rt-user-payments')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'advertise_payments', 
        filter: `user_id=eq.${userId}` 
      }, fetchUserPayments)
      .subscribe();
      
    fetchUserPayments();
    
    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [userId, fetchUserPayments]);

  return { 
    payments, 
    loading, 
    error, 
    fetchUserPayments,
    totalEarnings: payments.reduce((sum, p) => sum + Number(p.amount_ngn), 0),
    completedPayments: payments.filter(p => p.payment_status === 'completed')
  };
}

export function useAdminAdvertisePayments() {
  const [payments, setPayments] = useState<AdvertisePayment[]>([]);
  const [weeklyPayouts, setWeeklyPayouts] = useState<WeeklyPayoutSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllPayments = useCallback(async (status?: AdvertisePayment['payment_status']) => {
    setLoading(true);
    setError(null);
    
    let query = supabase
      .from('advertise_payments')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (status) {
      query = query.eq('payment_status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      setError(error.message);
      setPayments([]);
    } else {
      setPayments((data as AdvertisePayment[]) || []);
    }
    setLoading(false);
  }, []);

  const calculateWeeklyPayouts = useCallback(async (targetWeek: string) => {
    setError(null);
    
    const { data, error } = await supabase
      .rpc('calculate_weekly_payout', { target_week: targetWeek });
      
    if (error) {
      setError(error.message);
      setWeeklyPayouts([]);
    } else {
      setWeeklyPayouts((data as WeeklyPayoutSummary[]) || []);
    }
  }, []);

  const processWeeklyPayments = useCallback(async (targetWeek: string, processedBy: string) => {
    const { data, error } = await supabase
      .rpc('process_weekly_payments', { 
        target_week: targetWeek, 
        processed_by: processedBy 
      });
      
    if (error) throw error;
    
    // Refresh payments after processing
    await fetchAllPayments();
    return data as number; // Returns count of processed payments
  }, [fetchAllPayments]);

  const updatePaymentStatus = useCallback(async (
    paymentId: string, 
    status: AdvertisePayment['payment_status'],
    notes?: string,
    transactionRef?: string
  ) => {
    const updateData: any = { payment_status: status };
    
    if (notes) updateData.payment_notes = notes;
    if (transactionRef) updateData.transaction_reference = transactionRef;
    if (status === 'completed') updateData.paid_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('advertise_payments')
      .update(updateData)
      .eq('id', paymentId)
      .select('*')
      .single();
      
    if (error) throw error;
    
    setPayments(prev => prev.map(p => 
      p.id === paymentId ? (data as AdvertisePayment) : p
    ));
    
    return data as AdvertisePayment;
  }, []);

  // Realtime subscription for all payments (admin view)
  useEffect(() => {
    const channel = supabase
      .channel('rt-admin-payments')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'advertise_payments' 
      }, () => fetchAllPayments())
      .subscribe();
      
    fetchAllPayments();
    
    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [fetchAllPayments]);

  return {
    payments,
    weeklyPayouts,
    loading,
    error,
    fetchAllPayments,
    calculateWeeklyPayouts,
    processWeeklyPayments,
    updatePaymentStatus,
    totalPayments: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + Number(p.amount_ngn), 0),
    pendingPayments: payments.filter(p => p.payment_status === 'pending'),
    completedPayments: payments.filter(p => p.payment_status === 'completed')
  };
}