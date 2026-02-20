/**
 * Type declarations for react-native-razorpay
 */

declare module 'react-native-razorpay' {
  interface RazorpayCheckoutOptions {
    description: string;
    image?: string;
    currency: string;
    key: string;
    subscription_id?: string;
    order_id?: string;
    amount?: number;
    name: string;
    prefill?: {
      email?: string;
      contact?: string;
      name?: string;
    };
    theme?: {
      color?: string;
    };
    timeout?: number;
    readonly?: {
      contact?: boolean;
      email?: boolean;
    };
  }

  interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_subscription_id?: string;
    razorpay_order_id?: string;
    razorpay_signature: string;
  }

  const RazorpayCheckout: {
    open(options: RazorpayCheckoutOptions): Promise<RazorpayResponse>;
    close(): void;
    onPaymentSuccess(callback: (data: RazorpayResponse) => void): void;
    onPaymentError(callback: (data: any) => void): void;
  };

  export default RazorpayCheckout;
}
