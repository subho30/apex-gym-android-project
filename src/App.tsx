import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
import {
  Dumbbell,
  Flame,
  Calendar,
  QrCode,
  User,
  CreditCard,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Award,
  Activity,
  ShieldCheck,
  Smartphone,
  Monitor,
  Sparkles,
  ChevronRight,
  Search,
  Filter,
  Download,
  Bell,
  ArrowUpRight,
  RefreshCw,
  MapPin,
  Star,
  Zap,
  X,
  Check,
  AlertCircle,
  BarChart3,
  Lock,
  Phone,
  Mail,
  MessageCircle,
  Settings as SettingsIcon,
  Pencil,
  ArrowLeft,
  LogOut,
  XCircle,
  ScanLine
} from 'lucide-react';

// --- INITIAL SHARED DATA ---
const INITIAL_CLASSES = [
  {
    id: 'cls-1',
    title: 'Metcon Burn HIIT',
    category: 'HIIT',
    trainer: 'Karan Singh',
    time: '06:00 AM',
    duration: '45 min',
    room: 'Turf Zone A',
    capacity: 20,
    bookedCount: 18,
    isBookedByMe: true,
    waitlistCount: 0,
    intensity: 'High',
    roster: ['Rohan Sharma (You)', 'Priya Nair', 'Ananya Iyer', 'Kabir Khan', 'Meera Joshi']
  },
  {
    id: 'cls-2',
    title: 'Olympic Lifting & Power',
    category: 'Strength',
    trainer: 'Neha Kapoor',
    time: '07:30 AM',
    duration: '60 min',
    room: 'Platform Bay',
    capacity: 12,
    bookedCount: 11,
    isBookedByMe: false,
    waitlistCount: 0,
    intensity: 'Extreme',
    roster: ['Aditya Rao', 'Nikhil Gupta', 'Pooja Das', 'Farhan Ali']
  },
  {
    id: 'cls-3',
    title: 'Surya Namaskar & Power Yoga',
    category: 'Yoga',
    trainer: 'Ritu Bansal',
    time: '09:00 AM',
    duration: '50 min',
    room: 'Yoga Studio',
    capacity: 15,
    bookedCount: 15,
    isBookedByMe: false,
    waitlistCount: 3,
    intensity: 'Moderate',
    roster: ['Isha Banerjee', 'Tanvi Shah', 'Rahul Verma']
  },
  {
    id: 'cls-4',
    title: '1-on-1 Hypertrophy Assessment',
    category: 'Personal Training',
    trainer: 'Imran Qureshi',
    time: '06:00 PM',
    duration: '60 min',
    room: 'Private Pod 1',
    capacity: 4,
    bookedCount: 2,
    isBookedByMe: false,
    waitlistCount: 0,
    intensity: 'Custom',
    roster: ['Divya Menon', 'Siddharth Roy']
  },
  {
    id: 'cls-5',
    title: 'Bollywood Zumba Party',
    category: 'Zumba',
    trainer: 'Ritu Bansal',
    time: '07:30 PM',
    duration: '45 min',
    room: 'Dance Studio',
    capacity: 20,
    bookedCount: 14,
    isBookedByMe: false,
    waitlistCount: 0,
    intensity: 'High',
    roster: ['Harsh Patel', 'Simran Kaur', 'Aarti Pillai']
  }
];

const INITIAL_WORKOUT_LOGS = [
  { id: 'w-1', exercise: 'Barbell Back Squat', weight: '120 kg', sets: 4, reps: 6, date: 'Today, 07:40 AM', isPR: true },
  { id: 'w-2', exercise: 'Incline Dumbbell Press', weight: '38 kg', sets: 4, reps: 8, date: 'Today, 07:55 AM', isPR: false },
  { id: 'w-3', exercise: 'Weighted Pull-Ups', weight: '+16 kg', sets: 3, reps: 8, date: '2 days ago', isPR: true },
  { id: 'w-4', exercise: 'Romanian Deadlift', weight: '110 kg', sets: 3, reps: 10, date: '4 days ago', isPR: false }
];

const INITIAL_MEMBERS = [
  { id: 'MEM-901', name: 'Rohan Sharma (You)', plan: 'Annual Pro', status: 'Active', mrr: '₹1,250', lastCheckIn: 'Just now', avatar: 'RS', checkedInNow: true },
  { id: 'MEM-902', name: 'Priya Nair', plan: 'Monthly Flex', status: 'Active', mrr: '₹2,500', lastCheckIn: '14 mins ago', avatar: 'PN', checkedInNow: true },
  { id: 'MEM-903', name: 'Ananya Iyer', plan: 'Quarterly Performance', status: 'Active', mrr: '₹2,000', lastCheckIn: '32 mins ago', avatar: 'AI', checkedInNow: true },
  { id: 'MEM-904', name: 'Vikram Malhotra', plan: 'Annual Pro', status: 'Past Due', mrr: '₹1,250', lastCheckIn: '3 days ago', avatar: 'VM', checkedInNow: false },
  { id: 'MEM-905', name: 'Sneha Reddy', plan: 'Annual Pro', status: 'Active', mrr: '₹1,250', lastCheckIn: '1 hour ago', avatar: 'SR', checkedInNow: false }
];

const INITIAL_CHECKIN_FEED = [
  { id: 'chk-1', member: 'Rohan Sharma (You)', tier: 'Annual Pro', time: '07:02 AM', method: 'Dynamic QR Pass', gate: 'Front desk scanner' },
  { id: 'chk-2', member: 'Priya Nair', tier: 'Monthly Flex', time: '06:54 AM', method: 'Dynamic QR Pass', gate: 'Front desk scanner' },
  { id: 'chk-3', member: 'Ananya Iyer', tier: 'Quarterly', time: '06:48 AM', method: 'Dynamic QR Pass', gate: 'Front desk scanner' }
];

const TRAINERS = [
  { name: 'Karan Singh', specialty: 'HIIT & Metabolic Conditioning', exp: '9 Yrs Exp', rating: '4.9', certs: 'ACE-CPT, CSCS', badge: 'Head Coach' },
  { name: 'Neha Kapoor', specialty: 'Olympic Weightlifting & Power', exp: '11 Yrs Exp', rating: '5.0', certs: 'MSc Sports Science, NIS', badge: 'Strength Lead' },
  { name: 'Ritu Bansal', specialty: 'Mobility, Recovery & Power Yoga', exp: '7 Yrs Exp', rating: '4.9', certs: 'RYT-500, Yoga Alliance', badge: 'Recovery Specialist' },
  { name: 'Imran Qureshi', specialty: 'Biomechanics & Hypertrophy', exp: '8 Yrs Exp', rating: '4.8', certs: 'NASM-CPT, Precision Nutrition', badge: 'Pro Trainer' }
];

const INVOICES = [
  { id: 'INV-2026-11', date: 'Nov 01, 2026', amount: '₹1,475.00', plan: 'Annual Pro (incl. 18% GST)', status: 'Paid' },
  { id: 'INV-2026-10', date: 'Oct 01, 2026', amount: '₹1,475.00', plan: 'Annual Pro (incl. 18% GST)', status: 'Paid' },
  { id: 'INV-2026-09', date: 'Sep 01, 2026', amount: '₹1,475.00', plan: 'Annual Pro (incl. 18% GST)', status: 'Paid' }
];

// --- CLUB CONTACT DETAILS (placeholders: replace with the gym's real details) ---
const CLUB = {
  name: 'Apex Gym, Park Street',
  address: '12 Park Street, Kolkata 700016 (placeholder)',
  phone: '+91 98300 00000',
  whatsapp: '919830000000',
  email: 'support@apexgym.example',
  hours: 'Mon–Sun · 5:00 AM – 11:00 PM',
  maps: 'https://www.google.com/maps/search/?api=1&query=Park+Street+Kolkata'
};

// --- GYM PHOTOS ---
// Set `src` to a real image (for example '/photos/strength.jpg') to replace the animated illustration.
const GYM_PHOTOS = [
  { title: 'Strength floor', caption: 'Racks, plates and platforms', scene: 0, src: '' },
  { title: 'Zumba studio', caption: 'Evening dance sessions', scene: 1, src: '' },
  { title: 'Recovery lounge', caption: 'Steam, sauna and ice bath', scene: 2, src: '' },
  { title: 'Cardio zone', caption: 'Treadmills and rowers', scene: 3, src: '' }
];

const SCENE_STYLES = `
@keyframes apx-kb { to { transform: scale(1.12); } }
@keyframes apx-lift { to { transform: translateY(-16px); } }
@keyframes apx-dance { from { transform: rotate(-7deg); } to { transform: rotate(7deg); } }
@keyframes apx-steam { 0% { transform: translateY(20px); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(-25px); opacity: 0; } }
@keyframes apx-belt { to { stroke-dashoffset: -24; } }
@keyframes apx-run { to { transform: translateY(-5px); } }
.apx-kb { animation: apx-kb 12s ease-in-out infinite alternate; }
.apx-lift { animation: apx-lift 1.8s ease-in-out infinite alternate; }
.apx-dance { transform-box: fill-box; transform-origin: center bottom; animation: apx-dance .7s ease-in-out infinite alternate; }
.apx-steam { animation: apx-steam 3s ease-in-out infinite; }
.apx-belt { stroke-dasharray: 14 10; animation: apx-belt .5s linear infinite; }
.apx-run { animation: apx-run .35s ease-in-out infinite alternate; }
@media (prefers-reduced-motion: reduce) { .apx-kb, .apx-lift, .apx-dance, .apx-steam, .apx-belt, .apx-run { animation: none; } }
`;

// Some previews only ship Tailwind's core classes, so arbitrary-value classes used below are defined here.
const GLOBAL_FIXES = `
.text-\\[11px\\] { font-size: 11px; line-height: 1.3; }
.text-\\[10px\\] { font-size: 10px; line-height: 1.3; }
.stroke-\\[3\\] { stroke-width: 3; }
.stroke-\\[2\\.5\\] { stroke-width: 2.5; }
.max-w-\\[1600px\\] { max-width: 1600px; }
.rounded-\\[2px\\] { border-radius: 2px; }
.backdrop-blur-\\[1px\\] { backdrop-filter: blur(1px); }
.lite *, .lite *::before, .lite *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
`;

