import React, { useState } from 'react';
import {
  Dumbbell,
  Calendar,
  CreditCard,
  User,
  Flame,
  TrendingUp,
  Clock,
  Plus,
  Award,
  Activity,
  CheckCircle2,
  ChevronRight,
  Filter,
  RefreshCw,
  LogOut,
  Phone,
  Mail,
  MessageCircle,
  Pencil,
  ArrowLeft,
  X,
  Bell,
  Sparkles,
  Zap,
  MapPin,
  ShieldCheck,
  Download,
  FileText
} from 'lucide-react';
import { downloadInvoicePdf } from '../../utils/generateInvoicePdf';
import { launchRazorpayPayment } from '../../services/payments';
import {
  MemberProfile,
  GymClass,
  WorkoutEntry,
  InvoiceItem,
  TrainerItem,
  ClubInfo,
  AppSettings
} from '../../types';
import { QrPass } from '../../components/QrPass';
import { useNativeMobile } from '../../hooks/useNativeMobile';

interface MemberAppProps {
  member: MemberProfile;
  classes: GymClass[];
  workouts: WorkoutEntry[];
  invoices: InvoiceItem[];
  trainers: TrainerItem[];
  club: ClubInfo;
  occupancy: number;
  maxOccupancy: number;
  settings: AppSettings;
  isBare?: boolean;
  wide?: boolean;
  onCheckInSimulate: () => void;
  onToggleClassBooking: (classId: string) => void;
  onAddWorkout: (workout: Omit<WorkoutEntry, 'id' | 'date'>) => void;
  onUpdateProfile: (updates: Partial<MemberProfile>) => void;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onPaymentSuccess?: () => void;
  onLogout: () => void;
}

