import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Quick cleanup for the specific duplicate transaction issue
 * Match ID: 0b1e6380-70dd-455e-af73-19759daaa54f
 * User ID: 47540d0e-e76d-4411-be44-6ebd77bbec2f
 */
export async function quickCleanupDuplicateTransaction() {
  const matchId = '0b1e6380-70dd-455e-af73-19759daaa54f';
  const userId = '47540d0e-e76d-4411-be44-6ebd77bbec2f';

  try {
    console.log('Starting quick cleanup for duplicate transaction...');
    
    // 1. Find all match_win transactions for this user and match
    const { data: transactions, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'match_win')
      .contains('metadata', { match_id: matchId })
      .order('created_at', { ascending: true }); // Keep the first one (earliest)

    if (fetchError) {
      throw fetchError;
    }

    if (!transactions || transactions.length === 0) {
      console.log('No transactions found for this match and user');
      toast.info('No duplicate transactions found');
      return { found: 0, removed: 0, kept: 0 };
    }

    console.log(`Found ${transactions.length} transactions for match ${matchId}`);

    if (transactions.length === 1) {
      console.log('Only one transaction found, no duplicates to remove');
      toast.success('No duplicate transactions found');
      return { found: 1, removed: 0, kept: 1 };
    }

    // Keep the first transaction, remove the rest
    const toKeep = transactions[0];
    const toRemove = transactions.slice(1);

    console.log(`Keeping transaction: ${toKeep.id} (${toKeep.amount}, created: ${toKeep.created_at})`);
    
    let removed = 0;
    for (const tx of toRemove) {
      console.log(`Removing duplicate transaction: ${tx.id} (${tx.amount}, created: ${tx.created_at})`);
      
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', tx.id);

      if (deleteError) {
        console.error(`Failed to remove transaction ${tx.id}:`, deleteError);
        toast.error(`Failed to remove transaction ${tx.id}`);
      } else {
        removed++;
        console.log(`✓ Removed duplicate transaction ${tx.id}`);
      }
    }

    const result = { found: transactions.length, removed, kept: 1 };
    
    if (removed > 0) {
      toast.success(`Cleanup complete: Removed ${removed} duplicate transactions, kept 1 valid transaction`);
      console.log('Cleanup summary:', result);
    } else {
      toast.error('Failed to remove any duplicate transactions');
    }

    return result;

  } catch (error: any) {
    console.error('Error during quick cleanup:', error);
    toast.error(error.message || 'Failed to cleanup duplicate transactions');
    throw error;
  }
}

/**
 * Check if the specific duplicate transaction issue still exists
 */
export async function checkSpecificDuplicate() {
  const matchId = '0b1e6380-70dd-455e-af73-19759daaa54f';
  const userId = '47540d0e-e76d-4411-be44-6ebd77bbec2f';

  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('id, amount, created_at, reference_code')
      .eq('user_id', userId)
      .eq('type', 'match_win')
      .contains('metadata', { match_id: matchId })
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    const count = transactions?.length || 0;
    const totalAmount = transactions?.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0) || 0;

    console.log(`Found ${count} transactions for the specific match`);
    console.log('Transactions:', transactions);
    console.log(`Total amount: ₦${totalAmount}`);

    return {
      count,
      totalAmount,
      transactions: transactions || [],
      hasDuplicate: count > 1
    };

  } catch (error: any) {
    console.error('Error checking specific duplicate:', error);
    throw error;
  }
}

/**
 * Expose cleanup function to window for console access
 */
declare global {
  interface Window {
    quickCleanupDuplicate: () => Promise<any>;
    checkDuplicate: () => Promise<any>;
  }
}

if (typeof window !== 'undefined') {
  window.quickCleanupDuplicate = quickCleanupDuplicateTransaction;
  window.checkDuplicate = checkSpecificDuplicate;
}