/**
 * Subscription and Payment Types
 */

// Billing cycle types
export type BillingCycle = "monthly" | "yearly";

// Subscription tier
export type SubscriptionTier = "free" | "pro";

// Razorpay subscription statuses
export type RazorpaySubscriptionStatus =
  | "created"
  | "authenticated"
  | "active"
  | "pending"
  | "halted"
  | "cancelled"
  | "completed"
  | "expired"
  | "paused";

// Database subscription record
export interface DBSubscription {
  id: string;
  user_id: string;
  razorpay_customer_id: string | null;
  razorpay_subscription_id: string | null;
  razorpay_plan_id: string | null;
  tier: SubscriptionTier;
  billing_cycle: BillingCycle | null;
  status: RazorpaySubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

// For insert operations
export type DBSubscriptionInsert = Omit<
  DBSubscription,
  "id" | "created_at" | "updated_at"
>;

// For update operations
export type DBSubscriptionUpdate = Partial<
  Omit<DBSubscription, "id" | "created_at" | "updated_at" | "user_id">
>;

// Razorpay API subscription entity
export interface RazorpaySubscriptionEntity {
  id: string;
  customer_id: string;
  plan_id: string;
  status: RazorpaySubscriptionStatus;
  current_start: number; // Unix timestamp
  current_end: number; // Unix timestamp
  notes?: {
    user_id?: string;
    billing_cycle?: string;
  };
}

// API Request/Response Types
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

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  subscription?: DBSubscription;
}

// Webhook payload from Razorpay
export interface RazorpayWebhookPayload {
  event: string;
  account_id: string;
  created_at: number;
  payload: {
    subscription?: {
      entity: RazorpaySubscriptionEntity;
    };
  };
}

// Usage stats response from API
export interface UsageStatsResponse {
  tier: SubscriptionTier;
  status: RazorpaySubscriptionStatus;
  billingCycle: BillingCycle | null;
  currentPeriodEnd: string | null;
  recordingsThisMonth: number;
  recordingsLimit: number | null;
  notesCount: number;
  notesLimit: number | null;
  isProUser: boolean;
  canRecord: boolean;
  canCreateNote: boolean;
}

// Webhook event record
export interface WebhookEvent {
  id: string;
  razorpay_event_id: string;
  event_type: string;
  processed: boolean;
  payload: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

// Usage tracking record
export interface UsageTracking {
  id: string;
  user_id: string;
  month_year: string; // format: YYYY-MM
  recording_count: number;
  created_at: string;
  updated_at: string;
}
