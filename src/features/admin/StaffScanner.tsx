import React, { useState } from 'react';
import { LogOut, ScanLine, CheckCircle2, XCircle, Camera, Search } from 'lucide-react';
import { MemberProfile, CheckInFeedItem } from '../../types';
import { CameraScannerModal } from '../../components/CameraScannerModal';
import { useNativeMobile } from '../../hooks/useNativeMobile';
import { verifyGateToken } from '../../services/gate';

interface StaffScannerProps {
  name: string;
  members: MemberProfile[];
  feed: CheckInFeedItem[];
  occupancy: number;
  maxOccupancy: number;
  onCheckIn: (member: MemberProfile, method?: string) => void;
  onLogout: () => void;
  wide?: boolean;
}

export function StaffScanner({
  name,
  members,
  feed,
  occupancy,
  maxOccupancy,
  onCheckIn,
  onLogout,
  wide
}: StaffScannerProps) {
  const { triggerHaptic } = useNativeMobile();
  const [result, setResult] = useState<{ ok: boolean; title: string; detail: string } | null>(null);
  const [manual, setManual] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const cleanName = (n: string) => n.replace(' (You)', '');

  const verifyMemberLocally = (m: MemberProfile) => {
    if (m.status === 'Active') {
      triggerHaptic('success');
      return {
        ok: true,
        title: `Welcome, ${cleanName(m.name)}`,
        detail: `${m.tier} · ${m.memberId}`,
        member: m
      };
    } else {
      triggerHaptic('error');
      return {
        ok: false,
        title: 'Entry Denied',
        detail: `${cleanName(m.name)}: Membership status is "${m.status}". Direct to front desk for renewal.`
      };
    }
  };

  const handleCameraScanSuccess = async (rawText: string) => {
    setIsCameraOpen(false);
    setIsVerifying(true);
    setResult(null);

    try {
      const verifyRes = await verifyGateToken(rawText, 'Front Desk Scanner');
      if (verifyRes.verified && verifyRes.memberId) {
        triggerHaptic('success');
        const matched =
          members.find((m) => m.memberId.toLowerCase() === verifyRes.memberId?.toLowerCase()) ||
          ({
            id: verifyRes.memberId,
            memberId: verifyRes.memberId,
            name: verifyRes.memberName || 'Member',
            tier: verifyRes.memberTier || 'Pro',
            status: 'Active',
            streakDays: 1,
            nextRenewal: '',
            cardLast4: '',
            isCheckedIn: true,
            mobile: '',
            email: '',
            goal: '',
            homeClub: 'Park Street',
            coach: '',
            joined: '',
            emergencyContact: ''
          } as MemberProfile);

        setResult({
          ok: true,
          title: `Welcome, ${cleanName(verifyRes.memberName || matched.name)}`,
          detail: `${verifyRes.memberTier || matched.tier} · ${verifyRes.memberId}`
        });
        onCheckIn(matched, 'Server QR Verification');
      } else {
        triggerHaptic('error');
        setResult({
          ok: false,
          title: 'Entry Denied',
          detail: verifyRes.reason || 'Invalid QR pass'
        });
      }
    } catch (err: any) {
      triggerHaptic('error');
      setResult({
        ok: false,
        title: 'Verification Failed',
        detail: err?.message || 'Could not verify pass.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const query = manual.trim().toLowerCase();
    if (!query) return;

    const matched = members.find(
      (x) => x.memberId.toLowerCase() === query || x.name.toLowerCase().includes(query)
    );

    if (matched) {
      const res = verifyMemberLocally(matched);
      setResult(res);
      if (res.ok) onCheckIn(matched, 'Manual ID Entry');
    } else {
      triggerHaptic('error');
      setResult({
        ok: false,
        title: 'Member Not Found',
        detail: 'Please verify the ID or full name and try again.'
      });
    }
    setManual('');
  };

  return (
    <div className={wide ? 'grid grid-cols-2 gap-6 items-start px-8 py-6' : 'px-5 py-5 space-y-4'}>
      {/* Top Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400">Staff Gate Controller</p>
            <p className="text-sm font-bold text-white">{name}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-zinc-300 hover:border-lime-400/50 transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Log out
          </button>
        </div>

        {/* Live Occupancy Gauge */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block">Current Club Occupancy</span>
            <span className="text-[11px] text-zinc-500">Park Street Flagship</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-lime-400">
              {occupancy} <span className="text-xs text-zinc-400 font-normal">/ {maxOccupancy}</span>
            </span>
          </div>
        </div>

        {/* Scanner Action Bay */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 space-y-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center mx-auto text-lime-400 shadow-md">
            <ScanLine className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Turnstile Pass Scanner</h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Scan dynamic QR codes presented by members on their mobile app
            </p>
          </div>
          <button
            disabled={isVerifying}
            onClick={() => setIsCameraOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-lime-400 hover:bg-lime-300 py-3 text-sm font-bold text-zinc-950 transition shadow-lg shadow-lime-400/20 disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
            {isVerifying ? 'Verifying with server…' : 'Open Live Camera Scanner'}
          </button>
        </div>
      </div>

      {/* Results & Feed Section */}
      <div className="space-y-4">
        {result && (
          <div
            role="status"
            className={`rounded-2xl border p-4 flex items-start gap-3 animate-fade-in ${
              result.ok ? 'bg-lime-400/10 border-lime-400/40' : 'bg-red-500/10 border-red-500/40'
            }`}
          >
            {result.ok ? (
              <CheckCircle2 className="w-6 h-6 text-lime-400 shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400 shrink-0" />
            )}
            <div>
              <p className="text-sm font-bold text-white">{result.title}</p>
              <p className="text-xs text-zinc-300 mt-0.5">{result.detail}</p>
            </div>
          </div>
        )}

        {/* Manual Lookup Form */}
        <form onSubmit={handleManualLookup} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="Search Member ID or name"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-lime-400/60"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 text-xs font-semibold text-zinc-200 hover:border-lime-400/50 transition"
          >
            Verify
          </button>
        </form>

        {/* Realtime Check-in Stream */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
            Recent Gate Check-ins
          </p>
          <ul className="space-y-2">
            {feed.slice(0, 5).map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-2.5 text-xs"
              >
                <div>
                  <span className="font-semibold text-zinc-200 block">{cleanName(entry.member)}</span>
                  <span className="text-[10px] text-zinc-400">
                    {entry.tier} • {entry.method}
                  </span>
                </div>
                <span className="text-zinc-500 font-mono text-[11px]">{entry.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Modal */}
      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScanSuccess={handleCameraScanSuccess}
      />
    </div>
  );
}
