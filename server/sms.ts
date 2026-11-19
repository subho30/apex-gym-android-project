import 'dotenv/config';

// Fast2SMS API Integration for Real Telecom SMS Delivery

export async function sendRealSms(phone: string, otpCode: string): Promise<{ success: boolean; message?: string }> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    console.warn('[SMS] No FAST2SMS_API_KEY found, skipping live SMS.');
    return { success: false, message: 'No API key configured' };
  }

  // Clean phone to 10 digits
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  if (cleanPhone.length !== 10) {
    return { success: false, message: 'Invalid 10-digit mobile number' };
  }

  try {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        route: 'otp',
        variables_values: otpCode,
        numbers: cleanPhone
      })
    });

    const data = (await response.json()) as any;
    console.log('[Fast2SMS Response]:', data);

    if (data.return === true || data.status_code === 200 || data.message?.[0]?.includes('Success')) {
      console.log(`[SMS Sent] Successfully dispatched OTP ${otpCode} to +91 ${cleanPhone}`);
      return { success: true, message: 'SMS delivered to phone' };
    }

    console.warn('[Fast2SMS Failed]:', data);
    return { success: false, message: data.message || 'SMS provider rejected request' };
  } catch (err: any) {
    console.error('[Fast2SMS Error]:', err?.message);
    return { success: false, message: err?.message };
  }
}