export function MemberApp({
  member,
  classes,
  workouts,
  invoices,
  trainers,
  club,
  occupancy,
  maxOccupancy,
  settings,
  isBare,
  wide,
  onCheckInSimulate,
  onToggleClassBooking,
  onAddWorkout,
  onUpdateProfile,
  onUpdateSettings,
  onPaymentSuccess,
  onLogout
}: MemberAppProps) {
  const { triggerHaptic } = useNativeMobile();
  const [activeTab, setActiveTab] = useState<'home' | 'classes' | 'workouts' | 'billing' | 'more'>('home');
  const [classFilter, setClassFilter] = useState('All');
  const [scanAnimation, setScanAnimation] = useState(false);

  // New Workout Form state
  const [exercise, setExercise] = useState('');
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState('4');
  const [reps, setReps] = useState('8');
  const [isPR, setIsPR] = useState(false);

  // More screen navigation
  const [moreSubView, setMoreSubView] = useState<'menu' | 'profile' | 'settings' | 'support'>('menu');
  const [editName, setEditName] = useState(member.name);
  const [editGoal, setEditGoal] = useState(member.goal);

  const handleSimulateGateScan = () => {
    triggerHaptic('success');
    setScanAnimation(true);
    setTimeout(() => {
      setScanAnimation(false);
      onCheckInSimulate();
    }, 900);
  };

  const handleCreateWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exercise.trim() || !weight.trim()) return;
    triggerHaptic('success');
    onAddWorkout({
      exercise: exercise.trim(),
      weight: weight.includes('kg') || weight.includes('lbs') ? weight : `${weight} kg`,
      sets: Number(sets) || 3,
      reps: Number(reps) || 8,
      isPR
    });
    setExercise('');
    setWeight('');
    setIsPR(false);
  };

  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);

  const handleRenewMembership = async () => {
    setPaymentProcessing(true);
    triggerHaptic('light');
    try {
      await launchRazorpayPayment({
        amount: 28500,
        planName: `${member.tier} Membership Renewal`,
        memberId: member.memberId,
        memberName: member.name,
        memberEmail: member.email,
        memberPhone: member.mobile,
        onSuccess: (paymentId) => {
          triggerHaptic('success');
          setPaymentNotice(`Payment Successful! Razorpay Ref: ${paymentId}`);
          if (onPaymentSuccess) onPaymentSuccess();
          setTimeout(() => setPaymentNotice(null), 10000);
        },
        onFailure: (err) => {
          triggerHaptic('error');
          setPaymentNotice(`Payment Status: ${err}`);
          setTimeout(() => setPaymentNotice(null), 6000);
        }
      });
    } catch (err: any) {
      console.error('Razorpay launch error:', err);
      setPaymentNotice('Unable to launch checkout. Please check connection.');
      setTimeout(() => setPaymentNotice(null), 5000);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const myBookedClasses = classes.filter((c) => c.isBookedByMe);
  const occupancyPercent = Math.min(100, Math.round((occupancy / maxOccupancy) * 100));

  const filteredClasses =
    classFilter === 'All' ? classes : classes.filter((c) => c.category === classFilter);

  return (
    <div
      className={`relative w-full flex flex-col justify-between bg-zinc-950 text-white overflow-hidden ${
        isBare ? '' : 'max-w-[420px] rounded-[44px] border-[10px] border-zinc-800 shadow-2xl ring-1 ring-white/10'
      }`}
      style={{
        width: '100%',
        maxWidth: wide ? 800 : 420,
        margin: '0 auto',
        height: isBare ? '100dvh' : 'clamp(620px, calc(100vh - 120px), 860px)'
      }}
    >
      {/* Top Header Bar */}
      <header
        className="shrink-0 px-5 pt-3 pb-3 border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md flex items-center justify-between"
        style={isBare ? { paddingTop: 'calc(env(safe-area-inset-top) + 10px)' } : undefined}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-lime-400 text-zinc-950 font-black flex items-center justify-center text-sm shadow-md shadow-lime-400/20">
            AX
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white leading-none">APEX GYM</h1>
            <p className="text-[10px] text-zinc-400 mt-0.5">Park Street Flagship</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('more')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-semibold text-zinc-300 hover:border-lime-400/40 transition"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
            <span>{member.streakDays}d Streak</span>
          </button>
        </div>
      </header>

      {/* Main Tab Content Viewport */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* Live QR Access Pass Card */}
            <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800/90 p-4 shadow-xl">
              <QrPass
                memberId={member.memberId}
                name={member.name}
                scanAnimation={scanAnimation}
              />
              <button
                onClick={handleSimulateGateScan}
                className="w-full mt-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 py-2.5 text-xs font-bold text-lime-400 transition flex items-center justify-center gap-2"
              >
                <Zap className="w-3.5 h-3.5" /> Tap to Simulate Turnstile Scan
              </button>
            </div>

            {/* Club Occupancy Bar */}
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3.5">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-zinc-400 font-medium">Club Floor Live Traffic</span>
                <span className="font-bold text-lime-400">
                  {occupancy} / {maxOccupancy} inside ({occupancyPercent}%)
                </span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    occupancyPercent > 80 ? 'bg-amber-400' : 'bg-lime-400'
                  }`}
                  style={{ width: `${occupancyPercent}%` }}
                />
              </div>
            </div>

            {/* Today's Schedule Card */}
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-lime-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Your Booked Classes
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('classes')}
                  className="text-[11px] text-lime-400 hover:underline font-semibold"
                >
                  Browse all
                </button>
              </div>

              {myBookedClasses.length > 0 ? (
                <div className="space-y-2">
                  {myBookedClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{cls.title}</p>
                        <p className="text-[11px] text-zinc-400">
                          {cls.time} • {cls.room} • Coach {cls.trainer}
                        </p>
                      </div>
                      <button
                        onClick={() => onToggleClassBooking(cls.id)}
                        className="text-[10px] font-bold text-zinc-400 hover:text-red-400 px-2.5 py-1 rounded-lg border border-zinc-800 hover:border-red-500/50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500">No classes booked for today. Reserve a spot!</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CLASSES */}
        {activeTab === 'classes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Daily Schedule</h2>
                <p className="text-xs text-zinc-400">Book coach-led HIIT, strength & yoga bays</p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {['All', 'HIIT', 'Strength', 'Yoga', 'Personal Training'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setClassFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition ${
                    classFilter === cat
                      ? 'bg-lime-400 text-zinc-950 border-lime-400'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Class Cards */}
            <div className="space-y-3">
              {filteredClasses.map((cls) => {
                const isFull = cls.bookedCount >= cls.capacity;
                return (
                  <div
                    key={cls.id}
                    className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded">
                          {cls.category}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1.5">{cls.title}</h4>
                        <p className="text-xs text-zinc-400">
                          {cls.time} ({cls.duration}) • {cls.room}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">Trainer: {cls.trainer}</p>
                      </div>
                      <span className="text-xs font-semibold text-zinc-400">
                        {cls.bookedCount}/{cls.capacity} spots
                      </span>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-400">
                        Intensity: <strong className="text-white">{cls.intensity}</strong>
                      </span>
                      <button
                        onClick={() => onToggleClassBooking(cls.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                          cls.isBookedByMe
                            ? 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-red-400 hover:text-red-400'
                            : isFull
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 hover:bg-amber-400/30'
                            : 'bg-lime-400 text-zinc-950 hover:bg-lime-300'
                        }`}
                      >
                        {cls.isBookedByMe ? 'Booked (Cancel)' : isFull ? 'Join Waitlist' : 'Book Spot'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: WORKOUTS */}
        {activeTab === 'workouts' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">Log Today's Lifts & PRs</h2>

            {/* Quick Log Form */}
            <form
              onSubmit={handleCreateWorkout}
              className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3"
            >
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  placeholder="Exercise (e.g. Deadlift)"
                  value={exercise}
                  onChange={(e) => setExercise(e.target.value)}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-lime-400"
                />
                <input
                  required
                  placeholder="Weight (e.g. 140 kg)"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-lime-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  placeholder="Sets"
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-lime-400"
                />
                <input
                  type="number"
                  placeholder="Reps"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-lime-400"
                />
                <button
                  type="button"
                  onClick={() => setIsPR(!isPR)}
                  className={`rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition ${
                    isPR
                      ? 'bg-amber-400 text-zinc-950 border-amber-400'
                      : 'border-zinc-800 text-zinc-400'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" /> PR Set
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-lime-400 text-zinc-950 font-bold text-xs uppercase tracking-wider hover:bg-lime-300 transition"
              >
                Save Workout Log
              </button>
            </form>

            {/* History List */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Recent Training Entries
              </h3>
              {workouts.map((w) => (
                <div
                  key={w.id}
                  className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{w.exercise}</span>
                      {w.isPR && (
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-1.5 py-0.5 rounded">
                          PR
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {w.sets} sets × {w.reps} reps • {w.weight}
                    </p>
                  </div>
                  <span className="text-[11px] text-zinc-500">{w.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: BILLING */}
        {activeTab === 'billing' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">Membership & Invoices</h2>

            {/* Payment Notice Banner */}
            {paymentNotice && (
              <div className="p-3.5 rounded-2xl bg-lime-500/10 border border-lime-500/30 text-lime-300 text-xs font-semibold flex items-center gap-2.5 shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-lime-400 flex-shrink-0" />
                <span className="flex-1">{paymentNotice}</span>
              </div>
            )}

            {/* Digital Membership Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-zinc-700/80 shadow-2xl relative overflow-hidden space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-lime-400 tracking-wider uppercase">
                  {member.tier}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-lime-400/20 text-lime-300 text-[10px] font-bold">
                  {member.status}
                </span>
              </div>
              <div>
                <p className="text-lg font-black text-white">{member.name}</p>
                <p className="text-xs font-mono text-zinc-400">ID: {member.memberId}</p>
              </div>
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                <span>Next Renewal: {member.nextRenewal}</span>
                <span>Visa •••• {member.cardLast4}</span>
              </div>

              {/* Razorpay Renewal Trigger */}
              <button
                onClick={handleRenewMembership}
                disabled={paymentProcessing}
                className="w-full mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-lime-400 to-emerald-400 hover:from-lime-300 hover:to-emerald-300 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-lime-950/40 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                {paymentProcessing ? 'Launching Razorpay Gateway...' : 'Renew Membership • Razorpay Test'}
              </button>
            </div>

            {/* Invoices */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Payment History & Tax Invoices
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono">GST Compliant</span>
              </div>

              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs hover:border-zinc-700 transition"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-white">{inv.desc}</p>
                    <p className="text-zinc-500 text-[11px]">
                      {inv.id} • {inv.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-bold text-lime-400 block">{inv.amount}</span>
                      <span className="text-[10px] text-zinc-400">{inv.status}</span>
                    </div>
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        downloadInvoicePdf(inv, member);
                      }}
                      title="Download GST Tax Invoice (PDF)"
                      className="p-2 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700/60 transition flex items-center gap-1.5 text-[11px] font-semibold active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5 text-lime-400" />
                      <span className="hidden sm:inline">Tax Invoice</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: MORE */}
        {activeTab === 'more' && (
          <div className="space-y-4">
            {moreSubView === 'menu' && (
              <div className="space-y-2">
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-lime-400 text-zinc-950 font-black text-lg flex items-center justify-center">
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{member.name}</h3>
                    <p className="text-xs text-zinc-400">{member.tier} · {member.memberId}</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 divide-y divide-zinc-800 overflow-hidden">
                  <button
                    onClick={() => setMoreSubView('profile')}
                    className="w-full px-4 py-3 text-xs font-semibold text-zinc-200 flex items-center justify-between hover:bg-zinc-800/50"
                  >
                    <span>Member Profile & Goals</span>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </button>
                  <button
                    onClick={() => setMoreSubView('settings')}
                    className="w-full px-4 py-3 text-xs font-semibold text-zinc-200 flex items-center justify-between hover:bg-zinc-800/50"
                  >
                    <span>App Preferences & Notifications</span>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </button>
                  <button
                    onClick={() => setMoreSubView('support')}
                    className="w-full px-4 py-3 text-xs font-semibold text-zinc-200 flex items-center justify-between hover:bg-zinc-800/50"
                  >
                    <span>Club Helpdesk & Emergency Contact</span>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </button>
                </div>

                <button
                  onClick={onLogout}
                  className="w-full py-3 rounded-xl border border-zinc-800 text-red-400 hover:bg-red-500/10 text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Log out of Member Account
                </button>
              </div>
            )}

            {/* Profile Subview */}
            {moreSubView === 'profile' && (
              <div className="space-y-4">
                <button
                  onClick={() => setMoreSubView('menu')}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <h3 className="text-sm font-bold text-white">Edit Profile Details</h3>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Full Name</label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Primary Fitness Goal</label>
                    <input
                      value={editGoal}
                      onChange={(e) => setEditGoal(e.target.value)}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <button
                    onClick={() => {
                      onUpdateProfile({ name: editName, goal: editGoal });
                      setMoreSubView('menu');
                    }}
                    className="w-full py-2.5 rounded-xl bg-lime-400 text-zinc-950 font-bold text-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Settings Subview */}
            {moreSubView === 'settings' && (
              <div className="space-y-4">
                <button
                  onClick={() => setMoreSubView('menu')}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <h3 className="text-sm font-bold text-white">Notification & Hardware Toggles</h3>
                  <div className="flex items-center justify-between text-xs">
                    <span>WhatsApp Booking Alerts</span>
                    <input
                      type="checkbox"
                      checked={settings.whatsapp}
                      onChange={(e) => onUpdateSettings({ whatsapp: e.target.checked })}
                      className="accent-lime-400"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Push Notifications</span>
                    <input
                      type="checkbox"
                      checked={settings.push}
                      onChange={(e) => onUpdateSettings({ push: e.target.checked })}
                      className="accent-lime-400"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Class 1-Hour Reminder</span>
                    <input
                      type="checkbox"
                      checked={settings.classReminders}
                      onChange={(e) => onUpdateSettings({ classReminders: e.target.checked })}
                      className="accent-lime-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Support Subview */}
            {moreSubView === 'support' && (
              <div className="space-y-4">
                <button
                  onClick={() => setMoreSubView('menu')}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 text-xs">
                  <h3 className="text-sm font-bold text-white">Front Desk & Concierge</h3>
                  <p className="text-zinc-400">{club.name}</p>
                  <p className="text-zinc-400">{club.address}</p>
                  <div className="space-y-1 pt-2 border-t border-zinc-800">
                    <p className="text-white font-semibold">Phone: {club.phone}</p>
                    <p className="text-white font-semibold">WhatsApp: {club.whatsapp}</p>
                    <p className="text-white font-semibold">Email: {club.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Sticky Tab Bar with Safe-Area Padding */}
      <nav
        className="shrink-0 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-900 px-3 py-2 flex items-center justify-around z-20"
        style={isBare ? { paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' } : undefined}
      >
        {[
          { id: 'home', label: 'Pass', icon: Zap },
          { id: 'classes', label: 'Classes', icon: Calendar },
          { id: 'workouts', label: 'Lifts', icon: Dumbbell },
          { id: 'billing', label: 'Billing', icon: CreditCard },
          { id: 'more', label: 'More', icon: User }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('light');
                setActiveTab(tab.id as any);
                setMoreSubView('menu');
              }}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
                isActive ? 'text-lime-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
