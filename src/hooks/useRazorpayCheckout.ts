/**
 * useRazorpayCheckout Hook
 * Manages Razorpay checkout flow using React Native SDK
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { razorpayService } from '../services/razorpay.service';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import type {
  BillingCycle,
  CreateSubscriptionResponse,
} from '../types/subscription.types';

interface UseRazorpayCheckoutProps {
  onSuccess?: () => void | Promise<void>;
  onError?: (error: string) => void;
}

export function useRazorpayCheckout({
  onSuccess,
  onError,
}: UseRazorpayCheckoutProps) {
  const { user } = useAuth();
  const { refetch } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);

  const initiateCheckout = useCallback(
    async (billingCycle: BillingCycle) => {
      if (!user) {
        const errorMsg = 'Please sign in to upgrade';
        onError?.(errorMsg);
        return;
      }

      setIsLoading(true);

      try {
        // Step 1: Create subscription on server
        const subscriptionData: CreateSubscriptionResponse =
          await razorpayService.createSubscription(billingCycle);

        // Step 2: Open Razorpay checkout using native SDK
        const options = {
          description: `${
            billingCycle === 'monthly' ? 'Monthly' : 'Yearly'
          } OSCAR Pro Subscription`,
          image: 'https://i.imgur.com/3g7nmLc.png', // Oscar logo URL
          currency: 'INR',
          key: subscriptionData.razorpayKeyId,
          subscription_id: subscriptionData.subscriptionId,
          name: 'OSCAR Pro',
          prefill: {
            email: user.email || '',
            contact: '',
          },
          theme: {
            color: '#06b6d4',
          },
        };

        RazorpayCheckout.open(options)
          .then((data: any) => {
            // Payment successful - verify on backend
            handlePaymentSuccess(data);
          })
          .catch((error: any) => {
            // Payment failed or cancelled
            handlePaymentError(error);
          });
      } catch (error) {
        console.error('Checkout error:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Checkout failed';
        onError?.(errorMessage);
        Alert.alert('Checkout Failed', errorMessage, [{ text: 'OK' }]);
        setIsLoading(false);
      }
    },
    [user, onSuccess, onError, refetch]
  );

  const handlePaymentSuccess = async (data: any) => {
    try {
      // Verify payment on backend
      await razorpayService.verifyPayment({
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_subscription_id: data.razorpay_subscription_id,
        razorpay_signature: data.razorpay_signature,
      });

      Alert.alert(
        'Success',
        'Your subscription has been activated! Welcome to Pro.',
        [
          {
            text: 'OK',
            onPress: () => {
              refetch();
              onSuccess?.();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Verification error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Payment verification failed';
      Alert.alert('Verification Failed', errorMessage, [{ text: 'OK' }]);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    const errorMessage = error.description || 'Payment failed or was cancelled';
    Alert.alert('Payment Failed', errorMessage, [{ text: 'OK' }]);
    onError?.(errorMessage);
    setIsLoading(false);
  };

  return {
    initiateCheckout,
    isLoading,
  };
}
