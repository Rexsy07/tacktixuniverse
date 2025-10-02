import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DuplicateTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  reference_code: string;
  description: string;
  status: string;
  metadata: any;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Checks if a match win transaction already exists for a user and match
 */
export async function checkExistingWinTransaction(userId: string, matchId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'match_win')
      .contains('metadata', { match_id: matchId })
      .limit(1);
    
    if (error) {
      console.error('Error checking existing win transaction:', error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (e) {
    console.error('Error checking existing win transaction:', e);
    return false;
  }
}

/**
 * Finds duplicate match win transactions for the same user and match
 */
export async function findDuplicateWinTransactions(matchId: string): Promise<DuplicateTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('type', 'match_win')
      .contains('metadata', { match_id: matchId })
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error finding duplicate transactions:', error);
      return [];
    }
    
    // Group by user_id and find duplicates
    const userTransactions = new Map<string, DuplicateTransaction[]>();
    
    (data || []).forEach(tx => {
      const userId = tx.user_id;
      if (!userTransactions.has(userId)) {
        userTransactions.set(userId, []);
      }
      userTransactions.get(userId)!.push(tx);
    });
    
    // Return all transactions that are duplicates (more than 1 per user)
    const duplicates: DuplicateTransaction[] = [];
    userTransactions.forEach(transactions => {
      if (transactions.length > 1) {
        duplicates.push(...transactions);
      }
    });
    
    return duplicates;
  } catch (e) {
    console.error('Error finding duplicate transactions:', e);
    return [];
  }
}

/**
 * Removes duplicate win transactions, keeping only the first one
 */
export async function removeDuplicateWinTransactions(matchId: string): Promise<{ removed: number; kept: number }> {
  try {
    const duplicates = await findDuplicateWinTransactions(matchId);
    
    if (duplicates.length === 0) {
      return { removed: 0, kept: 0 };
    }
    
    console.log(`Found ${duplicates.length} duplicate transactions for match ${matchId}`);
    
    // Group by user_id
    const userTransactions = new Map<string, DuplicateTransaction[]>();
    duplicates.forEach(tx => {
      const userId = tx.user_id;
      if (!userTransactions.has(userId)) {
        userTransactions.set(userId, []);
      }
      userTransactions.get(userId)!.push(tx);
    });
    
    let removed = 0;
    let kept = 0;
    
    // For each user, keep the first transaction and remove the rest
    for (const [userId, transactions] of userTransactions) {
      if (transactions.length <= 1) continue;
      
      // Sort by created_at to keep the earliest
      transactions.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      const toKeep = transactions[0];
      const toRemove = transactions.slice(1);
      
      console.log(`User ${userId}: Keeping transaction ${toKeep.id}, removing ${toRemove.length} duplicates`);
      
      // Remove duplicate transactions
      for (const tx of toRemove) {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', tx.id);
        
        if (error) {
          console.error(`Failed to remove duplicate transaction ${tx.id}:`, error);
        } else {
          removed++;
          console.log(`Removed duplicate transaction ${tx.id} (amount: ${tx.amount})`);
        }
      }
      
      kept++;
    }
    
    return { removed, kept };
  } catch (e) {
    console.error('Error removing duplicate transactions:', e);
    throw e;
  }
}

/**
 * Safe wrapper for admin_set_match_winner that prevents duplicate transactions
 */
export async function safeAdminSetMatchWinner(
  matchId: string, 
  winnerId: string, 
  adminDecision: string
): Promise<void> {
  try {
    // Check if winner already has a win transaction for this match
    const hasExisting = await checkExistingWinTransaction(winnerId, matchId);
    
    if (hasExisting) {
      toast.error('Winner already has a win transaction for this match');
      throw new Error('Duplicate transaction prevented: Winner already has a win transaction for this match');
    }
    
    // Try the admin_set_match_winner function first
    let success = false;
    try {
      const { error } = await supabase.rpc('admin_set_match_winner', {
        p_match_id: matchId,
        p_winner_user_id: winnerId,
        p_admin_decision: adminDecision
      });
      
      if (!error) {
        success = true;
      } else {
        console.warn('admin_set_match_winner failed, trying fallback:', error);
      }
    } catch (rpcError) {
      console.warn('admin_set_match_winner RPC not available, trying fallback:', rpcError);
    }
    
    // Fallback: use settle_match_escrow if admin function doesn't exist
    if (!success) {
      console.log('Using settle_match_escrow as fallback');
      const { error: settleError } = await supabase.rpc('settle_match_escrow', {
        p_match_id: matchId,
        p_winner_id: winnerId,
        p_fee_percentage: 5 // Default fee percentage
      });
      
      if (settleError) {
        console.error('Fallback settle_match_escrow also failed:', settleError);
        throw settleError;
      }
      
      // Update match status manually if needed
      const { error: updateError } = await supabase
        .from('matches')
        .update({
          winner_id: winnerId,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', matchId);
      
      if (updateError) {
        console.warn('Failed to update match status:', updateError);
      }
    }
    
    // Double-check for duplicates after the operation
    setTimeout(async () => {
      try {
        const duplicates = await findDuplicateWinTransactions(matchId);
        if (duplicates.length > 0) {
          console.warn(`Detected ${duplicates.length} duplicate transactions after setting winner. Attempting cleanup...`);
          const result = await removeDuplicateWinTransactions(matchId);
          console.log(`Cleanup result: removed ${result.removed}, kept ${result.kept}`);
          
          if (result.removed > 0) {
            toast.success(`Cleaned up ${result.removed} duplicate transactions`);
          }
        }
      } catch (e) {
        console.error('Error during post-operation duplicate check:', e);
      }
    }, 2000);
    
  } catch (e) {
    console.error('Error in safeAdminSetMatchWinner:', e);
    throw e;
  }
}

/**
 * Admin utility to clean up all duplicate transactions in the system
 */
export async function cleanupAllDuplicateTransactions(): Promise<{ processed: number; removed: number; kept: number }> {
  try {
    // Get all matches that have completed transactions
    const { data: matches, error: matchError } = await supabase
      .from('transactions')
      .select('metadata->match_id')
      .eq('type', 'match_win')
      .not('metadata->match_id', 'is', null);
    
    if (matchError) {
      throw matchError;
    }
    
    const uniqueMatchIds = new Set<string>();
    (matches || []).forEach((match: any) => {
      const matchId = match.metadata?.match_id;
      if (matchId) uniqueMatchIds.add(matchId);
    });
    
    console.log(`Found ${uniqueMatchIds.size} matches with win transactions`);
    
    let totalRemoved = 0;
    let totalKept = 0;
    let processed = 0;
    
    for (const matchId of uniqueMatchIds) {
      try {
        const result = await removeDuplicateWinTransactions(matchId);
        totalRemoved += result.removed;
        totalKept += result.kept;
        processed++;
        
        if (result.removed > 0) {
          console.log(`Match ${matchId}: removed ${result.removed}, kept ${result.kept}`);
        }
      } catch (e) {
        console.error(`Error processing match ${matchId}:`, e);
      }
    }
    
    return { processed, removed: totalRemoved, kept: totalKept };
  } catch (e) {
    console.error('Error in cleanupAllDuplicateTransactions:', e);
    throw e;
  }
}