import 'dotenv/config';
import Razorpay from 'razorpay';
import crypto from 'node:crypto';

const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_U2A0cqshC1pfMN';
const key_secret = process.env.RAZORPAY_KEY_SECRET || 'klLuWqrmLLfNN5Vms8O9W7f1';

const razorpay = new Razorpay({
  key_id,
  key_secret
});

export async function createRazorpayOrder(
  amountInRupees: number,
  receiptId: string,
  notes: Record<string, string> = {}
) {
  try {
    const options = {
      amount: Math.round(amountInRupees * 100), // in paise
      currency: 'INR',
      receipt: receiptId.slice(0, 40),
      notes
    };

    const order = await razorpay.orders.create(options);
    console.log(`[Razorpay Order Created]: ${order.id} for ₹${amountInRupees}`);

    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: key_id
    };
  } catch (err: any) {
    console.error('[Razorpay Order Error]:', err?.error?.description || err?.message || err);
    return {
      success: false,
      error: err?.error?.description || err?.message || 'Failed to initialize payment gateway order'
    };
  }
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    const generated = crypto
      .createHmac('sha256', key_secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const isValid = generated === signature;
    console.log(`[Razorpay Signature Verification]: ${isValid ? 'VERIFIED' : 'INVALID'}`);
    return isValid;
  } catch (err) {
    console.error('[Signature Check Error]:', err);
    return false;
  }
}
