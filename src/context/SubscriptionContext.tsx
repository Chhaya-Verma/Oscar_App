import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase/client';
import { getMonthlyUsage } from '@/services/usage.service';
import { getNotesCount } from '@/services/notes.service';
import { vocabularyService } from '@/services/vocabulary.service';
import { SUBSCRIPTION_CONFIG } from '@/constants';

interface UsageStatsResponse {
  tier: 'free' | 'pro';
  status: string;
  billingCycle: string | null;
  currentPeriodEnd: string | null;
  recordingsThisMonth: number;
  recordingsLimit: number | null;
  notesCount: number;
  notesLimit: number | null;
  isProUser: boolean;
  canRecord: boolean;
  canCreateNote: boolean;
}

interface SubscriptionContextType {
  // Subscription data
  plan: 'free' | 'pro';
  isProUser: boolean;
  status: string;
  billingCycle: string | null;
  currentPeriodEnd: string | null;

  // Usage data
  recordingsThisMonth: number;
  recordingsLimit: number | null;
  notesCount: number;
  notesLimit: number | null;
  vocabularyCount: number;
  vocabularyLimit: number | null;

  // Computed values
  canRecord: boolean;
  canCreateNote: boolean;
  remainingRecordings: number | null;
  remainingNotes: number | null;
  remainingVocabulary: number | null;

  // State
  isLoading: boolean;
  error: string | null;

  // Actions
  refetch: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscription details
  const [status, setStatus] = useState('active');
  const [billingCycle, setBillingCycle] = useState<string | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);

  // Usage data
  const [recordingsThisMonth, setRecordingsThisMonth] = useState(0);
  const [recordingsLimit, setRecordingsLimit] = useState<number | null>(
    SUBSCRIPTION_CONFIG.FREE_MAX_RECORDINGS
  );
  const [notesCount, setNotesCount] = useState(0);
  const [notesLimit, setNotesLimit] = useState<number | null>(
    SUBSCRIPTION_CONFIG.FREE_MAX_NOTES
  );
  const [vocabularyCount, setVocabularyCount] = useState(0);
  const [vocabularyLimit, setVocabularyLimit] = useState<number | null>(
    SUBSCRIPTION_CONFIG.FREE_MAX_VOCABULARY
  );

  // Computed values
  const [canRecord, setCanRecord] = useState(true);
  const [canCreateNote, setCanCreateNote] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user) {
      // Reset to free tier defaults when not logged in
      setPlan('free');
      setStatus('active');
      setBillingCycle(null);
      setCurrentPeriodEnd(null);
      setRecordingsThisMonth(0);
      setRecordingsLimit(SUBSCRIPTION_CONFIG.FREE_MAX_RECORDINGS);
      setNotesCount(0);
      setNotesLimit(SUBSCRIPTION_CONFIG.FREE_MAX_NOTES);
      setVocabularyCount(0);
      setVocabularyLimit(SUBSCRIPTION_CONFIG.FREE_MAX_VOCABULARY);
      setCanRecord(true);
      setCanCreateNote(true);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);

      // Get subscription plan from user metadata
      const { data: { user: currentUser }, error: userError } =
        await supabase.auth.getUser();

      if (userError || !currentUser) {
        throw new Error('Failed to fetch user data');
      }

      const userPlan = (currentUser.user_metadata?.plan || 'free') as
        | 'free'
        | 'pro';
      setPlan(userPlan);
      setStatus(currentUser.user_metadata?.subscription_status || 'active');
      setBillingCycle(currentUser.user_metadata?.billing_cycle || null);
      setCurrentPeriodEnd(currentUser.user_metadata?.current_period_end || null);

      // Get recording usage
      const { usage: monthlyUsage, error: usageError } =
        await getMonthlyUsage(user.id);

      if (usageError) {
        console.error('Error fetching monthly usage:', usageError);
      }

      const currentRecordings = monthlyUsage?.recording_count || 0;
      setRecordingsThisMonth(currentRecordings);

      // Set limits based on plan
      if (userPlan === 'pro') {
        setRecordingsLimit(null); // Unlimited
        setNotesLimit(null); // Unlimited
        setVocabularyLimit(SUBSCRIPTION_CONFIG.PRO_MAX_VOCABULARY);
      } else {
        setRecordingsLimit(SUBSCRIPTION_CONFIG.FREE_MAX_RECORDINGS);
        setNotesLimit(SUBSCRIPTION_CONFIG.FREE_MAX_NOTES);
        setVocabularyLimit(SUBSCRIPTION_CONFIG.FREE_MAX_VOCABULARY);
      }

      // Check if user can record/create notes
      const canRecordNow =
        recordingsLimit === null || currentRecordings < recordingsLimit;
      setCanRecord(canRecordNow);
      setCanCreateNote(true); // For now, always allow note creation in UI

      // Get vocabulary count
      const { count: vocabCount, error: vocabError } =
        await vocabularyService.getVocabularyCount();

      if (vocabError) {
        console.error('Error fetching vocabulary count:', vocabError);
      }

      setVocabularyCount(vocabCount || 0);

      // Get notes count
      const { count: notesCountValue, error: notesCountError } =
        await getNotesCount();

      if (notesCountError) {
        console.error('Error fetching notes count:', notesCountError);
      }

      setNotesCount(notesCountValue || 0);
    } catch (err) {
      console.error('Error fetching subscription stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [user, recordingsLimit]);

  // Fetch when auth state changes
  useEffect(() => {
    fetchStats();
  }, [user, fetchStats]);

  // Calculate remaining
  const remainingRecordings =
    recordingsLimit !== null
      ? Math.max(0, recordingsLimit - recordingsThisMonth)
      : null;

  const remainingNotes =
    notesLimit !== null ? Math.max(0, notesLimit - notesCount) : null;

  const remainingVocabulary =
    vocabularyLimit !== null
      ? Math.max(0, vocabularyLimit - vocabularyCount)
      : null;

  const value: SubscriptionContextType = {
    plan,
    isProUser: plan === 'pro',
    status,
    billingCycle,
    currentPeriodEnd,
    recordingsThisMonth,
    recordingsLimit,
    notesCount,
    notesLimit,
    vocabularyCount,
    vocabularyLimit,
    canRecord,
    canCreateNote,
    remainingRecordings,
    remainingNotes,
    remainingVocabulary,
    isLoading,
    error,
    refetch: fetchStats,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
}
