import React, { memo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, CheckCircle2, QrCode } from 'lucide-react';
import { useDynamicQR } from '../hooks/useDynamicQR';

interface QrPassProps {
  memberId: string;
  name: string;
  scanAnimation: boolean;
  onTokenChange?: (token: string) => void;
}

export const QrPass = memo(function QrPass({
  memberId,
  name,
  scanAnimation,
  onTokenChange
}: QrPassProps) {
  const { token, secondsRemaining, qrPayload } = useDynamicQR(memberId, name);

  React.useEffect(() => {
    if (onTokenChange) {
      onTokenChange(token);
    }
  }, [token, onTokenChange]);

  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-3 px-1">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-lime-400 font-bold">
            Express Gate Access Pass
          </span>
          <h3 className="text-base font-bold text-white">{name}</h3>
        </div>
        <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full text-xs text-zinc-300">
          <RefreshCw className={`w-3 h-3 text-lime-400 ${secondsRemaining < 5 ? 'animate-spin' : ''}`} />
          <span className={secondsRemaining < 5 ? 'text-amber-400 font-bold' : ''}>
            {secondsRemaining}s
          </span>
        </div>
      </div>

      {/* Real Compliant QR Code Container */}
      <div className="relative mx-auto my-2 w-48 h-48 bg-white rounded-2xl p-3 flex flex-col items-center justify-center shadow-2xl">
        <QRCodeSVG
          value={qrPayload}
          size={168}
          level="M"
          includeMargin={false}
          imageSettings={{
            src: '/icon.svg',
            x: undefined,
            y: undefined,
            height: 32,
            width: 32,
            excavate: true
          }}
        />

        {scanAnimation && (
          <div className="absolute inset-0 bg-lime-400/90 rounded-2xl flex flex-col items-center justify-center transition-all animate-fade-in backdrop-blur-xs">
            <CheckCircle2 className="w-14 h-14 text-zinc-950 fill-lime-400 animate-bounce" />
            <span className="text-xs font-black uppercase tracking-wider text-zinc-950 bg-white px-3 py-1 rounded-full mt-2 shadow-md">
              Gate Unlocked
            </span>
          </div>
        )}
      </div>

      <p className="text-center text-[11px] font-mono text-zinc-400 mt-2">
        TOKEN: <span className="text-lime-400 font-semibold">{token}</span>
      </p>
      <p className="text-[10px] text-zinc-500 mt-0.5">
        Auto-refreshes every 30s to prevent screenshot fraud
      </p>
    </div>
  );
});
