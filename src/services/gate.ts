import { apiFetch } from './apiClient';

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

export async function generateGateToken(
  memberId: string,
  memberName: string
): Promise<GateTokenResponse> {
  try {
    const res = await apiFetch<GateTokenResponse>('/gate/generate-token', {
      method: 'POST'
    });
    return res;
  } catch {
    // Offline demo fallback
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
      club: 'APEX-PARK-STREET'
    });

    return {
      qrPayload: JSON.stringify({ payload, signature: 'demo-unsigned' }),
      token,
      expiresInSeconds: 30,
      memberName,
      memberId
    };
  }
}

export async function verifyGateToken(
  qrPayload: string,
  gate = 'Main Turnstile A'
): Promise<GateVerifyResponse> {
  try {
    const res = await apiFetch<GateVerifyResponse>('/gate/verify-token', {
      method: 'POST',
      body: JSON.stringify({ qrPayload, gate })
    });
    return res;
  } catch (err: any) {
    // Offline demo fallback
    try {
      const parsed = JSON.parse(qrPayload);
      const innerPayload = JSON.parse(parsed.payload);

      const now = Math.floor(Date.now() / 1000);
      if (innerPayload.exp < now) {
        return {
          verified: false,
          reason: `QR expired ${now - innerPayload.exp}s ago. Ask for a live QR pass.`,
          memberName: innerPayload.name,
          memberId: innerPayload.memberId
        };
      }

      return {
        verified: true,
        memberName: innerPayload.name,
        memberId: innerPayload.memberId,
        memberTier: innerPayload.tier || 'Pro',
        message: `Welcome, ${innerPayload.name}! Gate unlocked.`
      };
    } catch {
      return { verified: false, reason: 'Invalid QR code format' };
    }
  }
}
