"use client";

import { useState, useEffect, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { Alert } from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import { API_CONFIG } from "@/constants/index";
import { supabase } from "@/lib/supabase/client";
import type { BillingCycle } from "@/types/subscription.types";

// Razorpay options type for React Native
interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckoutProps {
  billingCycle: BillingCycle;
  userEmail?: string;
  userName?: string;
  onSuccess?: () => void | Promise<void>;
  onError?: (error: string) => void;
}

export function useRazorpayCheckout({
  billingCycle,
  userEmail,
  userName,
  onSuccess,
  onError,
}: RazorpayCheckoutProps) {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const initiateCheckout = useCallback(async () => {
    setIsLoading(true);

    try {
      // Get auth token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Create subscription via Oscar Web backend
      const response = await fetch(API_CONFIG.RAZORPAY_CREATE_SUBSCRIPTION, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ planType: billingCycle }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log("Razorpay API Error:", { status: response.status, error: errorData });
        
        if (response.status === 401) {
          console.error("Backend rejected token - Oscar Web token validation issue");
          throw new Error("Backend authentication failed");
        }
        throw new Error(errorData.error || "Failed to create subscription");
      }

      const { subscriptionId, razorpayKeyId } = await response.json();

      // Configure Razorpay options
      const options: RazorpayOptions = {
        key: razorpayKeyId,
        subscription_id: subscriptionId,
        name: "OSCAR Pro",
        description: `${
          billingCycle === "monthly" ? "Monthly" : "Yearly"
        } Subscription`,
        prefill: {
          name: userName,
          email: userEmail,
        },
        theme: {
          color: "#06b6d4", // cyan-500
        },
      };

      // Open Razorpay checkout with Promise-based API
      try {
        const data = await RazorpayCheckout.open(options);
        // Payment successful
        handlePaymentSuccess(subscriptionId);
      } catch (razorpayError: any) {
        // Payment cancelled or failed
        if (razorpayError.code !== 0) {
          // 0 means user cancelled, other codes mean actual errors
          throw new Error(`Razorpay error: ${razorpayError.description || 'Payment failed'}`);
        }
        // User cancelled - don't treat as error
        console.log("User cancelled payment");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to start checkout";
      
      // Handle network errors gracefully
      if (error instanceof TypeError && error.message.includes("Network")) {
        console.error(
          "Network Error: Cannot connect to Oscar Web backend.\n" +
          "Ensure Oscar Web is running at: https://oscar.samyarth.org\n" +
          "Using same Supabase project for both apps."
        );
        Alert.alert(
          "Connection Error",
          "Cannot connect to Oscar Web backend.\n\n" +
          "Please ensure:\n" +
          "1. Oscar Web backend is running\n" +
          "2. Same Supabase project is configured\n" +
          "3. Network is available"
        );
      } else {
        Alert.alert("Checkout Failed", errorMessage);
      }
      onError?.(errorMessage);
      setIsLoading(false);
    }
  }, [billingCycle, userEmail, userName, onError]);

  const handlePaymentSuccess = useCallback(
    async (subscriptionId: string) => {
      // In a React Native app, you would receive payment details from Razorpay
      // For web, this would be handled by the modal callback
      // This is a placeholder for the success handler
      try {
        Alert.alert(
          "Payment Successful!",
          "Welcome to OSCAR Pro. Enjoy unlimited access!"
        );

        onSuccess?.();
        navigation.navigate("billing" as never);
      } catch (error) {
        console.error("Post-payment error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess, navigation]
  );

  return {
    initiateCheckout,
    isLoading,
  };
}
