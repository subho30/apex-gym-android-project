import React, { useState } from 'react';
import { UserRole, UserSession } from '../../types';
import { sendOtp as sendOtpService, verifyOtp as verifyOtpService } from '../../services/auth';
import { MessageSquare, ShieldCheck, Sparkles, UserPlus, LogIn, Lock } from 'lucide-react';
import { SignUpWizard } from './SignUpWizard';

interface LoginPanelProps {
  lockRole?: UserRole;
  onLogin: (session: UserSession) => void;
}

export function LoginPanel({ lockRole, onLogin }: LoginPanelProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<UserRole>(lockRole || 'member');
  const [step, setStep] = useState<1 | 2>(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [err, setErr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [simulatedSms, setSimulatedSms] = useState<string | null>(null);

  const inputClass =
    'w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-3 text-sm text-white focus:outline-none focus:border-lime-400 placeholder:text-zinc-600';

  if (mode === 'signup' && !lockRole) {
    return (
      <SignUpWizard
        onComplete={(session) => onLogin(session)}
        onCancel={() => setMode('signin')}
      />
    );
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMobile = mobile.replace(/\s+/g, '').replace(/^\+91/, '');
    if (!/^\d{10}$/.test(cleanMobile)) {
      setErr('Please enter a valid 10-digit mobile number');
      return;
    }
    setErr('');
    setIsLoading(true);

    const result = await sendOtpService(cleanMobile);
    setIsLoading(false);

    if (!result.success) {
      setErr(result.error || 'Failed to dispatch verification code');
      return;
    }

    const code = result.code || '4829';
    setOtp(code);
    setSimulatedSms(`Your Apex Gym security code is ${code}. Valid for 10 minutes.`);
    setTimeout(() => setSimulatedSms(null), 8000);
    setStep(2);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setErr('Please enter the 4-digit code');
      return;
    }
    setErr('');
    setIsLoading(true);

    const cleanMobile = mobile.replace(/\s+/g, '').replace(/^\+91/, '');
    const result = await verifyOtpService(cleanMobile, otp.trim());
    setIsLoading(false);

    if (!result.success || !result.session) {
      setErr(result.error || 'Verification failed. Please check the code.');
      return;
    }

    onLogin({
      role: role || result.session.role,
      name: result.session.name,
      memberId: result.session.memberId,
      mobile: result.session.phone || cleanMobile
    });
  };

  return (
    <div className="relative px-6 py-8 space-y-6">
      {/* Authentic Incoming SMS Banner Animation */}
      {simulatedSms && (
        <div className="absolute top-2 left-4 right-4 z-50 animate-bounce bg-zinc-800/95 border border-lime-400/60 p-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-lime-400 text-zinc-950 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold">
              <span>MESSAGES • NOW</span>
              <span className="text-lime-400 font-bold">Apex Security</span>
            </div>
            <p className="text-xs text-white font-medium mt-0.5">{simulatedSms}</p>
          </div>
        </div>
      )}

      {/* Brand Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-lime-400 text-zinc-950 font-black flex items-center justify-center text-xl shadow-lg shadow-lime-400/20">
          AX
        </div>
        <div>
          <p className="text-xl font-black text-white leading-tight tracking-tight">APEX GYM</p>
          <p className="text-xs text-zinc-400">
            {lockRole ? 'Staff & Turnstile Gate Controller' : 'Digital Member Access Pass'}
          </p>
        </div>
      </div>

      {/* Top Toggle: Sign In vs Join */}
      {!lockRole && step === 1 && (
        <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mode === 'signin' ? 'bg-lime-400 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mode === 'signup' ? 'bg-lime-400 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Join Apex Gym</span>
          </button>
        </div>
      )}

      {/* Form Step 1: Mobile Phone */}
      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Registered Mobile Number
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-xs text-zinc-500 font-medium">+91</span>
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                inputMode="tel"
                placeholder="98300 10001"
                className={`pl-12 ${inputClass}`}
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Enter your 10-digit phone number to receive your secure gate pass token.
            </p>
          </div>

          {err && <p className="text-xs text-red-400 font-medium">{err}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-lime-400 py-3.5 text-xs font-bold text-zinc-950 uppercase tracking-wider hover:bg-lime-300 transition shadow-lg shadow-lime-400/20 disabled:opacity-50"
          >
            {isLoading ? 'Sending Security Code…' : 'Send Verification Code'}
          </button>
        </form>
      ) : (
        /* Form Step 2: Verification Code */
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="text-center space-y-1">
            <h4 className="text-sm font-bold text-white">Enter 4-Digit Code</h4>
            <p className="text-xs text-zinc-400">
              Dispatched to <strong className="text-white">+91 {mobile}</strong>
            </p>
          </div>

          <div>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={4}
              autoFocus
              inputMode="numeric"
              placeholder="••••"
              className={`text-center font-mono tracking-widest text-xl py-3 ${inputClass}`}
            />
          </div>

          {err && <p className="text-xs text-red-400 font-medium text-center">{err}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-lime-400 py-3.5 text-xs font-bold text-zinc-950 uppercase tracking-wider hover:bg-lime-300 transition shadow-lg shadow-lime-400/20 disabled:opacity-50"
          >
            {isLoading ? 'Verifying…' : 'Verify & Launch Gate Pass'}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep(1);
              setOtp('');
              setErr('');
            }}
            className="w-full text-xs text-zinc-400 hover:text-white text-center block"
          >
            Change Mobile Number
          </button>
        </form>
      )}

      {/* Staff & Admin Direct Access Button (Clean & Professional) */}
      {!lockRole && step === 1 && (
        <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
          <span className="text-zinc-500 text-[11px]">Staff or Trainer?</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setRole('staff');
                setMobile('98300 10002');
              }}
              className="text-[11px] text-zinc-400 hover:text-lime-400 font-semibold"
            >
              Front Desk Scanner
            </button>
            <span className="text-zinc-700">•</span>
            <button
              type="button"
              onClick={() => {
                setRole('manager');
                setMobile('98300 10003');
              }}
              className="text-[11px] text-zinc-400 hover:text-lime-400 font-semibold"
            >
              Manager Suite
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
