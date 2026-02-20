/**
 * Razorpay Service
 * Handles all Razorpay API interactions for the React Native app
 */

import { supabase } from '../lib/supabase/client';
import type {
  BillingCycle,
  CreateSubscriptionResponse,
  VerifyPaymentRequest,
} from '../types/subscription.types';

const API_BASE_URL = 'https://oscar.samyarth.org/api';

export const razorpayService = {
  /**
   * Create a subscription on the server
   */
  async createSubscription(
    billingCycle: BillingCycle
  ): Promise<CreateSubscriptionResponse> {
    try {
      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${API_BASE_URL}/razorpay/create-subscription`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ planType: billingCycle }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create subscription');
      }

      const data: CreateSubscriptionResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Create subscription error:', error);
      throw error;
    }
  },

  /**
   * Verify payment after Razorpay checkout
   */
  async verifyPayment(
    verifyData: VerifyPaymentRequest
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/razorpay/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(verifyData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Payment verification failed');
      }

      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error) {
      console.error('Verify payment error:', error);
      throw error;
    }
  },

  /**
   * Cancel the user's subscription
   */
  async cancelSubscription(): Promise<{ success: boolean; message: string }> {
    try {
      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/razorpay/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  },
};