function GymScene({ scene }: any) {
  const common = { viewBox: '0 0 320 180', preserveAspectRatio: 'xMidYMid slice', className: 'w-full h-full' };
  if (scene === 0) {
    return (
      <svg {...common}>
        <defs>
          <linearGradient id="gs0" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1b2232" />
            <stop offset="1" stopColor="#84cc16" />
          </linearGradient>
        </defs>
        <rect width="320" height="180" fill="url(#gs0)" />
        <rect y="140" width="320" height="40" fill="#09090b" />
        <path d="M70 60V140M250 60V140" stroke="#ffffff33" strokeWidth="3" />
        <g className="apx-lift">
          <rect x="40" y="86" width="240" height="6" rx="3" fill="#d4d4d8" />
          <rect x="62" y="62" width="12" height="54" rx="3" fill="#f4f4f5" />
          <rect x="76" y="70" width="9" height="38" rx="3" fill="#f4f4f5" />
          <rect x="246" y="62" width="12" height="54" rx="3" fill="#f4f4f5" />
          <rect x="235" y="70" width="9" height="38" rx="3" fill="#f4f4f5" />
        </g>
        <circle cx="160" cy="118" r="9" fill="#09090b" />
        <path d="M160 127V148M148 138H172" stroke="#09090b" strokeWidth="6" strokeLinecap="round" />
      </svg>
    );
  }
  if (scene === 1) {
    return (
      <svg {...common}>
        <defs>
          <linearGradient id="gs1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3a1c71" />
            <stop offset="1" stopColor="#a3e635" />
          </linearGradient>
        </defs>
        <rect width="320" height="180" fill="url(#gs1)" />
        {[90, 160, 230].map((x, i) => (
          <g key={x} className="apx-dance" style={{ animationDelay: `${i * 0.2}s` }}>
            <circle cx={x} cy="70" r="9" fill="#fff" />
            <path
              d={`M${x} 80V115M${x} 90L${x - 18} 78M${x} 90L${x + 18} 68M${x} 115L${x - 12} 142M${x} 115L${x + 12} 142`}
              stroke="#fff"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        ))}
        <circle className="apx-steam" cx="40" cy="40" r="4" fill="#fff" />
        <circle className="apx-steam" cx="280" cy="50" r="3" fill="#fff" style={{ animationDelay: '1s' }} />
      </svg>
    );
  }
  if (scene === 2) {
    return (
      <svg {...common}>
        <defs>
          <linearGradient id="gs2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0b3b3c" />
            <stop offset="1" stopColor="#2dd4bf" />
          </linearGradient>
        </defs>
        <rect width="320" height="180" fill="url(#gs2)" />
        <rect y="130" width="320" height="50" fill="#5b3a1e" />
        <rect y="120" width="320" height="12" fill="#8a5a2b" />
        {[80, 160, 240].map((x, i) => (
          <path
            key={x}
            className="apx-steam"
            style={{ animationDelay: `${i * 0.9}s` }}
            d={`M${x} 118C${x - 12} 100 ${x + 12} 90 ${x} 70S${x + 10} 40 ${x} 25`}
            stroke="#ffffffaa"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </svg>
    );
  }
  return (
    <svg {...common}>
      <defs>
        <linearGradient id="gs3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#101a33" />
          <stop offset="1" stopColor="#0e7490" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#gs3)" />
      <path className="apx-belt" d="M60 150H260" stroke="#d4d4d8" strokeWidth="10" />
      <path d="M250 150L270 70H282" stroke="#d4d4d8" strokeWidth="5" fill="none" />
      <g className="apx-run">
        <circle cx="150" cy="70" r="10" fill="#fff" />
        <path
          d="M150 82L142 115M146 92L168 100M146 92L128 104M142 115L160 132L156 146M142 115L124 128L110 142"
          stroke="#fff"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

function GymPhotoCarousel({ photos, autoplay = true }: any) {
  const [idx, setIdx] = useState(0);
  const visible = useVisible();
  useEffect(() => {
    if (!autoplay || !visible) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % photos.length), 3500);
    return () => clearInterval(t);
  }, [photos.length, autoplay, visible]);
  return (
    <div>
      <style>{SCENE_STYLES}</style>
      <div className="relative h-44 rounded-2xl overflow-hidden border border-zinc-800">
        {photos.map((p: any, i: number) => i !== idx ? null : (
          <div key={p.title} className="absolute inset-0">
            <div className="w-full h-full apx-kb">
              {p.src ? <img src={p.src} alt={p.title} className="w-full h-full object-cover" /> : <GymScene scene={p.scene} />}
            </div>
            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-sm font-bold text-white">{p.title}</p>
              <p className="text-[11px] text-zinc-300">{p.caption}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1.5 mt-2">
        {photos.map((p: any, i: number) => (
          <button
            key={p.title}
            onClick={() => setIdx(i)}
            aria-label={`Show ${p.title}`}
            className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-5 bg-lime-400' : 'w-1.5 bg-zinc-700'}`}
          />
        ))}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label }: any) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`w-11 h-6 rounded-full p-0.5 transition ${checked ? 'bg-lime-400' : 'bg-zinc-700'}`}
    >
      <span className={`block w-5 h-5 rounded-full bg-zinc-950 transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}

// --- SIGN-IN, STAFF SCANNER AND TRIAL LEADS ---
const INITIAL_LEADS = [
  { id: 'lead-1', name: 'Aditi Verma', mobile: '98300 33445', interest: 'Annual Pro', status: 'New', time: '10:12 AM' },
  { id: 'lead-2', name: 'Rahul Das', mobile: '98300 55667', interest: 'Weight loss coaching', status: 'Called', time: 'Yesterday' }
];

function LoginPanel({ lockRole, onLogin }: any) {
  const [role, setRole] = useState(lockRole || 'member');
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [err, setErr] = useState('');
  const NAMES: any = { member: 'Rohan Sharma', staff: 'Meera Joshi (Front desk)', manager: 'Anita Das (Manager)' };
  const input = 'w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-3 text-sm text-white focus:outline-none focus:border-lime-400/60';
  const sendOtp = (e: any) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(mobile.replace(/\s/g, ''))) return setErr('Enter a 10-digit mobile number');
    setErr('');
    setStep(2);
  };
  const verify = (e: any) => {
    e.preventDefault();
    if (otp !== '1234') return setErr('Wrong OTP. Demo OTP is 1234.');
    onLogin({ role, name: NAMES[role] });
  };
  return (
    <div className="px-6 py-8 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-lime-400 text-zinc-950 font-black flex items-center justify-center">AX</div>
        <div>
          <p className="text-lg font-black text-white leading-tight">APEX GYM</p>
          <p className="text-xs text-zinc-400">{lockRole ? 'Admin sign in' : 'Sign in with your mobile number'}</p>
        </div>
      </div>
      {!lockRole && step === 1 && (
        <div className="grid grid-cols-3 gap-2" role="tablist">
          {[['member', 'Member'], ['staff', 'Staff'], ['manager', 'Manager']].map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={role === id}
              onClick={() => setRole(id)}
              className={`rounded-xl py-2 text-xs font-bold border transition ${role === id ? 'bg-lime-400 text-zinc-950 border-lime-400' : 'border-zinc-800 text-zinc-300 hover:border-lime-400/40'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {step === 1 ? (
        <form onSubmit={sendOtp} className="space-y-3">
          <label className="block text-xs font-semibold text-zinc-400">
            Mobile number
            <input value={mobile} onChange={(e) => setMobile(e.target.value)} inputMode="tel" placeholder="98300 10001" className={`mt-1 ${input}`} />
          </label>
          {err && <p className="text-xs text-red-400">{err}</p>}
          <button type="submit" className="w-full rounded-xl bg-lime-400 py-3 text-sm font-bold text-zinc-950 hover:bg-lime-300 transition">Send OTP</button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-3">
          <label className="block text-xs font-semibold text-zinc-400">
            Enter the 4-digit OTP sent to +91 {mobile}
            <input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={4} inputMode="numeric" placeholder="1234" className={`mt-1 ${input}`} />
          </label>
          <p className="text-[11px] text-zinc-500">Demo only: the OTP is 1234.</p>
          {err && <p className="text-xs text-red-400">{err}</p>}
          <button type="submit" className="w-full rounded-xl bg-lime-400 py-3 text-sm font-bold text-zinc-950 hover:bg-lime-300 transition">Verify and continue</button>
          <button type="button" onClick={() => { setStep(1); setOtp(''); setErr(''); }} className="w-full text-xs text-zinc-400 hover:text-white">Change number</button>
        </form>
      )}
    </div>
  );
}

function StaffScanner({ name, members, feed, occupancy, maxOccupancy, onCheckIn, onLogout, wide }: any) {
  const [result, setResult] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [manual, setManual] = useState('');
  const short = (n: string) => n.replace(' (You)', '');
  const verify = (m: any) =>
    m.status === 'Active'
      ? { ok: true, title: `Welcome, ${short(m.name)}`, detail: `${m.plan} · ${m.id}`, member: m }
      : { ok: false, title: 'Entry denied', detail: `${short(m.name)}: payment is due. Send to the front desk to renew.` };
  const run = (fn: any) => {
    setScanning(true);
    setResult(null);
    setTimeout(() => {
      const r = fn();
      setScanning(false);
      setResult(r);
      if (r.ok) onCheckIn(r.member);
    }, 900);
  };
  const lookup = (e: any) => {
    e.preventDefault();
    const q = manual.trim().toLowerCase();
    if (!q) return;
    const m = members.find((x: any) => x.id.toLowerCase() === q || x.name.toLowerCase().includes(q));
    run(() => (m ? verify(m) : { ok: false, title: 'Member not found', detail: 'Check the ID or name and try again.' }));
    setManual('');
  };
  return (
    <div className={wide ? 'grid grid-cols-2 gap-6 items-start px-8 py-6' : 'px-5 py-5 space-y-4'}>
      <style>{`@keyframes apx-scanline { from { top: 8%; } to { top: 88%; } } .apx-scanline { animation: apx-scanline 1.2s ease-in-out infinite alternate; } @media (prefers-reduced-motion: reduce) { .apx-scanline { animation: none; } }`}</style>
      <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-400">Staff mode</p>
          <p className="text-sm font-bold text-white">{name}</p>
        </div>
        <button onClick={onLogout} className="flex items-center gap-1 rounded-full border border-zinc-800 px-3 py-1.5 text-[11px] font-semibold text-zinc-300 hover:border-lime-400/50 transition">
          <LogOut className="w-3 h-3" /> Log out
        </button>
      </div>
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 px-4 py-3 flex items-center justify-between">
        <span className="text-xs text-zinc-400">Inside the club now</span>
        <span className="text-sm font-bold text-lime-400">{occupancy} / {maxOccupancy}</span>
      </div>
      <div className="relative h-52 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center">
        <div className="relative w-40 h-40 border-2 border-lime-400/60 rounded-2xl">
          <ScanLine className="absolute inset-0 m-auto w-16 h-16 text-zinc-700" />
          {scanning && <div className="apx-scanline absolute left-2 right-2 h-0.5 bg-lime-400 shadow-[0_0_12px_#a3e635]" />}
        </div>
        <p className="absolute bottom-2 text-[11px] text-zinc-500">{scanning ? 'Checking pass…' : 'Point the camera at the member’s QR code'}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button disabled={scanning} onClick={() => run(() => verify(members[Math.floor(Math.random() * members.length)]))} className="rounded-xl bg-lime-400 py-3 text-sm font-bold text-zinc-950 hover:bg-lime-300 disabled:opacity-50 transition">Simulate scan</button>
        <button disabled={scanning} onClick={() => run(() => ({ ok: false, title: 'QR expired', detail: 'This code is over 30 seconds old. Ask the member to show the live code in the app.' }))} className="rounded-xl border border-zinc-700 py-3 text-xs font-semibold text-zinc-200 hover:border-lime-400/50 disabled:opacity-50 transition">Scan old screenshot</button>
      </div>
      </div>
      <div className="space-y-4">
      {result && (
        <div role="status" className={`rounded-2xl border p-4 flex items-start gap-3 ${result.ok ? 'bg-lime-400/10 border-lime-400/40' : 'bg-red-500/10 border-red-500/40'}`}>
          {result.ok ? <CheckCircle2 className="w-6 h-6 text-lime-400 shrink-0" /> : <XCircle className="w-6 h-6 text-red-400 shrink-0" />}
          <div>
            <p className="text-sm font-bold text-white">{result.title}</p>
            <p className="text-xs text-zinc-300">{result.detail}</p>
          </div>
        </div>
      )}
      <form onSubmit={lookup} className="flex gap-2">
        <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Member ID or name" className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-lime-400/60" />
        <button type="submit" className="rounded-xl border border-zinc-700 px-3 text-xs font-semibold text-zinc-200 hover:border-lime-400/50 transition">Check in</button>
      </form>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Recent check-ins</p>
        <ul className="space-y-1.5">
          {feed.slice(0, 5).map((c: any) => (
            <li key={c.id} className="flex justify-between rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs">
              <span className="text-zinc-200">{short(c.member)}</span>
              <span className="text-zinc-500">{c.time}</span>
            </li>
          ))}
        </ul>
      </div>
      </div>
    </div>
  );
}

function TrialForm({ onSubmit }: any) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [interest, setInterest] = useState('Strength training');
  const f = 'w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-3 text-sm text-white focus:outline-none focus:border-lime-400/60';
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name: name.trim(), mobile: mobile.trim(), interest });
        setName('');
        setMobile('');
      }}
      className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 grid gap-3 sm:grid-cols-4 items-end"
    >
      <div className="sm:col-span-4">
        <h3 className="text-xl font-black text-white">Book a free trial session</h3>
        <p className="text-sm text-zinc-400">Leave your details and our team will call you to fix a time.</p>
      </div>
      <label className="text-xs font-semibold text-zinc-400">Name<input required value={name} onChange={(e) => setName(e.target.value)} className={`mt-1 ${f}`} /></label>
      <label className="text-xs font-semibold text-zinc-400">Mobile<input required value={mobile} onChange={(e) => setMobile(e.target.value)} inputMode="tel" className={`mt-1 ${f}`} /></label>
      <label className="text-xs font-semibold text-zinc-400">Interested in
        <select value={interest} onChange={(e) => setInterest(e.target.value)} className={`mt-1 ${f}`}>
          {['Strength training', 'Weight loss coaching', 'Yoga', 'Zumba', 'Personal training'].map((o) => <option key={o}>{o}</option>)}
        </select>
      </label>
      <button type="submit" className="rounded-xl bg-lime-400 py-3 text-sm font-bold text-zinc-950 hover:bg-lime-300 transition">Request free trial</button>
    </form>
  );
}

