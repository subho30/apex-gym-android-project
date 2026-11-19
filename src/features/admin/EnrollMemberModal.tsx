import React, { useState } from 'react';
import { X, UserPlus, CheckCircle2, CreditCard } from 'lucide-react';
import { MemberProfile } from '../../types';
import { enrollMember } from '../../services/members';

interface EnrollMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberEnrolled: (member: MemberProfile) => void;
}

export function EnrollMemberModal({ isOpen, onClose, onMemberEnrolled }: EnrollMemberModalProps) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState('Annual Pro');
  const [goal, setGoal] = useState('Strength & Hypertrophy');
  const [paymentMode, setPaymentMode] = useState('UPI (GPay / PhonePe)');
  const [status, setStatus] = useState<'Active' | 'Payment Due'>('Active');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErr('Full name is required');
    const cleanMobile = mobile.replace(/\s+/g, '').replace(/^\+91/, '');
    if (!/^\d{10}$/.test(cleanMobile)) return setErr('Valid 10-digit mobile number required');

    setErr('');
    setIsLoading(true);

    const res = await enrollMember({
      name: name.trim(),
      mobile: cleanMobile,
      email: email.trim(),
      tier,
      goal,
      emergencyContact: emergencyContact.trim(),
      status
    });

    setIsLoading(false);

    if (res.success && res.member) {
      onMemberEnrolled(res.member);
      onClose();
    } else {
      setErr(res.error || 'Failed to enroll member');
    }
  };

  const inputClass =
    'w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-lime-400';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-lime-400 text-zinc-950 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Enroll Walk-In Member</h3>
              <p className="text-[11px] text-zinc-400">Front desk membership onboarding & digital pass issuance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-zinc-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Member Full Name *</label>
              <input
                required
                placeholder="e.g. Subhadip Ghosh"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Mobile Number *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-medium">+91</span>
                <input
                  required
                  inputMode="tel"
                  placeholder="98300 10001"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className={`pl-10 ${inputClass}`}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Membership Plan</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className={inputClass}
              >
                <option>Annual Pro (₹28,500/yr)</option>
                <option>Monthly Pro (₹3,499/mo)</option>
                <option>Apex Black VIP (₹4,999/mo)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Payment Method</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className={inputClass}
              >
                <option>UPI (GPay / PhonePe / Paytm)</option>
                <option>Credit / Debit Card POS</option>
                <option>Net Banking / IMPS</option>
                <option>Cash Receipt</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Turnstile Access Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className={inputClass}
              >
                <option value="Active">Active (Immediate Gate Access)</option>
                <option value="Payment Due">Payment Due (Hold Gate Access)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Emergency Contact & Phone</label>
            <input
              placeholder="e.g. Rahul Sharma · +91 98300 20000"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              className={inputClass}
            />
          </div>

          {err && <p className="text-xs text-red-400 font-medium">{err}</p>}

          <div className="pt-2 border-t border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-lime-400/20 disabled:opacity-50"
            >
              {isLoading ? 'Enrolling…' : 'Issue Pass & Activate Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
