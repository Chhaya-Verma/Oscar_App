export type BillingCycle = 'monthly' | 'yearly';

export type RazorpaySubscriptionStatus =
  | 'authenticated'
  | 'active'
  | 'pending'
  | 'halted'
  | 'cancelled'
  | 'completed'
  | 'expired'
  | 'paused';

export interface RazorpaySubscriptionEntity {
  id: string;
  status: RazorpaySubscriptionStatus;
  plan_id: string;
  customer_id: string;
  current_start?: number;
  current_end?: number;
  ended_at?: number;
  quantity: number;
  notes?: {
    user_id?: string;
    billing_cycle?: BillingCycle;
  };
  paid_count?: number;
  customer_notify?: number;
  created_at?: number;
  start_at?: number;
  end_at?: number | null;
  auth_attempts?: number;
  total_count?: number;
  has_scheduled_changes?: boolean;
  change_scheduled_at?: number;
  short_url?: string;
  offer_id?: string | null;
}

export interface CreateSubscriptionRequest {
  planType: BillingCycle;
}

export interface CreateSubscriptionResponse {
  subscriptionId: string;
  razorpayKeyId: string;
}

export interface VerifyPaymentRequest {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

export interface RazorpayWebhookPayload {
  id: string;
  event: string;
  created_at: number;
  account_id: string;
  payload: {
    subscription?: {
      entity: RazorpaySubscriptionEntity;
    };
  };
}
