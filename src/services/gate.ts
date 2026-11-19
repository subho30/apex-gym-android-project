import { isSupabaseConfigured, edgeFunctionUrl, getAccessToken } from './supabase';

export interface GateTokenResponse {
  qrPayload: string;
  token: string;
  expiresInSeconds: number;
  memberName: string;
  memberId: string;
}

export interface GateVerifyResponse {
  verified: boolean;
  memberName?: string;
  memberId?: string;
  memberTier?: string;
  memberStatus?: string;
  message?: string;
  reason?: string;
}

/**
 * Request a fresh server-signed gate QR token.
 * Falls back to client-generated tokens in offline/demo mode.
 */
export async function generateGateToken(
  memberId: string,
  memberName: string
): Promise<GateTokenResponse> {
  // Offline / demo fallback: client-side token generation (not cryptographically signed)
  if (!isSupabaseConfigured) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const suffix = chars[Math.floor(Math.random() * chars.length)] + Math.floor(1 + Math.random() * 9);
    const token = `APX-${randomDigits}-${suffix}`;

    const payload = JSON.stringify({
      memberId,
      name: memberName,
      tokenId: token,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 35,
      club: 'APEX-PARK-STREET',
    });

    return {
      qrPayload: JSON.stringify({ payload, signature: 'demo-unsigned' }),
      token,
      expiresInSeconds: 30,
      memberName,
      memberId,
    };
  }

  // Production: call the edge function
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Not authenticated — cannot generate gate token');
  }

  const res = await fetch(edgeFunctionUrl('generate-gate-token'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Gate token request failed (${res.status})`);
  }

  return res.json();
}

/**
 * Verify a scanned QR code at the turnstile.
 * Called by staff scanner after reading a member's QR pass.
 */
export async function verifyGateToken(
  qrPayload: string,
  gate = 'Main Turnstile A'
): Promise<GateVerifyResponse> {
  // Offline / demo fallback: parse and do basic client-side checks
  if (!isSupabaseConfigured) {
    try {
      const parsed = JSON.parse(qrPayload);
      const innerPayload = JSON.parse(parsed.payload);

      // Check expiry
      const now = Math.floor(Date.now() / 1000);
      if (innerPayload.exp < now) {
        return {
          verified: false,
          reason: `QR expired ${now - innerPayload.exp}s ago. Ask for a live QR pass.`,
          memberName: innerPayload.name,
          memberId: innerPayload.memberId,
        };
      }

      return {
        verified: true,
        memberName: innerPayload.name,
        memberId: innerPayload.memberId,
        memberTier: innerPayload.tier || 'Pro',
        message: `Welcome, ${innerPayload.name}! Gate unlocked.`,
      };
    } catch {
      return { verified: false, reason: 'Invalid QR code format' };
    }
  }

  // Production: call the edge function
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { verified: false, reason: 'Staff session expired. Please log in again.' };
  }

  try {
    const res = await fetch(edgeFunctionUrl('verify-gate-token'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ qrPayload, gate }),
    });

    return res.json();
  } catch {
    return { verified: false, reason: 'Network error — could not reach verification server.' };
  }
}
