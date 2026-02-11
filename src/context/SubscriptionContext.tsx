import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase/client';

interface SubscriptionContextType {
  plan: 'free' | 'pro';
  isProUser: boolean;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPlan('free');
      setIsLoading(false);
      return;
    }

    // Fetch subscription status from user metadata
    const fetchSubscriptionStatus = async () => {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        
        if (error || !currentUser) {
          setPlan('free');
          setIsLoading(false);
          return;
        }

        // Check user metadata for plan
        const userPlan = (currentUser.user_metadata?.plan || 'free') as 'free' | 'pro';
        setPlan(userPlan);
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setPlan('free');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [user]);

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        isProUser: plan === 'pro',
        isLoading,
      }}
    >
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
