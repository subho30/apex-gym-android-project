import { useState, useEffect, useRef, useCallback } from 'react';
import { generateGateToken } from '../services/gate';

export const QR_EXPIRY_SECONDS = 30;

export function useDynamicQR(memberId: string, memberName: string) {
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [token, setToken] = useState('APX-8942-X9');
  const [qrPayload, setQrPayload] = useState('');
  const endsAtRef = useRef(Date.now() + QR_EXPIRY_SECONDS * 1000);
  const isFetchingRef = useRef(false);

  const fetchToken = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await generateGateToken(memberId, memberName);
      setToken(res.token);
      setQrPayload(res.qrPayload);
      const ttl = res.expiresInSeconds || QR_EXPIRY_SECONDS;
      endsAtRef.current = Date.now() + ttl * 1000;
      setSecondsRemaining(ttl);
    } catch (err) {
      console.warn('Failed to generate gate token:', err);
    } finally {
      isFetchingRef.current = false;
    }
  }, [memberId, memberName]);

  useEffect(() => {
    fetchToken();

    const tick = () => {
      if (document.hidden) return;
      const left = Math.ceil((endsAtRef.current - Date.now()) / 1000);
      if (left <= 0) {
        fetchToken();
      } else {
        setSecondsRemaining(left);
      }
    };

    const intervalId = setInterval(tick, 1000);

    const onVisibilityChange = () => {
      if (!document.hidden) {
        const left = Math.ceil((endsAtRef.current - Date.now()) / 1000);
        if (left <= 0) {
          fetchToken();
        } else {
          setSecondsRemaining(left);
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [fetchToken]);

  return { token, secondsRemaining, qrPayload: qrPayload || token };
}
