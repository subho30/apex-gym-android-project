import { apiFetch } from './apiClient';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface PaymentCheckoutOptions {
  amount: number;
  planName: string;
  memberId: string;
  memberName: string;
  memberEmail?: string;
  memberPhone?: string;
  onSuccess: (paymentId: string) => void;
  onFailure?: (error: string) => void;
}

export async function launchRazorpayPayment({
  amount,
  planName,
  memberId,
  memberName,
  memberEmail,
  memberPhone,
  onSuccess,
  onFailure
}: PaymentCheckoutOptions): Promise<void> {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    if (onFailure) onFailure('Razorpay SDK failed to load. Please check your internet connection.');
    return;
  }

  try {
    // 1. Create order on server
    const orderRes = await apiFetch<{
      success: boolean;
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
    }>('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ amount, planName, memberId })
    });

    if (!orderRes.success || !orderRes.orderId) {
      throw new Error('Failed to create payment order');
    }

    // 2. Open Razorpay Gateway Popup
    const options = {
      key: orderRes.keyId || 'rzp_test_U2A0cqshC1pfMN',
      amount: orderRes.amount,
      currency: orderRes.currency || 'INR',
      name: 'APEX GYM',
      description: `${planName} Membership Enrollment`,
      image: '/icon.svg',
      order_id: orderRes.orderId,
      prefill: {
        name: memberName,
        email: memberEmail || '',
        contact: memberPhone || ''
      },
      theme: {
        color: '#a3e635' // Apex Neon Lime
      },
      handler: async (response: any) => {
        try {
          // 3. Verify signature on server
          const verifyRes = await apiFetch<{ success: boolean; message: string; paymentId: string }>(
            '/payments/verify',
            {
              method: 'POST',
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                memberId,
                planName,
                amount
              })
            }
          );

          if (verifyRes.success) {
            onSuccess(response.razorpay_payment_id);
          } else {
            if (onFailure) onFailure('Payment verification failed');
          }
        } catch (err: any) {
          if (onFailure) onFailure(err?.message || 'Verification network error');
        }
      },
      modal: {
        ondismiss: () => {
          if (onFailure) onFailure('Payment was cancelled by user');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err: any) {
    console.error('[Payment Error]:', err);
    if (onFailure) onFailure(err?.message || 'Payment initiation failed');
  }
}
