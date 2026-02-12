"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase/client";
import type {
  UsageStatsResponse,
  SubscriptionTier,
} from "@/types/subscription.types";
import { SUBSCRIPTION_CONFIG, API_CONFIG } from "@/constants/index";

interface SubscriptionContextType {
  // Subscription data
  tier: SubscriptionTier;
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
  isProUser: boolean;
  canRecord: boolean;
  canCreateNote: boolean;
  canAddVocabulary: boolean;
  remainingRecordings: number | null;
  remainingNotes: number | null;
  remainingVocabulary: number | null;

  // State
  isLoading: boolean;
  error: string | null;

  // Actions
  refetch: () => Promise<void>;
  incrementUsage: () => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { user, isLoading: authLoading } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [status, setStatus] = useState("active");
  const [billingCycle, setBillingCycle] = useState<string | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);

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

  const [isProUser, setIsProUser] = useState(false);
  const [canRecord, setCanRecord] = useState(true);
  const [canCreateNote, setCanCreateNote] = useState(true);
  const [canAddVocabulary, setCanAddVocabulary] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user) {
      // Reset to free tier defaults when not logged in
      setTier("free");
      setStatus("active");
      setBillingCycle(null);
      setCurrentPeriodEnd(null);
      setRecordingsThisMonth(0);
      setRecordingsLimit(SUBSCRIPTION_CONFIG.FREE_MAX_RECORDINGS);
      setNotesCount(0);
      setNotesLimit(SUBSCRIPTION_CONFIG.FREE_MAX_NOTES);
      setVocabularyCount(0);
      setVocabularyLimit(SUBSCRIPTION_CONFIG.FREE_MAX_VOCABULARY);
      setIsProUser(false);
      setCanRecord(true);
      setCanCreateNote(true);
      setCanAddVocabulary(true);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Get auth token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch(API_CONFIG.USAGE_STATS, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log("API Error Response:", { status: response.status, error: errorData });
        
        if (response.status === 401) {
          console.error("Backend rejected token - checking Oscar Web configuration");
          throw new Error("Backend authentication failed - check Oscar Web token validation");
        }
        throw new Error(`Failed to fetch subscription stats: ${response.status} - ${errorData.error || ''}`);
      }

      const data: UsageStatsResponse = await response.json();

      setTier(data.tier);
      setStatus(data.status);
      setBillingCycle(data.billingCycle);
      setCurrentPeriodEnd(data.currentPeriodEnd);
      setRecordingsThisMonth(data.recordingsThisMonth);
      setRecordingsLimit(data.recordingsLimit);
      setNotesCount(data.notesCount);
      setNotesLimit(data.notesLimit);
      setIsProUser(data.isProUser);
      setCanRecord(data.canRecord);
      setCanCreateNote(data.canCreateNote);

      // Vocabulary - assume unlimited for pro, limited for free
      setVocabularyLimit(data.tier === "pro" ? null : SUBSCRIPTION_CONFIG.FREE_MAX_VOCABULARY);
      setCanAddVocabulary(
        data.tier === "pro" ? true : vocabularyCount < SUBSCRIPTION_CONFIG.FREE_MAX_VOCABULARY
      );
    } catch (err) {
      console.error("Error fetching subscription stats:", err);
      // Gracefully handle network errors - default to free tier
      // This allows the app to work even if backend is unavailable
      setTier("free");
      setStatus("active");
      setBillingCycle(null);
      setCurrentPeriodEnd(null);
      setRecordingsThisMonth(0);
      setRecordingsLimit(SUBSCRIPTION_CONFIG.FREE_MAX_RECORDINGS);
      setNotesCount(0);
      setNotesLimit(SUBSCRIPTION_CONFIG.FREE_MAX_NOTES);
      setIsProUser(false);
      setCanRecord(true);
      setCanCreateNote(true);
      setVocabularyLimit(SUBSCRIPTION_CONFIG.FREE_MAX_VOCABULARY);
      setCanAddVocabulary(vocabularyCount < SUBSCRIPTION_CONFIG.FREE_MAX_VOCABULARY);
      
      // Only set error if it's not a network error (network errors are expected in development)
      if (err instanceof TypeError && err.message.includes("Network")) {
        console.log("Network unavailable - using free tier defaults");
      } else {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, vocabularyCount]);

  // Fetch when auth state changes
  useEffect(() => {
    if (!authLoading) {
      fetchStats();
    }
  }, [authLoading, fetchStats]);

  const incrementUsage = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    if (tier === "free" && recordingsLimit && recordingsThisMonth >= recordingsLimit) {
      console.log("Recording limit reached for free tier");
      setCanRecord(false);
      return false;
    }

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      console.log("=== incrementUsage Debug ===");
      console.log("Session:", session);
      console.log("Token:", token);

      // Call Oscar Web backend API to increment usage
      const response = await fetch(API_CONFIG.USAGE_INCREMENT, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 403) {
          setCanRecord(false);
          return false;
        }
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        throw new Error(data.error || "Failed to increment usage");
      }

      const data = await response.json();
      setRecordingsThisMonth(data.recordingsThisMonth);
      setCanRecord(data.canRecord);

      return true;
    } catch (err) {
      // In development (network error), allow the recording but log it
      if (err instanceof TypeError && err.message.includes("Network")) {
        console.log("Development mode: Recording allowed (backend unavailable)");
        // For free tier in development, increment locally
        if (tier === "free" && recordingsLimit) {
          const newCount = recordingsThisMonth + 1;
          setRecordingsThisMonth(newCount);
          const stillCanRecord = newCount < recordingsLimit;
          setCanRecord(stillCanRecord);
          return stillCanRecord;
        }
        // For pro users, always allow
        return true;
      }
      console.error("Error incrementing usage:", err);
      return false;
    }
  }, [user, tier, recordingsThisMonth, recordingsLimit]);

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
    tier,
    status,
    billingCycle,
    currentPeriodEnd,
    recordingsThisMonth,
    recordingsLimit,
    notesCount,
    notesLimit,
    vocabularyCount,
    vocabularyLimit,
    isProUser,
    canRecord,
    canCreateNote,
    canAddVocabulary,
    remainingRecordings,
    remainingNotes,
    remainingVocabulary,
    isLoading,
    error,
    refetch: fetchStats,
    incrementUsage,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscriptionContext must be used within SubscriptionProvider');
  }
  return context;
}

