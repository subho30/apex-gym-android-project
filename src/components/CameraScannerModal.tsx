import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, AlertCircle, RefreshCw } from 'lucide-react';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedText: string) => void;
}

export function CameraScannerModal({ isOpen, onClose, onScanSuccess }: CameraScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        setErrorMessage('Camera access is not supported on this device/browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setHasCamera(true);
      }

      // Start barcode detection loop if available
      // @ts-ignore
      if ('BarcodeDetector' in window) {
        try {
          // @ts-ignore
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          intervalRef.current = window.setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  const rawVal = barcodes[0].rawValue;
                  stopCamera();
                  onScanSuccess(rawVal);
                }
              } catch {
                // Ignore detection errors during frames
              }
            }
          }, 300);
        } catch {
          // Fallback if BarcodeDetector fails constructor
        }
      }
    } catch (err: any) {
      setHasCamera(false);
      setErrorMessage(err?.message || 'Could not access device camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-lime-400" />
            <h3 className="text-sm font-bold text-white">Live Camera QR Scanner</h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 rounded-full text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative aspect-square w-full bg-zinc-950 flex items-center justify-center overflow-hidden">
          {hasCamera !== false ? (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Target Aim Box Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-56 border-2 border-lime-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(163,230,53,0.3)]">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-lime-400 animate-pulse shadow-[0_0_8px_#a3e635]" />
                </div>
              </div>
              <p className="absolute bottom-4 text-xs font-semibold text-zinc-300 bg-black/60 px-3 py-1 rounded-full">
                Align the member's QR code within the frame
              </p>
            </>
          ) : (
            <div className="px-6 py-8 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-sm font-semibold text-white">Camera Unavailable</p>
              <p className="text-xs text-zinc-400">{errorMessage}</p>
              <button
                onClick={startCamera}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-400 text-zinc-950 font-bold text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Camera Permission
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 text-center">
          <p className="text-[11px] text-zinc-400">
            Turnstile Gate Scanner • Front Desk Staff Pass Verification
          </p>
        </div>
      </div>
    </div>
  );
}
