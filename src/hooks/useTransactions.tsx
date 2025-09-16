import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Transaction = Database['public']['Tables']['transactions']['Row'];

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const createDepositRequest = async (amount: number, reference: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'deposit',
          amount: amount,
          reference_code: reference,
          description: `Deposit request for ₦${amount.toLocaleString()}`,
          status: 'pending'
        });

      if (error) throw error;
      
      toast.success('Deposit request created successfully. Please complete the bank transfer.');
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message);
      console.error('Error creating deposit request:', err);
    }
  };

  const createWithdrawRequest = async (amount: number, bankDetails: any) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'withdrawal',
          amount: amount,
          reference_code: `WD-${Date.now()}`,
          description: `Withdrawal request for ₦${amount.toLocaleString()}`,
          status: 'pending',
          metadata: bankDetails
        });

      if (error) throw error;
      
      toast.success('Withdrawal request submitted successfully. Processing may take 24-48 hours.');
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message);
      console.error('Error creating withdrawal request:', err);
    }
  };

  return {
    transactions,
    loading,
    error,
    createDepositRequest,
    createWithdrawRequest,
    refetch: fetchTransactions
  };
}