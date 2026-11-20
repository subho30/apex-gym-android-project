import React, { useState } from 'react';
import { Check, ShieldCheck, ArrowRight, ArrowLeft, Sparkles, Dumbbell, MessageSquare, Award } from 'lucide-react';
import { UserSession, MemberProfile, PricingPlan } from '../../types';
import { PRICING_PLANS } from '../../constants/initialData';
import { sendOtp, signUpMember } from '../../services/auth';

interface SignUpWizardProps {
  initialPhone?: string;
  onComplete: (session: UserSession, member: MemberProfile) => void;
  onCancel: () => void;
}

export function SignUpWizard({ initialPhone, onComplete, onCancel }: SignUpWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>(PRICING_PLANS[1]); // Default Annual Pro
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(initialPhone || '');
  const [email, setEmail] = useState('');
  const [goal, setGoal] = useState('Build muscle & strength');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [otp, setOtp] = useState('');

  // UI helpers
  const [activeCode, setActiveCode] = useState('');
  const [simulatedSms, setSimulatedSms] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState('');
  const [activatedMember, setActivatedMember] = useState<MemberProfile | null>(null);
  const [activatedSession, setActivatedSession] = useState<UserSession | null>(null);

  const inputClass =
    'w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-lime-400 placeholder:text-zinc-600';

  // Step 2 -> Step 3: Send verification code
  const handleProceedToVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErr('Please enter your full name');
    const cleanPhone = phone.replace(/\s+/g, '').replace(/^\+91/, '');
    if (!/^\d{10}$/.test(cleanPhone)) return setErr('Please enter a valid 10-digit mobile number');

    setErr('');
    setIsLoading(true);

    const res = await sendOtp(cleanPhone);
    setIsLoading(false);

    if (res.success) {
      const code = res.code || '4829';
      setActiveCode(code);
      setOtp(''); // Let user or banner auto-fill
      // Show authentic simulated SMS banner
      setSimulatedSms(`Your Apex Gym verification code is ${code}. Valid for 10 minutes.`);
      setTimeout(() => setSimulatedSms(null), 12000);
      setStep(3);
    } else {
      setErr(res.error || 'Failed to dispatch verification code');
    }
  };

  // Step 3 -> Step 4: Verify & Register
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return setErr('Please enter verification code');

    setErr('');
    setIsLoading(true);

    const res = await signUpMember({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      goal,
      tier: selectedPlan.name,
      emergencyContact: emergencyContact.trim(),
      otp: otp.trim()
    });

    setIsLoading(false);

    if (res.success && res.session && res.member) {
      setActivatedSession(res.session);
      setActivatedMember(res.member);
      setStep(4);
    } else {
      setErr(res.error || 'Registration failed. Please check the code.');
    }
  };

  return (
    <div className="relative px-6 py-6 space-y-5">
      {/* Simulated Incoming Phone Push Notification Banner */}
      {simulatedSms && (
        <div
          onClick={() => {
            if (activeCode) setOtp(activeCode);
            setSimulatedSms(null);
          }}
          className="absolute top-2 left-3 right-3 z-50 cursor-pointer bg-zinc-900/95 hover:bg-zinc-850 border border-lime-400/80 p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 transition transform active:scale-95 duration-200 ring-2 ring-lime-400/20"
        >
          <div className="w-9 h-9 rounded-xl bg-lime-400 text-zinc-950 flex items-center justify-center shrink-0 shadow-md">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              <span>MESSAGES • NOW</span>
              <span className="text-lime-400">Apex Security</span>
            </div>
            <p className="text-xs text-white font-medium mt-0.5">
              Code: <strong className="text-lime-400 font-mono tracking-widest text-sm">{activeCode}</strong> · Tap to auto-fill
            </p>
          </div>
          <span className="text-[10px] font-bold bg-lime-400 text-zinc-950 px-2 py-1 rounded-lg shrink-0 shadow">
            Fill
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-lime-400 text-zinc-950 font-black flex items-center justify-center text-sm shadow-md shadow-lime-400/20">
            AX
          </div>
          <div>
            <h3 className="text-sm font-black tracking-tight text-white leading-none">JOIN APEX GYM</h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">Step {step} of 4 • Member Enrollment</p>
          </div>
        </div>
        {step < 4 && (
          <button onClick={onCancel} className="text-xs text-zinc-400 hover:text-white">
            Cancel
          </button>
        )}
      </div>

      {/* STEP 1: SELECT MEMBERSHIP PLAN */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white">Choose Your Membership Tier</h4>
            <p className="text-xs text-zinc-400">All tiers include instant dynamic digital QR pass activation</p>
          </div>

          <div className="space-y-2.5">
            {PRICING_PLANS.map((plan) => {
              const isSelected = selectedPlan.id === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition relative ${
                    isSelected
                      ? 'bg-lime-400/10 border-lime-400 shadow-md shadow-lime-400/10'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">{plan.name}</span>
                        {plan.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-lime-400 text-zinc-950">
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-black text-lime-400 mt-1">{plan.price}</p>
                      <p className="text-[10px] text-zinc-400">{plan.billing}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'bg-lime-400 border-lime-400 text-zinc-950' : 'border-zinc-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20 transition"
          >
            <span>Continue to Details</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 2: MEMBER PROFILE DETAILS */}
      {step === 2 && (
        <form onSubmit={handleProceedToVerify} className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white">Member Information</h4>
              <p className="text-[11px] text-zinc-400">Selected: {selectedPlan.name} ({selectedPlan.price})</p>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Change
            </button>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Full Name</label>
            <input
              required
              placeholder="e.g. Subhadip Ghosh"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Mobile Number</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2.5 text-xs text-zinc-500 font-medium">+91</span>
                <input
                  required
                  inputMode="tel"
                  placeholder="98300 10001"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`pl-10 ${inputClass}`}
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Email Address</label>
              <input
                type="email"
                placeholder="subhadip@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Primary Fitness Goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className={`w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white`}
            >
              <option>Build muscle & hypertrophy</option>
              <option>Fat loss & conditioning</option>
              <option>Olympic lifting & power</option>
              <option>Yoga & mobility</option>
              <option>General wellness</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Emergency Contact (Name & Phone)</label>
            <input
              placeholder="e.g. Rahul Sharma · +91 98300 00000"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              className={inputClass}
            />
          </div>

          {err && <p className="text-xs text-red-400 font-medium">{err}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20 transition disabled:opacity-50"
          >
            <span>{isLoading ? 'Sending Security Code…' : 'Send Verification Code'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* STEP 3: SMS VERIFICATION */}
      {step === 3 && (
        <form onSubmit={handleVerifyAndRegister} className="space-y-4">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400 mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Enter Verification Code</h4>
            <p className="text-xs text-zinc-400">
              We sent a 4-digit security code to <strong className="text-white">+91 {phone}</strong>
            </p>
          </div>

          <div className="max-w-xs mx-auto">
            <input
              required
              autoFocus
              maxLength={4}
              inputMode="numeric"
              placeholder="••••"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full py-3 rounded-2xl bg-zinc-900 border border-zinc-700 text-center font-mono text-2xl tracking-widest text-lime-400 focus:outline-none focus:border-lime-400"
            />
            {activeCode && !otp && (
              <button
                type="button"
                onClick={() => setOtp(activeCode)}
                className="mt-2 text-[11px] text-lime-400/90 hover:text-lime-300 font-semibold text-center w-full block transition"
              >
                Tap to auto-fill verification code: <span className="font-mono font-bold tracking-widest underline">{activeCode}</span>
              </button>
            )}
          </div>

          {err && <p className="text-center text-xs text-red-400 font-medium">{err}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-lime-400/20 disabled:opacity-50"
          >
            {isLoading ? 'Activating Membership…' : 'Confirm & Activate Membership'}
          </button>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full text-center text-xs text-zinc-400 hover:text-white"
          >
            Change Details or Mobile Number
          </button>
        </form>
      )}

      {/* STEP 4: INSTANT PASS ACTIVATION & WELCOME */}
      {step === 4 && activatedMember && activatedSession && (
        <div className="space-y-4 text-center py-2 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-lime-400 text-zinc-950 flex items-center justify-center mx-auto shadow-xl shadow-lime-400/30 animate-bounce">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-lime-400/20 text-lime-400 uppercase tracking-widest">
              Digital Pass Activated
            </span>
            <h3 className="text-lg font-black text-white mt-2">Welcome to Apex Gym, {activatedMember.name}!</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Your {activatedMember.tier} membership is active at Park Street Flagship.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-left space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Member ID</span>
              <span className="font-mono font-bold text-lime-400">{activatedMember.memberId}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Plan</span>
              <span className="font-semibold text-white">{activatedMember.tier}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Status</span>
              <span className="font-semibold text-lime-400">● Active (Gate Unlocked)</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Valid Until</span>
              <span className="font-semibold text-zinc-300">{activatedMember.nextRenewal}</span>
            </div>
          </div>

          <button
            onClick={() => onComplete(activatedSession, activatedMember)}
            className="w-full py-3.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-lime-400/25 transition flex items-center justify-center gap-2"
          >
            <span>Launch Your Dynamic Gate Pass</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