function PhoneShell({ isBare, wide, children }: any) {
  return (
    <div className={`flex flex-col items-center justify-center ${isBare ? '' : 'py-3 px-2'}`}>
      <div
        className={`relative w-full shrink-0 bg-zinc-950 overflow-hidden ${isBare ? '' : 'max-w-[390px] rounded-[46px] border-[10px] border-zinc-800 ring-1 ring-white/10'}`}
        style={isBare ? { width: '100%', maxWidth: wide ? 900 : 430, margin: '0 auto', height: '100dvh', overflowY: 'auto' } : { width: '100%', maxWidth: 390, height: 'clamp(540px, calc(100vh - 200px), 844px)', borderRadius: 46, border: '10px solid #27272a', overflowY: 'auto' }}
      >
        {children}
      </div>
    </div>
  );
}

// --- PERFORMANCE & BATTERY HELPERS ---
// Pause timers while the app is in the background.
function useVisible() {
  const [visible, setVisible] = useState(typeof document === 'undefined' || !document.hidden);
  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return visible;
}

// Turn on battery saver by default for low-memory / low-core phones, data saver, or reduced-motion users.
const detectLowEnd = () => {
  if (typeof window === 'undefined') return false;
  const n: any = navigator;
  return !!(
    n.connection?.saveData ||
    (n.deviceMemory && n.deviceMemory <= 2) ||
    (n.hardwareConcurrency && n.hardwareConcurrency <= 4) ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
};
const detectTablet = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;

// The QR countdown ticks once a second. It lives in its own memoised component so only this small
// piece re-renders each second, not the whole app, and it stops while the app is in the background.
const QR_SECONDS = 30;
const QrPass = memo(function QrPass({ name, scanAnimation, tokenRef }: any) {
  const visible = useVisible();
  const [sec, setSec] = useState(25);
  const [token, setToken] = useState(tokenRef.current);
  const endsAt = useRef(Date.now() + 25000);
  useEffect(() => {
    if (!visible) return;
    const tick = () => {
      let left = Math.ceil((endsAt.current - Date.now()) / 1000);
      if (left <= 0) {
        const t = `APX-${Math.floor(1000 + Math.random() * 9000)}-Z7`;
        tokenRef.current = t;
        setToken(t);
        endsAt.current = Date.now() + QR_SECONDS * 1000;
        left = QR_SECONDS;
      }
      setSec(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [visible, tokenRef]);
  const cells = useMemo(
    () => Array.from({ length: 49 }, (_, idx) => idx < 2 || idx === 5 || idx === 6 || idx === 42 || idx === 43 || idx % 7 === 0 || (idx + sec) % 3 === 0),
    [sec]
  );
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-lime-400 font-bold">Express Gate Access Pass</span>
          <h3 className="text-base font-bold text-white">{name}</h3>
        </div>
        <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full text-xs text-zinc-300">
          <RefreshCw className="w-3 h-3 text-lime-400" />
          <span>{sec}s</span>
        </div>
      </div>
      <div className="relative mx-auto my-2 w-44 h-44 bg-white rounded-2xl p-3 flex flex-col items-center justify-center shadow-inner">
        <div className="grid grid-cols-7 gap-1 w-full h-full">
          {cells.map((dark, idx) => (
            <div key={idx} className={`rounded-[2px] ${dark ? 'bg-zinc-950' : 'bg-zinc-200'}`} />
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-11 h-11 rounded-xl bg-lime-400 border-4 border-white flex items-center justify-center shadow-md">
            <QrCode className="w-5 h-5 text-zinc-950" />
          </div>
        </div>
        {scanAnimation && (
          <div className="absolute inset-0 bg-lime-400/20 rounded-2xl flex flex-col items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-zinc-950 fill-lime-400" />
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-950 bg-lime-400 px-2 py-0.5 rounded mt-1">Gate Unlocked</span>
          </div>
        )}
      </div>
      <p className="text-center text-[11px] font-mono text-zinc-400 mt-2">
        TOKEN: <span className="text-lime-400 font-semibold">{token}</span>
      </p>
    </>
  );
});

// True on a phone (Capacitor app, installed PWA, or any narrow screen): show the member app full-screen, no phone frame.
const detectBare = () =>
  typeof window !== 'undefined' &&
  (!!(window as any).Capacitor?.isNativePlatform?.() ||
    window.matchMedia('(max-width: 640px)').matches ||
    new URLSearchParams(window.location.search).has('app'));

export default function App() {
  const [isBare, setIsBare] = useState(detectBare);
  const [isTablet, setIsTablet] = useState(detectTablet);
  useEffect(() => {
    const m = window.matchMedia('(max-width: 640px)');
    const t = window.matchMedia('(min-width: 768px)');
    const onChange = () => {
      setIsBare(detectBare());
      setIsTablet(detectTablet());
    };
    m.addEventListener('change', onChange);
    t.addEventListener('change', onChange);
    return () => {
      m.removeEventListener('change', onChange);
      t.removeEventListener('change', onChange);
    };
  }, []);
  const wide = isBare && isTablet;

  // --- TOP-LEVEL NAVIGATION STATE ---
  // 'mobile' | 'web' | 'split'
  const [platformMode, setPlatformMode] = useState('mobile');
  // Sub-tabs for Mobile: 'home' | 'classes' | 'workouts' | 'billing'
  const [mobileTab, setMobileTab] = useState('home');
  // Sub-tabs for Web: 'landing' | 'admin'
  const [webTab, setWebTab] = useState('admin');

  // --- SHARED REAL-TIME STATE BETWEEN MOBILE APP & ADMIN PORTAL ---
  const [classes, setClasses] = useState(INITIAL_CLASSES);
  const [workoutLogs, setWorkoutLogs] = useState(INITIAL_WORKOUT_LOGS);
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [checkInFeed, setCheckInFeed] = useState(INITIAL_CHECKIN_FEED);
  const [occupancy, setOccupancy] = useState(64); // Out of 120 max capacity
  const [maxOccupancy] = useState(120);

  // Member profile state (synced across views)
  const [memberProfile, setMemberProfile] = useState({
    name: 'Rohan Sharma',
    tier: 'Annual Pro',
    status: 'Active',
    streakDays: 14,
    nextRenewal: 'Dec 01, 2026',
    cardLast4: '4829',
    isCheckedIn: true,
    memberId: 'APX-2041',
    mobile: '+91 98300 10001',
    email: 'rohan.sharma@example.com',
    goal: 'Build muscle',
    homeClub: 'Park Street',
    coach: 'Karan Singh',
    joined: 'Jan 12, 2026',
    emergencyContact: 'Meera Sharma · +91 98300 20002'
  });

  // More tab: 'menu' | 'edit' | 'settings' | 'contact'
  const [moreView, setMoreView] = useState('menu');
  const [settings, setSettings] = useState({
    whatsapp: true,
    push: true,
    classReminders: true,
    faceEntry: false,
    language: 'English',
    lite: detectLowEnd()
  });
  const [frontDeskMessages, setFrontDeskMessages] = useState<any[]>([]);
  const [deskDraft, setDeskDraft] = useState('');
  const [session, setSession] = useState<any>(null); // null | { role: 'member' | 'staff' | 'manager', name }
  const [leads, setLeads] = useState(INITIAL_LEADS);

  // Live QR Token Countdown & Scan state
  const qrTokenRef = useRef('APX-8942-X9');
  const [scanAnimation, setScanAnimation] = useState(false);

  // Notification Toast State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // --- SHARED ACTIONS ---
  // 1. Simulate Turnstile QR Check-In from Mobile App
  const handleSimulateCheckIn = () => {
    setScanAnimation(true);
    setTimeout(() => {
      setScanAnimation(false);
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newEntry = {
        id: `chk-${Date.now()}`,
        member: `${memberProfile.name} (You)`,
        tier: memberProfile.tier,
        time: nowStr,
        method: `QR Token (${qrTokenRef.current})`,
        gate: 'Front desk scanner'
      };
      setCheckInFeed((prev) => [newEntry, ...prev.slice(0, 7)]);
      setOccupancy((prev) => Math.min(maxOccupancy, prev + 1));
      setMemberProfile((prev) => ({
        ...prev,
        streakDays: prev.streakDays + 1,
        isCheckedIn: true
      }));
      showToast('Check-in verified! Admin occupancy updated.');
    }, 900);
  };

  // 2. Book or Cancel Class Slot (Updates both Mobile App and Admin Roster)
  const handleToggleClassBooking = (classId) => {
    setClasses((prevClasses) =>
      prevClasses.map((cls) => {
        if (cls.id !== classId) return cls;

        if (cls.isBookedByMe) {
          // Cancel booking
          showToast(`Canceled spot in "${cls.title}". Admin roster updated.`, 'info');
          return {
            ...cls,
            isBookedByMe: false,
            bookedCount: Math.max(0, cls.bookedCount - 1),
            roster: cls.roster.filter((r) => !r.includes('You'))
          };
        } else {
          // Book or join waitlist
          const isFull = cls.bookedCount >= cls.capacity;
          if (isFull) {
            showToast(`Added to Priority Waitlist for "${cls.title}".`, 'info');
            return {
              ...cls,
              isBookedByMe: true,
              waitlistCount: cls.waitlistCount + 1,
              roster: [`${memberProfile.name} (You - Waitlist)`, ...cls.roster]
            };
          } else {
            showToast(`Spot confirmed in "${cls.title}"! Synced with Admin Portal.`);
            return {
              ...cls,
              isBookedByMe: true,
              bookedCount: cls.bookedCount + 1,
              roster: [`${memberProfile.name} (You)`, ...cls.roster]
            };
          }
        }
      })
    );
  };

  // 3. Log Workout Set/PR in Mobile App
  const [newExercise, setNewExercise] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [newSets, setNewSets] = useState('4');
  const [newReps, setNewReps] = useState('8');
  const [newIsPR, setNewIsPR] = useState(true);

  const handleAddWorkout = (e) => {
    e.preventDefault();
    if (!newExercise.trim() || !newWeight.trim()) return;
    const entry = {
      id: `w-${Date.now()}`,
      exercise: newExercise,
      weight: newWeight.includes('lbs') || newWeight.includes('kg') ? newWeight : `${newWeight} kg`,
      sets: Number(newSets) || 3,
      reps: Number(newReps) || 8,
      date: 'Just now',
      isPR: newIsPR
    };
    setWorkoutLogs((prev) => [entry, ...prev]);
    setNewExercise('');
    setNewWeight('');
    showToast(`Logged ${entry.exercise} (${entry.weight})!`);
  };

  // 4. Admin Create New Class Slot (Immediately appears on Member Mobile App!)
  const [newClassTitle, setNewClassTitle] = useState('');
  const [newClassCategory, setNewClassCategory] = useState('HIIT');
  const [newClassTrainer, setNewClassTrainer] = useState('Karan Singh');
  const [newClassTime, setNewClassTime] = useState('06:00 PM');
  const [newClassCapacity, setNewClassCapacity] = useState(16);

  const handleAdminCreateClass = (e) => {
    e.preventDefault();
    if (!newClassTitle.trim()) return;
    const created = {
      id: `cls-${Date.now()}`,
      title: newClassTitle,
      category: newClassCategory,
      trainer: newClassTrainer,
      time: newClassTime,
      duration: '45 min',
      room: 'Main Studio',
      capacity: Number(newClassCapacity) || 16,
      bookedCount: 1,
      isBookedByMe: false,
      waitlistCount: 0,
      intensity: 'High',
      roster: ['Early Bird Member']
    };
    setClasses((prev) => [created, ...prev]);
    setNewClassTitle('');
    showToast(`Created "${created.title}"! Now live on the Member Mobile App.`);
  };

  // 5. Public Website Plan Checkout Modal Simulation
  const [checkoutModalPlan, setCheckoutModalPlan] = useState(null);
  const [checkoutName, setCheckoutName] = useState('');

  const handleCompleteWebsiteJoin = (e) => {
    e.preventDefault();
    if (!checkoutModalPlan) return;
    const joinedName = checkoutName.trim() || 'New Web Member';
    const newMemberObj = {
      id: `MEM-${Math.floor(910 + Math.random() * 89)}`,
      name: joinedName,
      plan: checkoutModalPlan.name,
      status: 'Active',
      mrr: checkoutModalPlan.price,
      lastCheckIn: 'Web Signup',
      avatar: joinedName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
      checkedInNow: false
    };
    setMembers((prev) => [newMemberObj, ...prev]);
    setMemberProfile((prev) => ({
      ...prev,
      tier: checkoutModalPlan.name
    }));
    setCheckoutModalPlan(null);
    setCheckoutName('');
    showToast(`Membership activated for ${joinedName} (${checkoutModalPlan.name})!`);
  };

  // --- MOBILE: MEMBER DETAILS, SETTINGS & FRONT DESK MESSAGES ---
  const handleSaveDetails = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setMemberProfile((p) => ({
      ...p,
      name: String(f.get('name') || '').trim() || p.name,
      mobile: String(f.get('mobile') || p.mobile),
      email: String(f.get('email') || p.email),
      goal: String(f.get('goal') || p.goal),
      emergencyContact: String(f.get('emergencyContact') || p.emergencyContact)
    }));
    setMoreView('menu');
    showToast('Details updated');
  };

  const handleSendDeskMessage = (e) => {
    e.preventDefault();
    if (!deskDraft.trim()) return;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setFrontDeskMessages((prev) => [{ id: Date.now(), from: memberProfile.name, text: deskDraft.trim(), time: nowStr }, ...prev]);
    setDeskDraft('');
    showToast('Message sent to the front desk');
  };

  const toggleSetting = (key) => setSettings((s) => ({ ...s, [key]: !s[key] }));

  // --- SIGN-IN, STAFF SCANNER, TRIAL LEADS ---
  const handleLogin = (sess) => {
    setSession(sess);
    setMobileTab('home');
    showToast(`Signed in as ${sess.name}`);
  };
  const handleLogout = () => {
    setSession(null);
    setMoreView('menu');
    showToast('Signed out');
  };
  const handleStaffCheckIn = (m) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setCheckInFeed((prev) => [{ id: `chk-${Date.now()}`, member: m.name, tier: m.plan, time: nowStr, method: 'Staff QR scan', gate: 'Front desk scanner' }, ...prev.slice(0, 7)]);
    setOccupancy((prev) => Math.min(maxOccupancy, prev + 1));
    setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, lastCheckIn: 'Just now', checkedInNow: true } : x)));
  };
  const handleAddLead = ({ name, mobile, interest }) => {
    setLeads((prev) => [{ id: `lead-${Date.now()}`, name, mobile, interest, status: 'New', time: 'Just now' }, ...prev]);
    showToast('Trial request sent. We will call you shortly.');
  };
  const handleLeadStatus = (id, status) => setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));

  // --- FILTERED CLASSES FOR MOBILE APP ---
  const [selectedCategory, setSelectedCategory] = useState('All');
  const filteredClasses = useMemo(() => {
    if (selectedCategory === 'All') return classes;
    return classes.filter((c) => c.category === selectedCategory);
  }, [classes, selectedCategory]);

  // --- ADMIN SELECTED CLASS ROSTER DRAWER ---
  const [selectedRosterClassId, setSelectedRosterClassId] = useState(INITIAL_CLASSES[0].id);
  const activeRosterClass = useMemo(
    () => classes.find((c) => c.id === selectedRosterClassId) || classes[0],
    [classes, selectedRosterClassId]
  );

  // --- RENDER MOBILE SIMULATOR COMPONENT ---
  const renderMobileSimulator = () => {
    if (!session || session.role !== 'member') {
      return (
        <PhoneShell isBare={isBare} wide={wide}>
          {!session && <LoginPanel onLogin={handleLogin} />}
          {session?.role === 'staff' && (
            <StaffScanner wide={wide} name={session.name} members={members} feed={checkInFeed} occupancy={occupancy} maxOccupancy={maxOccupancy} onCheckIn={handleStaffCheckIn} onLogout={handleLogout} />
          )}
          {session?.role === 'manager' && (
            <div className="px-6 py-10 space-y-4">
              <h3 className="text-lg font-bold text-white">Managers use the web admin</h3>
              <p className="text-sm text-zinc-400">Revenue, members and reports are on the web dashboard, so they are not in the phone app.</p>
              {!isBare && (
                <button onClick={() => { setPlatformMode('web'); setWebTab('admin'); }} className="w-full rounded-xl bg-lime-400 py-3 text-sm font-bold text-zinc-950">Open web admin</button>
              )}
              <button onClick={handleLogout} className="w-full rounded-xl border border-zinc-700 py-3 text-sm font-semibold text-zinc-200">Log out</button>
            </div>
          )}
        </PhoneShell>
      );
    }
    return renderMemberApp();
  };

  const renderMemberApp = () => {
    const myBookedClasses = classes.filter((c) => c.isBookedByMe);

    return (
      <div className={`flex flex-col items-center justify-center ${isBare ? '' : 'py-3 px-2'}`}>
        {!isBare && (
        <div className="mb-3 flex items-center gap-2 rounded-full bg-zinc-900/90 border border-zinc-800 px-4 py-1.5 text-xs text-zinc-400 shadow-lg">
          <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
          <span>Live Sync Enabled: Actions inside phone update Admin Portal instantaneously</span>
        </div>

        )}

        {/* Sleek Smartphone Frame */}
        <div className={`relative w-full shrink-0 bg-zinc-950 overflow-hidden flex flex-col justify-between ${isBare ? '' : 'max-w-[390px] rounded-[46px] border-[10px] border-zinc-800 ring-1 ring-white/10'}`}
          style={
            isBare
              ? { width: '100%', maxWidth: wide ? 900 : 430, margin: '0 auto', height: '100dvh' }
              : {
                  width: '100%',
                  maxWidth: 390,
                  height: 'clamp(540px, calc(100vh - 200px), 844px)',
                  borderRadius: 46,
                  border: '10px solid #27272a',
                  boxShadow: '0 25px 70px -15px rgba(163,230,53,0.18)'
                }
          }
        >
          {!isBare && (
          <div className="sticky top-0 z-30 bg-zinc-950 pt-3 pb-2 px-6 flex items-center justify-between border-b border-zinc-900">
            <span className="text-xs font-semibold tracking-wider text-zinc-300">9:41</span>
            <div className="w-24 h-5 bg-black rounded-full border border-zinc-800/80 flex items-center justify-end px-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-lime-400 font-medium">
              <Zap className="w-3.5 h-3.5 fill-lime-400" />
              <span>5G</span>
            </div>
          </div>
          )}

          {/* Mobile App Header */}
          <div
            className="px-5 pt-3 pb-2 flex items-center justify-between bg-zinc-950"
            style={isBare ? { paddingTop: 'calc(env(safe-area-inset-top) + 12px)' } : undefined}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-lime-400 flex items-center justify-center text-zinc-950 font-black tracking-tighter text-sm">
                AX
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight leading-none">APEX GYM</h2>
                <span className="text-[11px] text-lime-400 font-medium flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3" /> {memberProfile.status} • {memberProfile.tier}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileTab('more');
                setMoreView('menu');
              }}
              className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-bold text-lime-400 hover:border-lime-400/50 transition"
              title="Member Settings"
            >
              {memberProfile.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
            </button>
          </div>

          {/* Scrollable Mobile Content Area */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3 space-y-5 scrollbar-thin scrollbar-thumb-zinc-800">
            {/* TAB 1: HOME / DASHBOARD */}
            {mobileTab === 'home' && (
              <>
                {/* Customer greeting, photos and details */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-400">Welcome back</p>
                    <h3 className="text-lg font-bold text-white">Hi, {memberProfile.name.split(' ')[0]}</h3>
                  </div>
                  <button
                    onClick={() => {
                      setMobileTab('more');
                      setMoreView('edit');
                    }}
                    className="flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-lime-400 hover:border-lime-400/50 transition"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                </div>

                <GymPhotoCarousel photos={GYM_PHOTOS} autoplay={!settings.lite} />

                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
                  <h4 className="text-sm font-bold text-white">My details</h4>
                  <div className={`mt-3 grid gap-x-3 gap-y-3 ${wide ? 'grid-cols-4' : 'grid-cols-2'}`}>
                    {[
                      ['Member ID', memberProfile.memberId],
                      ['Plan', memberProfile.tier],
                      ['Valid till', memberProfile.nextRenewal],
                      ['Home club', memberProfile.homeClub],
                      ['Your coach', memberProfile.coach],
                      ['Member since', memberProfile.joined],
                      ['Mobile', memberProfile.mobile],
                      ['Email', memberProfile.email],
                      ['Goal', memberProfile.goal]
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
                        <p className="text-xs font-semibold text-zinc-200 break-all">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Gym Occupancy Banner */}
                <div className="rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800/90 p-3.5 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Live Club Crowd Meter</p>
                      <p className="text-sm font-bold text-white">
                        {occupancy} / {maxOccupancy} Active Athletes
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {Math.round((occupancy / maxOccupancy) * 100)}% Cap
                  </span>
                </div>

                {/* Digital QR Code Check-in Pass Card */}
                <div className="relative rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-lime-400/30 p-5 shadow-xl overflow-hidden">
                  <QrPass name={memberProfile.name} scanAnimation={scanAnimation} tokenRef={qrTokenRef} />

                  <button
                    onClick={handleSimulateCheckIn}
                    className="mt-3 w-full py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 active:scale-[0.99] text-zinc-950 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    Tap to Simulate Desk Scan
                  </button>
                </div>

                {/* Streak & Quick Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">Active Streak</span>
                      <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                    </div>
                    <p className="text-xl font-black text-white mt-1">{memberProfile.streakDays} Days</p>
                    <p className="text-[11px] text-emerald-400 mt-0.5">Top 5% in club this month</p>
                  </div>
                  <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">Booked Sessions</span>
                      <Calendar className="w-4 h-4 text-lime-400" />
                    </div>
                    <p className="text-xl font-black text-white mt-1">{myBookedClasses.length} Upcoming</p>
                    <button
                      onClick={() => setMobileTab('classes')}
                      className="text-[11px] text-lime-400 hover:underline mt-0.5 flex items-center gap-0.5"
                    >
                      Manage schedule <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Upcoming Booked Classes List */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      My Upcoming Sessions
                    </h4>
                    <button
                      onClick={() => setMobileTab('classes')}
                      className="text-xs text-lime-400 font-semibold hover:underline"
                    >
                      + Book More
                    </button>
                  </div>

                  {myBookedClasses.length === 0 ? (
                    <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-4 text-center">
                      <p className="text-xs text-zinc-400">No classes currently booked today.</p>
                      <button
                        onClick={() => setMobileTab('classes')}
                        className="mt-2 px-3 py-1.5 rounded-lg bg-zinc-800 text-lime-400 text-xs font-semibold"
                      >
                        Explore Today's Schedule
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {myBookedClasses.map((cls) => (
                        <div
                          key={cls.id}
                          className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3.5 flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-lime-400/15 text-lime-400">
                                {cls.time}
                              </span>
                              <span className="text-xs text-zinc-400">{cls.room}</span>
                            </div>
                            <p className="text-sm font-bold text-white mt-1">{cls.title}</p>
                            <p className="text-[11px] text-zinc-400">Coach {cls.trainer}</p>
                          </div>
                          <button
                            onClick={() => handleToggleClassBooking(cls.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 text-zinc-300 text-xs font-medium transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* TAB 2: CLASS & TRAINER SLOT BOOKING */}
            {mobileTab === 'classes' && (
              <>
                <div>
                  <h3 className="text-base font-bold text-white">Class & Trainer Schedule</h3>
                  <p className="text-xs text-zinc-400">
                    Real-time studio capacity • Instant booking confirmation
                  </p>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {['All', 'HIIT', 'Strength', 'Yoga', 'Zumba', 'Personal Training'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                        selectedCategory === cat
                          ? 'bg-lime-400 text-zinc-950 shadow-md shadow-lime-400/20'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Class Cards */}
                <div className={wide ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
                  {filteredClasses.map((cls) => {
                    const isFull = cls.bookedCount >= cls.capacity;
                    const fillPercent = Math.min(100, Math.round((cls.bookedCount / cls.capacity) * 100));

                    return (
                      <div
                        key={cls.id}
                        className={`rounded-2xl p-4 border transition ${
                          cls.isBookedByMe
                            ? 'bg-zinc-900/95 border-lime-400/50'
                            : 'bg-zinc-900/70 border-zinc-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-lime-400">
                                {cls.category}
                              </span>
                              <span className="text-xs text-zinc-400 font-medium">
                                {cls.time} ({cls.duration})
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-white mt-1.5">{cls.title}</h4>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              with <span className="text-zinc-200 font-medium">{cls.trainer}</span> • {cls.room}
                            </p>
                          </div>

                          {cls.isBookedByMe && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-lime-400/20 text-lime-300 border border-lime-400/30 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Booked
                            </span>
                          )}
                        </div>

                        {/* Capacity Progress Bar */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-zinc-400">
                              {cls.bookedCount}/{cls.capacity} spots booked
                            </span>
                            <span
                              className={`font-semibold ${
                                isFull ? 'text-orange-400' : 'text-emerald-400'
                              }`}
                            >
                              {isFull
                                ? `Waitlist (${cls.waitlistCount} waiting)`
                                : `${cls.capacity - cls.bookedCount} spots left`}
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isFull ? 'bg-orange-500' : 'bg-lime-400'
                              }`}
                              style={{ width: `${fillPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => handleToggleClassBooking(cls.id)}
                          className={`mt-3 w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            cls.isBookedByMe
                              ? 'bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 text-zinc-200'
                              : isFull
                              ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30'
                              : 'bg-lime-400 hover:bg-lime-300 text-zinc-950'
                          }`}
                        >
                          {cls.isBookedByMe
                            ? 'Cancel Reservation'
                            : isFull
                            ? 'Join Priority Waitlist'
                            : 'Book Instant Spot'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* TAB 3: WORKOUT & PROGRESS TRACKER */}
            {mobileTab === 'workouts' && (
              <>
                <div>
                  <h3 className="text-base font-bold text-white">Workout & PR Log</h3>
                  <p className="text-xs text-zinc-400">Track sets, personal records, and weekly volume</p>
                </div>

                {/* Weekly Attendance Visual Tracker */}
                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-zinc-300">Weekly Attendance Goal</span>
                    <span className="text-xs font-bold text-lime-400">5 / 5 Days Hit</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {[
                      { d: 'M', done: true },
                      { d: 'T', done: true },
                      { d: 'W', done: false },
                      { d: 'T', done: true },
                      { d: 'F', done: true },
                      { d: 'S', done: true },
                      { d: 'S', done: false }
                    ].map((item, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                            item.done
                              ? 'bg-lime-400 text-zinc-950 shadow-sm shadow-lime-400/30'
                              : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          {item.done ? <Check className="w-4 h-4 stroke-[3]" /> : item.d}
                        </div>
                        <span className="text-[10px] text-zinc-500">{item.d}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Log Form */}
                <form
                  onSubmit={handleAddWorkout}
                  className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-lime-400" /> Quick Log Lift / Set
                    </span>
                    <label className="flex items-center gap-1.5 text-[11px] text-amber-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newIsPR}
                        onChange={(e) => setNewIsPR(e.target.checked)}
                        className="rounded accent-lime-400"
                      />
                      New PR!
                    </label>
                  </div>

                  <input
                    type="text"
                    placeholder="Exercise (e.g. Bench Press, Squat)"
                    value={newExercise}
                    onChange={(e) => setNewExercise(e.target.value)}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400"
                  />

                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Weight (100 kg)"
                      value={newWeight}
                      onChange={(e) => setNewWeight(e.target.value)}
                      className="rounded-xl bg-zinc-950 border border-zinc-800 px-2.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400"
                    />
                    <input
                      type="number"
                      placeholder="Sets"
                      value={newSets}
                      onChange={(e) => setNewSets(e.target.value)}
                      className="rounded-xl bg-zinc-950 border border-zinc-800 px-2.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400"
                    />
                    <input
                      type="number"
                      placeholder="Reps"
                      value={newReps}
                      onChange={(e) => setNewReps(e.target.value)}
                      className="rounded-xl bg-zinc-950 border border-zinc-800 px-2.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-bold text-xs transition"
                  >
                    Save Lift Entry
                  </button>
                </form>

                {/* Logged Lifts History */}
                <div className="space-y-2">
                  {workoutLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-white">{log.exercise}</p>
                          {log.isPR && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30 text-[10px] font-bold flex items-center gap-0.5">
                              <Award className="w-2.5 h-2.5" /> PR
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {log.sets} sets × {log.reps} reps • {log.date}
                        </p>
                      </div>
                      <span className="text-sm font-black text-lime-400">{log.weight}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* TAB 4: MEMBERSHIP & BILLING */}
            {mobileTab === 'billing' && (
              <>
                <div>
                  <h3 className="text-base font-bold text-white">Membership & Billing</h3>
                  <p className="text-xs text-zinc-400">Manage plan, payment method & invoices</p>
                </div>

                {/* Active Plan Card */}
                <div className="rounded-2xl bg-gradient-to-br from-lime-400/20 via-zinc-900 to-zinc-900 border border-lime-400/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-lime-400 text-zinc-950 uppercase">
                      Active Plan
                    </span>
                    <span className="text-xs text-zinc-300 font-medium">Renews {memberProfile.nextRenewal}</span>
                  </div>
                  <h4 className="text-lg font-black text-white mt-2">{memberProfile.tier}</h4>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    Unlimited Club Access • Steam & Sauna • Priority Booking
                  </p>
                  <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between">
                    <span className="text-sm font-bold text-white">₹1,250 / month</span>
                    <button
                      onClick={() => {
                        setPlatformMode('web');
                        setWebTab('landing');
                        showToast('Switched to Website Plan Comparison to upgrade or change tier.');
                      }}
                      className="text-xs font-bold text-lime-400 hover:underline"
                    >
                      Change Plan
                    </button>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-lime-400">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">UPI AutoPay • HDFC •••• {memberProfile.cardLast4}</p>
                      <p className="text-[11px] text-zinc-400">Mandate active • Valid till 08/29</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const next4 = Math.floor(1000 + Math.random() * 9000);
                      setMemberProfile((p) => ({ ...p, cardLast4: String(next4) }));
                      showToast(`Updated AutoPay bank account to HDFC •••• ${next4}`);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200"
                  >
                    Edit
                  </button>
                </div>

                {/* Downloadable Invoice History */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    GST Invoice History
                  </h4>
                  <div className="space-y-2">
                    {INVOICES.map((inv) => (
                      <div
                        key={inv.id}
                        className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{inv.date}</p>
                          <p className="text-[11px] text-zinc-400">
                            {inv.id} • {inv.amount}
                          </p>
                        </div>
                        <button
                          onClick={() => showToast(`Downloaded PDF receipt for ${inv.id}`)}
                          className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-lime-400 text-xs font-semibold flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* TAB 5: MORE (DETAILS, SETTINGS, CONTACT) */}
            {mobileTab === 'more' && (
              <>
                {moreView === 'menu' && (
                  <>
                    <div>
                      <h3 className="text-base font-bold text-white">More</h3>
                      <p className="text-xs text-zinc-400">Your details, settings and contact</p>
                    </div>
                    {[
                      { id: 'edit', label: 'My details', sub: memberProfile.name, icon: User },
                      { id: 'settings', label: 'Settings', sub: 'Notifications, language, privacy', icon: SettingsIcon },
                      { id: 'contact', label: 'Contact us', sub: 'Call, WhatsApp, directions', icon: Phone }
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setMoreView(item.id)}
                          className="w-full flex items-center justify-between rounded-2xl bg-zinc-900 border border-zinc-800 p-4 text-left hover:border-lime-400/40 transition"
                        >
                          <span className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400">
                              <Icon className="w-5 h-5" />
                            </span>
                            <span>
                              <span className="block text-sm font-bold text-white">{item.label}</span>
                              <span className="block text-xs text-zinc-400">{item.sub}</span>
                            </span>
                          </span>
                          <ChevronRight className="w-4 h-4 text-zinc-500" />
                        </button>
                      );
                    })}
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 py-3 text-sm font-semibold text-zinc-300 hover:border-red-500/40 hover:text-red-400 transition">
                      <LogOut className="w-4 h-4" /> Log out
                    </button>
                  </>
                )}

                {moreView !== 'menu' && (
                  <button onClick={() => setMoreView('menu')} className="flex items-center gap-1 text-xs font-semibold text-lime-400">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                )}

                {moreView === 'edit' && (
                  <form onSubmit={handleSaveDetails} className="space-y-3">
                    <h3 className="text-base font-bold text-white">My details</h3>
                    {[
                      ['name', 'Full name', memberProfile.name, 'text'],
                      ['mobile', 'Mobile', memberProfile.mobile, 'tel'],
                      ['email', 'Email', memberProfile.email, 'email'],
                      ['emergencyContact', 'Emergency contact', memberProfile.emergencyContact, 'text']
                    ].map(([key, label, value, type]) => (
                      <label key={key} className="block text-xs font-semibold text-zinc-400">
                        {label}
                        <input
                          name={key}
                          type={type}
                          defaultValue={value}
                          required={key === 'name'}
                          className="mt-1 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-lime-400/60"
                        />
                      </label>
                    ))}
                    <label className="block text-xs font-semibold text-zinc-400">
                      Goal
                      <select
                        name="goal"
                        defaultValue={memberProfile.goal}
                        className="mt-1 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-lime-400/60"
                      >
                        <option>Build muscle</option>
                        <option>Lose weight</option>
                        <option>General fitness</option>
                      </select>
                    </label>
                    <button type="submit" className="w-full rounded-xl bg-lime-400 py-3 text-sm font-bold text-zinc-950 hover:bg-lime-300 transition">
                      Save details
                    </button>
                  </form>
                )}

                {moreView === 'settings' && (
                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-white">Settings</h3>
                    {[
                      ['whatsapp', 'WhatsApp reminders and invoices'],
                      ['push', 'Push notifications'],
                      ['classReminders', 'Class reminders, 1 hour before'],
                      ['faceEntry', 'Face-recognition entry (optional)'],
                      ['lite', 'Battery saver: fewer animations']
                    ].map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
                        <span className="text-sm text-zinc-200 pr-3">{label}</span>
                        <Toggle checked={settings[key]} label={label} onChange={() => toggleSetting(key)} />
                      </div>
                    ))}
                    <label className="block rounded-2xl bg-zinc-900 border border-zinc-800 p-4 text-xs font-semibold text-zinc-400">
                      Language
                      <select
                        value={settings.language}
                        onChange={(e) => {
                          setSettings((s) => ({ ...s, language: e.target.value }));
                          showToast(`Language set to ${e.target.value} (demo)`);
                        }}
                        className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-lime-400/60"
                      >
                        <option>English</option>
                        <option>हिन्दी</option>
                        <option>বাংলা</option>
                      </select>
                    </label>
                    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
                      <p className="text-xs text-zinc-400">Payments</p>
                      <p className="text-sm font-semibold text-white">UPI AutoPay · HDFC ••{memberProfile.cardLast4}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => showToast('Data export requested')}
                        className="flex-1 rounded-xl border border-zinc-700 py-2.5 text-xs font-semibold text-zinc-200 hover:border-lime-400/50 transition"
                      >
                        Download my data
                      </button>
                      <button
                        onClick={() => showToast('Deletion request sent to the front desk')}
                        className="flex-1 rounded-xl border border-red-500/40 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition"
                      >
                        Delete account
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-500">Demo only: settings reset when you reload.</p>
                  </div>
                )}

                {moreView === 'contact' && (
                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-white">Contact us</h3>
                    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 text-lime-400 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-white">{CLUB.name}</p>
                          <p className="text-xs text-zinc-400">{CLUB.address}</p>
                          <p className="text-xs text-zinc-400">{CLUB.hours}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <a href={`tel:${CLUB.phone.replace(/ /g, '')}`} className="flex items-center justify-center gap-1.5 rounded-xl bg-lime-400 py-2.5 text-xs font-bold text-zinc-950">
                          <Phone className="w-3.5 h-3.5" /> Call
                        </a>
                        <a href={`https://wa.me/${CLUB.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 py-2.5 text-xs font-semibold text-zinc-200">
                          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                        <a href={`mailto:${CLUB.email}`} className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 py-2.5 text-xs font-semibold text-zinc-200">
                          <Mail className="w-3.5 h-3.5" /> Email
                        </a>
                        <a href={CLUB.maps} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 py-2.5 text-xs font-semibold text-zinc-200">
                          <MapPin className="w-3.5 h-3.5" /> Directions
                        </a>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-zinc-400">Your coach</p>
                        <p className="text-sm font-bold text-white">{memberProfile.coach}</p>
                      </div>
                      <button
                        onClick={() => showToast(`Message sent to ${memberProfile.coach}`)}
                        className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-lime-400/50 transition"
                      >
                        Message coach
                      </button>
                    </div>
                    <form onSubmit={handleSendDeskMessage} className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-2">
                      <p className="text-sm font-bold text-white">Message the front desk</p>
                      <input
                        value={deskDraft}
                        onChange={(e) => setDeskDraft(e.target.value)}
                        placeholder="How can we help?"
                        className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-lime-400/60"
                      />
                      <button type="submit" className="w-full rounded-xl bg-lime-400 py-2.5 text-sm font-bold text-zinc-950 hover:bg-lime-300 transition">
                        Send
                      </button>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bottom App Navigation Bar */}
          <div
            className="bg-zinc-950/95 border-t border-zinc-900 px-2 py-2.5 grid grid-cols-5 gap-1"
            style={isBare ? { paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)' } : undefined}
          >
            {[
              { id: 'home', label: 'Home', icon: QrCode },
              { id: 'classes', label: 'Book Class', icon: Calendar },
              { id: 'workouts', label: 'Workouts', icon: Dumbbell },
              { id: 'billing', label: 'Billing', icon: CreditCard },
              { id: 'more', label: 'More', icon: SettingsIcon }
            ].map((item) => {
              const Icon = item.icon;
              const active = mobileTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setMobileTab(item.id);
                    if (item.id === 'more') setMoreView('menu');
                  }}
                  className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
                    active ? 'text-lime-400' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-semibold mt-1">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // --- RENDER PUBLIC WEBSITE & ADMIN PORTAL VIEW ---
  const renderWebsiteAndAdmin = () => {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Sub-Navigation Toggle between Public Landing Page and Admin Operations Dashboard */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lime-400 flex items-center justify-center text-zinc-950 font-black text-lg">
              AX
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight">
                APEX GYM • WEB & OPERATIONS SUITE
              </h1>
              <p className="text-xs text-zinc-400">
                Switch between the public-facing Marketing Website and the Live Staff Admin Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
            <button
              onClick={() => setWebTab('landing')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                webTab === 'landing'
                  ? 'bg-lime-400 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Public Landing Page
            </button>
            <button
              onClick={() => setWebTab('admin')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                webTab === 'admin'
                  ? 'bg-lime-400 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Admin & Operations Dashboard
            </button>
          </div>
        </div>

        {/* SUB-TAB A: PUBLIC MARKETING LANDING PAGE */}
        {webTab === 'landing' && (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="relative rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-zinc-800 p-8 sm:p-12 overflow-hidden">
              <div className="max-w-2xl space-y-5 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-400/15 border border-lime-400/30 text-lime-400 text-xs font-bold uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5" /> Next-Gen Performance Club • Open 5 AM – 11 PM
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                  ENGINEERED FOR <span className="text-lime-400">PEAK HUMAN</span> OUTPUT.
                </h2>
                <p className="text-zinc-400 text-base sm:text-lg leading-relaxed">
                  QR and face-recognition entry, competition-grade lifting platforms, a Zumba and yoga studio, and a steam and sauna lounge — all managed from the APEX app. Pay with UPI, get GST invoices on WhatsApp.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    onClick={() =>
                      setCheckoutModalPlan({ name: 'Annual Pro', price: '₹1,250', billing: 'Pay ₹15,000 yearly (GST extra)' })
                    }
                    className="px-6 py-3.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black text-sm uppercase tracking-wider transition shadow-lg shadow-lime-400/20"
                  >
                    Claim Annual Pro Pass (₹1,250/mo)
                  </button>
                  <button
                    onClick={() => {
                      setPlatformMode('mobile');
                      setMobileTab('classes');
                    }}
                    className="px-6 py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition flex items-center gap-2"
                  >
                    <Smartphone className="w-4 h-4 text-lime-400" /> Launch Mobile App Pass
                  </button>
                </div>
              </div>

              {/* Live Club Status Pill on Landing Page */}
              <div className="mt-8 pt-8 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl">
                  <p className="text-xs text-zinc-400">Live Club Occupancy</p>
                  <p className="text-2xl font-black text-lime-400 mt-1">
                    {occupancy} / {maxOccupancy}
                  </p>
                  <p className="text-[11px] text-emerald-400">No wait for racks right now</p>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl">
                  <p className="text-xs text-zinc-400">Competition Platforms</p>
                  <p className="text-2xl font-black text-white mt-1">16 Bays</p>
                  <p className="text-[11px] text-zinc-400">Calibrated kilo plates</p>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl">
                  <p className="text-xs text-zinc-400">Recovery Lab</p>
                  <p className="text-2xl font-black text-white mt-1">Steam & Sauna</p>
                  <p className="text-[11px] text-zinc-400">Steam + Ice Bath</p>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl">
                  <p className="text-xs text-zinc-400">Daily Studio Classes</p>
                  <p className="text-2xl font-black text-white mt-1">{classes.length} Live Slots</p>
                  <p className="text-[11px] text-lime-400">Synced with Mobile App</p>
                </div>
              </div>
            </div>

            <TrialForm onSubmit={handleAddLead} />

            {/* Interactive Membership Tier Comparison */}
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto">
                <span className="text-xs font-bold uppercase tracking-widest text-lime-400">
                  Transparent Membership Tiers
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  CHOOSE YOUR TRAINING ARSENAL
                </h3>
                <p className="text-sm text-zinc-400 mt-1">
                  Select any plan below to test the instant web checkout simulator (syncs directly to the Admin Member Roster).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    name: 'Monthly Flex',
                    price: '₹2,500',
                    period: '/month',
                    desc: 'No long-term contract. Full access to strength floor and cardio zones.',
                    features: [
                      'QR + Face Gate Access (5 AM–11 PM)',
                      'Unlimited Open Gym Floor',
                      '2 Group Studio Classes / Month',
                      'Mobile Workout & PR Tracker'
                    ],
                    highlight: false
                  },
                  {
                    name: 'Annual Pro',
                    price: '₹1,250',
                    period: '/month',
                    desc: 'Our most popular tier for dedicated athletes seeking unlimited classes & recovery.',
                    features: [
                      'Everything in Monthly Flex',
                      'Unlimited HIIT, Strength & Yoga Classes',
                      'Unlimited Steam, Sauna & Ice Bath',
                      '2 Free Guest Passes Every Month',
                      'Priority Waitlist Auto-Upgrade',
                      'Monthly Diet Plan Consult (Nutritionist)'
                    ],
                    highlight: true
                  },
                  {
                    name: 'Quarterly Performance',
                    price: '₹2,000',
                    period: '/month',
                    desc: 'Balanced 3-month commitment with monthly personal training check-ins.',
                    features: [
                      'QR + Face Gate Access (5 AM–11 PM)',
                      '8 Group Studio Classes / Month',
                      '1 Monthly 1-on-1 Coach Assessment',
                      'Full Recovery Lounge Access'
                    ],
                    highlight: false
                  }
                ].map((tier) => (
                  <div
                    key={tier.name}
                    className={`rounded-3xl p-6 flex flex-col justify-between border transition ${
                      tier.highlight
                        ? 'bg-gradient-to-b from-zinc-900 to-zinc-950 border-lime-400 shadow-xl shadow-lime-400/10'
                        : 'bg-zinc-900/70 border-zinc-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-black text-white">{tier.name}</h4>
                        {tier.highlight && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-lime-400 text-zinc-950">
                            Most Popular
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white">{tier.price}</span>
                        <span className="text-sm text-zinc-400">{tier.period}</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-2">{tier.desc}</p>

                      <ul className="mt-6 space-y-2.5">
                        {tier.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-zinc-200">
                            <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => setCheckoutModalPlan(tier)}
                      className={`mt-8 w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                        tier.highlight
                          ? 'bg-lime-400 hover:bg-lime-300 text-zinc-950'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                      }`}
                    >
                      Select {tier.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Elite Trainer Directory */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-lime-400">
                    Coaching Roster
                  </span>
                  <h3 className="text-2xl font-black text-white mt-0.5">MEET OUR PERFORMANCE COACHES</h3>
                </div>
                <button
                  onClick={() => {
                    setPlatformMode('mobile');
                    setMobileTab('classes');
                  }}
                  className="text-xs font-bold text-lime-400 hover:underline flex items-center gap-1"
                >
                  Book a Trainer in Mobile App <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {TRAINERS.map((tr) => (
                  <div
                    key={tr.name}
                    className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-lime-400/15 text-lime-400">
                          {tr.badge}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400" /> {tr.rating}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-3">{tr.name}</h4>
                      <p className="text-xs text-zinc-400 mt-1">{tr.specialty}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                      <span>{tr.certs}</span>
                      <span className="text-zinc-300 font-semibold">{tr.exp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB B: ADMIN & OPERATIONS DASHBOARD */}
        {webTab === 'admin' && session?.role !== 'manager' && (
          <div className="max-w-md mx-auto rounded-3xl bg-zinc-900 border border-zinc-800">
            <LoginPanel lockRole="manager" onLogin={handleLogin} />
          </div>
        )}
        {webTab === 'admin' && session?.role === 'manager' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Signed in as <b className="text-white">{session.name}</b></span>
              <button onClick={handleLogout} className="flex items-center gap-1 rounded-full border border-zinc-800 px-3 py-1.5 font-semibold hover:border-lime-400/50 transition"><LogOut className="w-3 h-3" /> Log out</button>
            </div>
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
              <h4 className="text-sm font-bold text-white">Free-trial leads ({leads.filter((l) => l.status === 'New').length} new)</h4>
              <ul className="mt-3 space-y-2">
                {leads.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-zinc-200"><b className="text-white">{l.name}</b> · <a className="text-lime-400" href={`tel:${l.mobile.replace(/ /g, '')}`}>{l.mobile}</a> · {l.interest} <span className="text-xs text-zinc-500">{l.time}</span></span>
                    <span className="flex items-center gap-2">
                      <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300">{l.status}</span>
                      {l.status === 'New' && <button onClick={() => handleLeadStatus(l.id, 'Called')} className="rounded-lg border border-zinc-700 px-2 py-1 text-xs hover:border-lime-400/50">Mark called</button>}
                      {l.status === 'Called' && <button onClick={() => handleLeadStatus(l.id, 'Joined')} className="rounded-lg bg-lime-400 px-2 py-1 text-xs font-bold text-zinc-950">Mark joined</button>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {frontDeskMessages.length > 0 && (
              <div className="rounded-2xl bg-zinc-900 border border-lime-400/30 p-5">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-lime-400" /> Member messages ({frontDeskMessages.length})
                </h4>
                <ul className="mt-3 space-y-2">
                  {frontDeskMessages.map((m) => (
                    <li key={m.id} className="text-sm text-zinc-300 flex justify-between gap-3">
                      <span><b className="text-white">{m.from}:</b> {m.text}</span>
                      <span className="text-xs text-zinc-500">{m.time}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Top KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Live Floor Occupancy
                  </span>
                  <Activity className="w-5 h-5 text-lime-400" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-white">
                    {occupancy} <span className="text-base font-normal text-zinc-500">/ {maxOccupancy}</span>
                  </span>
                  <span className="text-xs font-bold text-emerald-400">
                    {Math.round((occupancy / maxOccupancy) * 100)}% Load
                  </span>
                </div>
                <div className="mt-3 w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-lime-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((occupancy / maxOccupancy) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Active Subscriptions
                  </span>
                  <Users className="w-5 h-5 text-lime-400" />
                </div>
                <p className="text-3xl font-black text-white mt-2">{members.length + 840}</p>
                <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +18 net new members this week
                </p>
              </div>

              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Monthly Recurring (MRR)
                  </span>
                  <CreditCard className="w-5 h-5 text-lime-400" />
                </div>
                <p className="text-3xl font-black text-white mt-2">₹11,82,500</p>
                <p className="text-xs text-zinc-400 mt-1">98.4% UPI AutoPay success rate</p>
              </div>

              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Class Seat Utilization
                  </span>
                  <Calendar className="w-5 h-5 text-lime-400" />
                </div>
                <p className="text-3xl font-black text-white mt-2">
                  {classes.reduce((acc, c) => acc + c.bookedCount, 0)} /{' '}
                  {classes.reduce((acc, c) => acc + c.capacity, 0)}
                </p>
                <p className="text-xs text-lime-400 mt-1">Synced with Mobile Bookings</p>
              </div>
            </div>

            {/* Middle Row: Real-Time Check-in Feed + Class & Capacity Management */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Live Check-In Gate Feed */}
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-ping" />
                        Live Check-In Feed
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Scan the QR pass in the Mobile App to see live entries here
                      </p>
                    </div>
                    <button
                      onClick={handleSimulateCheckIn}
                      className="px-2.5 py-1.5 rounded-lg bg-lime-400/15 hover:bg-lime-400/25 text-lime-400 text-xs font-bold border border-lime-400/30 transition"
                    >
                      + Test Scan
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {checkInFeed.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl bg-zinc-950 border border-zinc-800/90 p-3 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{item.member}</p>
                          <p className="text-[11px] text-zinc-400">
                            {item.tier} • {item.method}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-lime-400">{item.time}</span>
                          <p className="text-[10px] text-zinc-500">{item.gate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                  <span>Manual Occupancy Override:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOccupancy((o) => Math.max(0, o - 1))}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => setOccupancy((o) => Math.min(maxOccupancy, o + 1))}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold"
                    >
                      +1
                    </button>
                  </div>
                </div>
              </div>

              {/* Class & Capacity Management + Roster Inspector */}
              <div className="lg:col-span-2 rounded-2xl bg-zinc-900 border border-zinc-800 p-5 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Class & Capacity Management (Live Sync)
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Create new classes or inspect live rosters & waitlists updated from the Member App
                    </p>
                  </div>
                </div>

                {/* Admin Create Class Form */}
                <form
                  onSubmit={handleAdminCreateClass}
                  className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800"
                >
                  <input
                    type="text"
                    placeholder="New Class Title..."
                    value={newClassTitle}
                    onChange={(e) => setNewClassTitle(e.target.value)}
                    className="sm:col-span-2 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400"
                  />
                  <select
                    value={newClassCategory}
                    onChange={(e) => setNewClassCategory(e.target.value)}
                    className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-2 text-xs text-white focus:outline-none focus:border-lime-400"
                  >
                    <option value="HIIT">HIIT</option>
                    <option value="Strength">Strength</option>
                    <option value="Yoga">Yoga</option>
                    <option value="Zumba">Zumba</option>
                    <option value="Personal Training">Personal Training</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Time (e.g. 06:00 PM)"
                    value={newClassTime}
                    onChange={(e) => setNewClassTime(e.target.value)}
                    className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-2 text-xs text-white focus:outline-none focus:border-lime-400"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-lime-400 hover:bg-lime-300 text-zinc-950 font-bold text-xs py-2 px-3 transition flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Publish Slot
                  </button>
                </form>

                {/* Class Table & Selected Roster Split */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2 max-h-72 overflow-y-auto pr-1">
                    {classes.map((cls) => {
                      const isSelected = cls.id === activeRosterClass?.id;
                      const isFull = cls.bookedCount >= cls.capacity;
                      return (
                        <div
                          key={cls.id}
                          onClick={() => setSelectedRosterClassId(cls.id)}
                          className={`cursor-pointer rounded-xl p-3 border transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-zinc-800/90 border-lime-400'
                              : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{cls.title}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-lime-400">
                                {cls.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                              {cls.time} • Coach {cls.trainer} • {cls.room}
                            </p>
                          </div>

                          <div className="text-right">
                            <span
                              className={`text-xs font-bold ${
                                isFull ? 'text-orange-400' : 'text-emerald-400'
                              }`}
                            >
                              {cls.bookedCount}/{cls.capacity} Booked
                            </span>
                            {cls.waitlistCount > 0 && (
                              <p className="text-[10px] text-orange-400">
                                +{cls.waitlistCount} on waitlist
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Active Class Roster Box */}
                  {activeRosterClass && (
                    <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3.5 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-lime-400">
                          Live Class Roster
                        </span>
                        <h4 className="text-sm font-bold text-white mt-0.5">
                          {activeRosterClass.title}
                        </h4>
                        <p className="text-[11px] text-zinc-400 mb-3">
                          {activeRosterClass.bookedCount} of {activeRosterClass.capacity} confirmed
                        </p>

                        <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                          {activeRosterClass.roster.map((person, idx) => (
                            <li
                              key={idx}
                              className={`text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                                person.includes('You')
                                  ? 'bg-lime-400/15 text-lime-300 border border-lime-400/30 font-bold'
                                  : 'bg-zinc-900 text-zinc-300'
                              }`}
                            >
                              <span>{person}</span>
                              <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" />
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={() => handleToggleClassBooking(activeRosterClass.id)}
                        className="mt-3 w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-lime-400 transition"
                      >
                        {activeRosterClass.isBookedByMe
                          ? 'Remove "Rohan Sharma (You)"'
                          : '+ Add "Rohan Sharma (You)"'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Row: Member Management & Billing Overview */}
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Member Subscriptions & Billing Directory
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Real-time view of active plans, MRR contribution, and billing health
                  </p>
                </div>
                <button
                  onClick={() =>
                    setCheckoutModalPlan({ name: 'Annual Pro', price: '₹1,250' })
                  }
                  className="px-3.5 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-bold text-xs transition self-start"
                >
                  + Register New Member
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400">
                      <th className="py-3 px-3">Member</th>
                      <th className="py-3 px-3">ID</th>
                      <th className="py-3 px-3">Subscription Tier</th>
                      <th className="py-3 px-3">Billing Status</th>
                      <th className="py-3 px-3">MRR</th>
                      <th className="py-3 px-3">Last Gate Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/70 text-xs">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-800/40">
                        <td className="py-3 px-3 font-bold text-white flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[11px] text-lime-400">
                            {m.avatar}
                          </span>
                          {m.name}
                        </td>
                        <td className="py-3 px-3 font-mono text-zinc-400">{m.id}</td>
                        <td className="py-3 px-3 text-zinc-200">{m.plan}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.status === 'Active'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/15 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-lime-400">{m.mrr}</td>
                        <td className="py-3 px-3 text-zinc-400">{m.lastCheckIn}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-lime-400 selection:text-zinc-950 ${settings.lite ? 'lite' : ''}`}>
      <style>{GLOBAL_FIXES}</style>
      {/* PROMINENT TOP DUAL-VIEW SWITCHER BAR */}
      {!isBare && (
      <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo & Live Sync Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-lime-400 flex items-center justify-center text-zinc-950 font-black text-base shadow-md shadow-lime-400/20">
              <Dumbbell className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-tight text-white text-base">APEX GYM</span>
                <span className="px-2 py-0.5 rounded-md bg-lime-400/15 text-lime-400 text-[10px] font-bold uppercase tracking-wider border border-lime-400/30">
                  Interactive Prototype
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Shared State Architecture: Mobile App Bookings & QR Check-ins sync live with Admin
              </p>
            </div>
          </div>

          {/* Prominent View Switcher Buttons */}
          <div className="flex items-center gap-1.5 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
            <button
              onClick={() => setPlatformMode('mobile')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                platformMode === 'mobile'
                  ? 'bg-lime-400 text-zinc-950 shadow-md shadow-lime-400/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Member Mobile App</span>
            </button>

            <button
              onClick={() => setPlatformMode('web')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                platformMode === 'web'
                  ? 'bg-lime-400 text-zinc-950 shadow-md shadow-lime-400/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Website & Admin Portal</span>
            </button>

            <button
              onClick={() => setPlatformMode('split')}
              className={`hidden xl:flex px-3.5 py-2 rounded-xl text-xs font-bold transition items-center gap-2 ${
                platformMode === 'split'
                  ? 'bg-lime-400 text-zinc-950 shadow-md shadow-lime-400/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Compare Mobile App and Admin Portal side-by-side"
            >
              <Sparkles className="w-4 h-4" />
              <span>Side-by-Side Live Sync</span>
            </button>
          </div>
        </div>
      </header>
      )}

      {/* FLOATING TOAST FEEDBACK */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-zinc-900 border border-lime-400/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-lime-400 shrink-0" />
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* MAIN VIEWPORT RENDERING */}
      <main className={isBare ? '' : 'pb-16'}>
        {(isBare || platformMode === 'mobile') && renderMobileSimulator()}
        {!isBare && platformMode === 'web' && renderWebsiteAndAdmin()}
        {!isBare && platformMode === 'split' && (
          <div className="max-w-[1600px] mx-auto px-4 pt-4 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className="xl:col-span-4 xl:sticky xl:top-20">
              {renderMobileSimulator()}
            </div>
            <div className="xl:col-span-8">
              {renderWebsiteAndAdmin()}
            </div>
          </div>
        )}
      </main>

      {/* INSTANT CHECKOUT MODAL FOR PUBLIC WEBSITE */}
      {checkoutModalPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-lime-400/15 text-lime-400">
                Instant Web Enrollment
              </span>
              <button
                onClick={() => setCheckoutModalPlan(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-xl font-black text-white">{checkoutModalPlan.name}</h3>
              <p className="text-xs text-zinc-400 mt-1">
                {checkoutModalPlan.price} / month • Instant digital QR pass activation
              </p>
            </div>

            <form onSubmit={handleCompleteWebsiteJoin} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Member Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aditi Verma"
                  value={checkoutName}
                  onChange={(e) => setCheckoutName(e.target.value)}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-lime-400"
                />
              </div>

              <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-xs text-zinc-400 flex items-center justify-between">
                <span>Simulated UPI (GPay / PhonePe / Paytm)</span>
                <span className="text-lime-400 font-mono">upi@okhdfc</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black text-xs uppercase tracking-wider transition"
              >
                Complete Enrollment & Sync to Admin
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}