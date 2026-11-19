import React, { useState } from 'react';
import { UserRole, UserSession } from '../../types';
import { sendOtp as sendOtpService, verifyOtp as verifyOtpService } from '../../services/auth';

interface LoginPanelProps {
  lockRole?: UserRole;
  onLogin: (session: UserSession) => void;
}

const DEMO_ACCOUNTS: Record<UserRole, { name: string; memberId: string; mobile: string }> = {
  member: { name: 'Rohan Sharma', memberId: 'APX-2041', mobile: '9830010001' },
  staff: { name: 'Meera Joshi (Front Desk)', memberId: 'STAFF-102', mobile: '9830010002' },
  manager: { name: 'Anita Das (General Manager)', memberId: 'MGR-001', mobile: '9830010003' }
};

export function LoginPanel({ lockRole, onLogin }: LoginPanelProps) {
  const [role, setRole] = useState<UserRole>(lockRole || 'member');
  const [step, setStep] = useState<1 | 2>(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [err, setErr] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const inputClass =
    'w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-3 text-sm text-white focus:outline-none focus:border-lime-400/60 placeholder:text-zinc-600';

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMobile = mobile.replace(/\s+/g, '');
    if (!/^\d{10}$/.test(cleanMobile)) {
      setErr('Please enter a valid 10-digit mobile number');
      return;
    }
    setErr('');
    setIsLoading(true);

    const result = await sendOtpService(cleanMobile);
    setIsLoading(false);

    if (!result.success) {
      setErr(result.error || 'Failed to send OTP. Please try again.');
      return;
    }
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

    const cleanMobile = mobile.replace(/\s+/g, '');
    const result = await verifyOtpService(cleanMobile, otp.trim());
    setIsLoading(false);

    if (!result.success || !result.session) {
      setErr(result.error || 'Verification failed. Please check the code.');
      return;
    }

    onLogin({
      role: result.session.role,
      name: result.session.name,
      memberId: result.session.memberId,
      mobile: result.session.phone || cleanMobile
    });
  };

  const handleQuickDemoFill = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setMobile(DEMO_ACCOUNTS[selectedRole].mobile);
    setOtp('1234');
    setErr('');
  };

  return (
    <div className="px-6 py-8 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-lime-400 text-zinc-950 font-black flex items-center justify-center text-lg shadow-md shadow-lime-400/20">
          AX
        </div>
        <div>
          <p className="text-lg font-black text-white leading-tight">APEX GYM</p>
          <p className="text-xs text-zinc-400">
            {lockRole ? 'Operations & Staff Portal' : 'Sign in to access your digital pass'}
          </p>
        </div>
      </div>

      {!lockRole && step === 1 && (
        <div className="grid grid-cols-3 gap-2" role="tablist">
          {(['member', 'staff', 'manager'] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={role === r}
              onClick={() => {
                setRole(r);
                setErr('');
              }}
              className={`rounded-xl py-2 text-xs font-bold border transition ${
                role === r
                  ? 'bg-lime-400 text-zinc-950 border-lime-400 shadow-sm'
                  : 'border-zinc-800 text-zinc-300 hover:border-lime-400/40'
              }`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="space-y-3">
          <label className="block text-xs font-semibold text-zinc-400">
            Mobile Number
            <div className="relative mt-1">
              <span className="absolute left-3 top-3 text-xs text-zinc-500 font-medium">+91</span>
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                inputMode="tel"
                placeholder="98300 10001"
                className={`pl-11 ${inputClass}`}
              />
            </div>
          </label>
          {err && <p className="text-xs text-red-400">{err}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-lime-400 py-3 text-sm font-bold text-zinc-950 hover:bg-lime-300 transition shadow-md shadow-lime-400/20 disabled:opacity-50"
          >
            {isLoading ? 'Sending code…' : 'Send Verification Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-3">
          <label className="block text-xs font-semibold text-zinc-400">
            Enter 4-digit code sent to +91 {mobile}
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              inputMode="numeric"
              placeholder="1234"
              className={`mt-1 text-center font-mono tracking-widest text-lg ${inputClass}`}
            />
          </label>
          <p className="text-[11px] text-zinc-500">Demo verification code is: 1234</p>
          {err && <p className="text-xs text-red-400">{err}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-lime-400 py-3 text-sm font-bold text-zinc-950 hover:bg-lime-300 transition shadow-md shadow-lime-400/20 disabled:opacity-50"
          >
            {isLoading ? 'Verifying…' : 'Verify & Continue'}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setOtp('');
              setErr('');
            }}
            className="w-full text-xs text-zinc-400 hover:text-white"
          >
            Change Mobile Number
          </button>
        </form>
      )}

      {/* Quick Fill Demo Helper */}
      <div className="pt-2 border-t border-zinc-800/80">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5">
          Quick Demo Accounts
        </p>
        <div className="flex gap-2">
          {(['member', 'staff', 'manager'] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleQuickDemoFill(r)}
              className="text-[11px] px-2 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
            >
              Fill {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
