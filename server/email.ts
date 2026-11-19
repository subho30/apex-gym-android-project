import 'dotenv/config';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendWelcomeEmail(member: {
  name: string;
  email: string;
  memberId: string;
  tier: string;
  renewalDate: string;
}): Promise<boolean> {
  if (!resend || !member.email) {
    console.warn('[Email] Resend API key or email missing, skipping email.');
    return false;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Apex Gym <onboarding@resend.dev>',
      to: [member.email],
      subject: `Welcome to Apex Gym, ${member.name}! Your Digital Pass is Ready`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; background: #09090b; color: #f4f4f5; border-radius: 24px; padding: 32px; border: 1px solid #27272a;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #a3e635; color: #09090b; font-weight: 900; font-size: 20px; padding: 12px 20px; border-radius: 14px;">
              APEX GYM
            </div>
            <h1 style="color: #ffffff; font-size: 22px; margin-top: 16px; margin-bottom: 4px;">Welcome to the Club!</h1>
            <p style="color: #a1a1aa; font-size: 14px; margin: 0;">Park Street Flagship • Elite Strength & Conditioning</p>
          </div>

          <div style="background: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
            <p style="color: #a3e635; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Membership Active</p>
            <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 16px 0;">${member.name}</h2>
            <div style="display: flex; justify-content: space-between; border-top: 1px solid #27272a; padding-top: 12px; font-size: 13px;">
              <span style="color: #71717a;">Member ID:</span>
              <strong style="color: #a3e635; font-family: monospace;">${member.memberId}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 8px; font-size: 13px;">
              <span style="color: #71717a;">Membership Tier:</span>
              <strong style="color: #ffffff;">${member.tier}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 8px; font-size: 13px;">
              <span style="color: #71717a;">Renewal Date:</span>
              <strong style="color: #ffffff;">${member.renewalDate}</strong>
            </div>
          </div>

          <div style="background: #18181b; border-radius: 14px; padding: 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.6; color: #d4d4d8;">
            <strong style="color: #ffffff;">How to Access the Turnstiles:</strong><br />
            1. Open the Apex Gym App on your mobile device.<br />
            2. Your dynamic rolling QR code refreshes every 30 seconds.<br />
            3. Present it to the front-desk turnstile scanner for instant express entry.
          </div>

          <div style="text-align: center; border-top: 1px solid #27272a; padding-top: 20px; color: #71717a; font-size: 12px;">
            Apex Gym Park Street Flagship • 14/B Park Street, Kolkata<br />
            Need assistance? WhatsApp Concierge: +91 98300 00111
          </div>
        </div>
      `
    });

    if (error) {
      console.warn('[Resend Email Error]:', error);
      return false;
    }

    console.log(`[Email Sent] Resend dispatched welcome email to ${member.email} (ID: ${data?.id})`);
    return true;
  } catch (err: any) {
    console.error('[Resend Error]:', err?.message);
    return false;
  }
}

export async function sendClassBookingEmail(member: {
  name: string;
  email: string;
}, gymClass: {
  title: string;
  time: string;
  trainer: string;
  room: string;
}): Promise<boolean> {
  if (!resend || !member.email) return false;

  try {
    await resend.emails.send({
      from: 'Apex Gym <onboarding@resend.dev>',
      to: [member.email],
      subject: `Spot Confirmed: ${gymClass.title} (${gymClass.time})`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; background: #09090b; color: #f4f4f5; border-radius: 20px; padding: 24px; border: 1px solid #27272a;">
          <h2 style="color: #a3e635; margin: 0 0 8px 0;">Spot Reserved!</h2>
          <p style="color: #ffffff; font-size: 16px; font-weight: bold; margin: 0 0 16px 0;">${gymClass.title}</p>
          <div style="background: #18181b; padding: 16px; border-radius: 12px; font-size: 13px; line-height: 1.8;">
            <strong>Time:</strong> ${gymClass.time}<br />
            <strong>Studio:</strong> ${gymClass.room}<br />
            <strong>Coach:</strong> ${gymClass.trainer}<br />
            <strong>Member:</strong> ${member.name}
          </div>
          <p style="color: #71717a; font-size: 12px; margin-top: 16px;">Please arrive 5 minutes prior to warm-up. Towels provided at Bay A.</p>
        </div>
      `
    });
    return true;
  } catch {
    return false;
  }
}
