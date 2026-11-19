import { useState, useEffect, useRef } from 'react';

export const QR_EXPIRY_SECONDS = 30;

export function useDynamicQR(memberId: string, memberName: string) {
  const [secondsRemaining, setSecondsRemaining] = useState(25);
  const [token, setToken] = useState('APX-8942-X9');
  const endsAtRef = useRef(Date.now() + 25000);

  useEffect(() => {
    const generateNewToken = () => {
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
      const suffix = chars[Math.floor(Math.random() * chars.length)] + Math.floor(1 + Math.random() * 9);
      return `APX-${randomDigits}-${suffix}`;
    };

    const tick = () => {
      if (document.hidden) return;
      let left = Math.ceil((endsAtRef.current - Date.now()) / 1000);
      if (left <= 0) {
        const nextToken = generateNewToken();
        setToken(nextToken);
        endsAtRef.current = Date.now() + QR_EXPIRY_SECONDS * 1000;
        left = QR_EXPIRY_SECONDS;
      }
      setSecondsRemaining(left);
    };

    tick();
    const intervalId = setInterval(tick, 1000);

    const onVisibilityChange = () => {
      if (!document.hidden) {
        tick();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  // Standardized verifiable JSON payload encoded inside the QR code
  const qrPayload = JSON.stringify({
    memberId,
    name: memberName,
    token,
    issuedAt: Date.now(),
    expiresInSec: secondsRemaining,
    club: 'APEX-PARK-STREET'
  });

  return { token, secondsRemaining, qrPayload };
}
