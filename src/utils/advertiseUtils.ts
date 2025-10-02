import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';

/**
 * Calculate earnings based on views and rate per 1000 views
 */
export function calculateEarnings(views: number, ratePerThousand: number = 500): number {
  return Math.floor(views / 1000) * ratePerThousand;
}

/**
 * Format money amount in Nigerian Naira
 */
export function formatMoney(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

/**
 * Get the Monday of the current week (start of week for payouts)
 */
export function getCurrentWeekStart(): Date {
  return startOfWeek(new Date(), { weekStartsOn: 1 }); // 1 = Monday
}

/**
 * Get the Monday of the previous week
 */
export function getPreviousWeekStart(): Date {
  return subWeeks(getCurrentWeekStart(), 1);
}

/**
 * Get the Monday of the next week
 */
export function getNextWeekStart(): Date {
  return addWeeks(getCurrentWeekStart(), 1);
}

/**
 * Format a date as a week range (e.g., "Dec 4 - Dec 10, 2023")
 */
export function formatWeekRange(startDate: Date): string {
  const endDate = endOfWeek(startDate, { weekStartsOn: 1 });
  
  if (startDate.getMonth() === endDate.getMonth()) {
    return `${format(startDate, 'MMM d')} - ${format(endDate, 'd, yyyy')}`;
  } else {
    return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
  }
}

/**
 * Validate platform URL patterns
 */
export const platformValidators = {
  YouTube: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//,
  TikTok: /^https?:\/\/(www\.)?tiktok\.com\//,
  Instagram: /^https?:\/\/(www\.)?instagram\.com\//,
  Facebook: /^https?:\/\/(www\.)?facebook\.com\//,
  X: /^https?:\/\/(www\.)?(x\.com|twitter\.com)\//,
  Snapchat: /^https?:\/\/(www\.)?snapchat\.com\//,
  Other: null // No validation for other platforms
};

/**
 * Validate a URL for a specific platform
 */
export function validatePlatformUrl(platform: string, url: string): boolean {
  const validator = platformValidators[platform as keyof typeof platformValidators];
  if (!validator) return true; // Allow any URL for "Other" or unknown platforms
  return validator.test(url);
}

/**
 * Get platform-specific minimum view requirements
 */
export const platformMinViews = {
  YouTube: 1000,
  TikTok: 500,
  Instagram: 500,
  Facebook: 1000,
  X: 200,
  Snapchat: 300,
  Other: 500
};

/**
 * Get minimum views required for a platform
 */
export function getMinimumViews(platform: string): number {
  return platformMinViews[platform as keyof typeof platformMinViews] || 500;
}

/**
 * Calculate payout week for a given date (always Monday)
 */
export function calculatePayoutWeek(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

/**
 * Check if a submission is eligible for payout
 */
export function isEligibleForPayout(views: number, platform: string, status: string): boolean {
  if (status !== 'approved') return false;
  const minViews = getMinimumViews(platform);
  return views >= minViews;
}

/**
 * Generate payment reference ID
 */
export function generatePaymentReference(userId: string, week: Date): string {
  const weekStr = format(week, 'yyyyMMdd');
  const userStr = userId.slice(0, 8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PAY-${weekStr}-${userStr}-${random}`;
}

/**
 * Calculate total earnings for multiple submissions
 */
export function calculateTotalEarnings(submissions: Array<{ views: number; rate_per_1000: number }>): number {
  return submissions.reduce((total, submission) => {
    return total + calculateEarnings(submission.views, submission.rate_per_1000);
  }, 0);
}

/**
 * Group submissions by week for payout processing
 */
export function groupSubmissionsByWeek<T extends { created_at: string }>(
  submissions: T[]
): Record<string, T[]> {
  return submissions.reduce((groups, submission) => {
    const weekStart = calculatePayoutWeek(new Date(submission.created_at));
    const weekKey = format(weekStart, 'yyyy-MM-dd');
    
    if (!groups[weekKey]) {
      groups[weekKey] = [];
    }
    groups[weekKey].push(submission);
    
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Payment status helpers
 */
export const paymentStatusConfig = {
  pending: {
    label: 'Pending',
    color: 'yellow',
    description: 'Payment created, awaiting processing'
  },
  processing: {
    label: 'Processing',
    color: 'blue',
    description: 'Payment is being processed'
  },
  completed: {
    label: 'Completed',
    color: 'green',
    description: 'Payment has been sent successfully'
  },
  failed: {
    label: 'Failed',
    color: 'red',
    description: 'Payment failed and needs attention'
  }
};

/**
 * Get human-readable relative time
 */
export function getRelativeTime(date: string | Date): string {
  const then = new Date(date).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  
  if (weeks > 0) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
}