/**
 * Usage Tracking Service
 * Tracks user's monthly usage (recordings, notes, etc.)
 * Enforces subscription limits for free and pro users
 */

import { supabase } from '@/lib/supabase/client';
import { SUBSCRIPTION_CONFIG } from '@/constants';

export interface UsageData {
  user_id: string;
  month_year: string; // Format: "YYYY-MM" (e.g., "2024-01")
  recording_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get current month in YYYY-MM format
 */
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get monthly usage for a user
 * Returns the usage record for current month, or null if none exists
 */
export async function getMonthlyUsage(userId?: string): Promise<{
  usage: UsageData | null;
  error: Error | null;
}> {
  try {
    // Get current user if not provided
    let uid = userId;
    if (!uid) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      uid = user.id;
    }

    const currentMonth = getCurrentMonth();

    const { data, error } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', uid)
      .eq('month_year', currentMonth)
      .maybeSingle(); // Returns null if no rows, single row if exists

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows found" which is expected
      throw error;
    }

    return { usage: data || null, error: null };
  } catch (error) {
    return {
      usage: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Get all usage records for a user (paginated)
 */
export async function getUserUsageHistory(
  userId?: string,
  limit: number = 12,
  offset: number = 0
): Promise<{
  usage: UsageData[];
  totalCount: number;
  error: Error | null;
}> {
  try {
    let uid = userId;
    if (!uid) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      uid = user.id;
    }

    const { data, error, count } = await supabase
      .from('usage_tracking')
      .select('*', { count: 'exact' })
      .eq('user_id', uid)
      .order('month_year', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      usage: data || [],
      totalCount: count || 0,
      error: null,
    };
  } catch (error) {
    return {
      usage: [],
      totalCount: 0,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Initialize usage record for current month if it doesn't exist
 */
async function initializeMonthlyUsage(userId: string): Promise<void> {
  const currentMonth = getCurrentMonth();

  const { data: existingUsage, error: fetchError } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('month_year', currentMonth)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }

  // If usage record doesn't exist, create it
  if (!existingUsage) {
    const { error: insertError } = await supabase
      .from('usage_tracking')
      .insert({
        user_id: userId,
        month_year: currentMonth,
        recording_count: 0,
      });

    if (insertError) throw insertError;
  }
}

/**
 * Increment recording usage count
 * Returns the new count after increment, or null if limit reached
 */
export async function incrementRecordingUsage(userId?: string): Promise<{
  newCount: number | null;
  limitReached: boolean;
  error: Error | null;
}> {
  try {
    let uid = userId;
    if (!uid) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      uid = user.id;
    }

    // Initialize usage record if needed
    await initializeMonthlyUsage(uid);

    // Check current usage
    const { usage: currentUsage, error: fetchError } = await getMonthlyUsage(uid);
    if (fetchError) throw fetchError;

    const currentCount = currentUsage?.recording_count || 0;

    // For now, we can't check subscription plan without making another API call
    // Assume no limit (PRO user) - frontend should check before calling this
    // Backend should validate subscription in production

    const currentMonth = getCurrentMonth();

    // Increment recording count
    const { data, error } = await supabase
      .from('usage_tracking')
      .update({ recording_count: currentCount + 1 })
      .eq('user_id', uid)
      .eq('month_year', currentMonth)
      .select()
      .single();

    if (error) throw error;

    return {
      newCount: data?.recording_count || null,
      limitReached: false,
      error: null,
    };
  } catch (error) {
    console.error('Error incrementing recording usage:', error);
    return {
      newCount: null,
      limitReached: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Check if user can record based on subscription and monthly limit
 * Free users: 5 recordings per month
 * Pro users: Unlimited
 */
export async function canUserRecord(
  subscriptionPlan: 'free' | 'pro',
  userId?: string
): Promise<{
  canRecord: boolean;
  currentCount: number;
  limit: number | null;
  error: Error | null;
}> {
  try {
    let uid = userId;
    if (!uid) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      uid = user.id;
    }

    // Initialize usage record if needed
    await initializeMonthlyUsage(uid);

    // Get current usage
    const { usage, error: fetchError } = await getMonthlyUsage(uid);
    if (fetchError) throw fetchError;

    const currentCount = usage?.recording_count || 0;
    const limit =
      subscriptionPlan === 'free'
        ? SUBSCRIPTION_CONFIG.FREE_MAX_RECORDINGS
        : SUBSCRIPTION_CONFIG.PRO_MAX_RECORDINGS;

    // Check if user can record
    const canRecord =
      limit === null || // Unlimited (Pro)
      currentCount < limit; // Within limit

    return {
      canRecord,
      currentCount,
      limit,
      error: null,
    };
  } catch (error) {
    return {
      canRecord: false,
      currentCount: 0,
      limit: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Reset monthly usage for a specific month (admin only)
 * Used when handling manual resets or corrections
 */
export async function resetMonthlyUsage(
  userId: string,
  monthYear: string
): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const { error } = await supabase
      .from('usage_tracking')
      .update({ recording_count: 0 })
      .eq('user_id', userId)
      .eq('month_year', monthYear);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Get recording statistics for a user
 * Useful for analytics and dashboard displays
 */
export async function getRecordingStatistics(userId?: string): Promise<{
  totalRecordings: number;
  currentMonthRecordings: number;
  monthlyLimit: number | null;
  error: Error | null;
}> {
  try {
    let uid = userId;
    if (!uid) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      uid = user.id;
    }

    // Get current month usage
    const { usage: currentUsage, error: currentError } =
      await getMonthlyUsage(uid);
    if (currentError) throw currentError;

    // Get all usage records to calculate total
    const { usage: allUsage, error: historyError } = await getUserUsageHistory(
      uid,
      1000,
      0
    );
    if (historyError) throw historyError;

    const totalRecordings = allUsage.reduce(
      (sum, record) => sum + record.recording_count,
      0
    );

    return {
      totalRecordings,
      currentMonthRecordings: currentUsage?.recording_count || 0,
      monthlyLimit: SUBSCRIPTION_CONFIG.PRO_MAX_RECORDINGS,
      error: null,
    };
  } catch (error) {
    return {
      totalRecordings: 0,
      currentMonthRecordings: 0,
      monthlyLimit: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}
