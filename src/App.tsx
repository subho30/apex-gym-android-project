import React, { useState, useEffect, useCallback } from 'react';
import { Smartphone, Monitor, Sparkles, CheckCircle2, Dumbbell } from 'lucide-react';
import {
  MemberProfile,
  GymClass,
  WorkoutEntry,
  CheckInFeedItem,
  UserSession,
  AppSettings,
  LeadItem,
  InvoiceItem
} from './types';
import {
  INITIAL_MEMBERS,
  TRAINERS,
  CLUB
} from './constants/initialData';
import { StorageService } from './services/storage';
import { restoreSession, signOut } from './services/auth';
import {
  getMyProfile,
  getAllMembers,
  updateMyProfile,
  toggleMemberStatus
} from './services/members';
import {
  getClasses,
  bookClass,
  cancelBooking,
  createClass,
  subscribeToClasses
} from './services/classes';
import { getWorkouts, addWorkout } from './services/workouts';
import { getInvoices } from './services/invoices';
import {
  getCheckInFeed,
  recordManualCheckIn,
  subscribeToCheckIns
} from './services/checkins';
import {
  getOccupancy,
  incrementOccupancy,
  subscribeToOccupancy
} from './services/occupancy';
import { getLeads } from './services/leads';
import { useNativeMobile } from './hooks/useNativeMobile';
import { LoginPanel } from './features/auth/LoginPanel';
import { StaffScanner } from './features/admin/StaffScanner';
import { AdminPortal } from './features/admin/AdminPortal';
import { MemberApp } from './features/member/MemberApp';

const detectIsBare = () => {
  if (typeof window === 'undefined') return false;
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-ignore
    window.navigator.standalone === true;
  const isCapacitor = Boolean(
    // @ts-ignore
    window.Capacitor?.isNativePlatform && window.Capacitor.isNativePlatform()
  );
  const isAppUrl = window.location.search.includes('app');
  return isStandalone || isCapacitor || isAppUrl;
};

export default function App() {
  const [isBare, setIsBare] = useState(detectIsBare);
  const [isLoaded, setIsLoaded] = useState(false);

  // Platform view mode for desktop browser preview
  const [platformMode, setPlatformMode] = useState<'mobile' | 'web' | 'split'>('mobile');

  // Core Application State
  const [session, setSession] = useState<UserSession | null>(null);
  const [memberProfile, setMemberProfile] = useState<MemberProfile>(INITIAL_MEMBERS[0]);
  const [members, setMembers] = useState<MemberProfile[]>(INITIAL_MEMBERS);
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [feed, setFeed] = useState<CheckInFeedItem[]>([]);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [occupancy, setOccupancy] = useState(64);
  const [maxOccupancy, setMaxOccupancy] = useState(120);

  const [settings, setSettings] = useState<AppSettings>({
    whatsapp: true,
    push: true,
    classReminders: true,
    faceEntry: false,
    language: 'English',
    lite: false
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Initial Data Loading & Realtime Subscriptions
  useEffect(() => {
    async function loadInitialData() {
      // Restore auth session
      const restored = await restoreSession();
      if (restored) {
        setSession({
          role: restored.role,
          name: restored.name,
          memberId: restored.memberId,
          mobile: restored.phone
        });
      }

      // Fetch domain data from services (Supabase or local fallback)
      const [
        profileRes,
        membersRes,
        classesRes,
        workoutsRes,
        feedRes,
        leadsRes,
        occupancyRes,
        settingsRes,
        invoicesRes
      ] = await Promise.all([
        getMyProfile(),
        getAllMembers(),
        getClasses(),
        getWorkouts(),
        getCheckInFeed(),
        getLeads(),
        getOccupancy(),
        StorageService.get<AppSettings>('apex_settings', settings),
        getInvoices()
      ]);

      if (profileRes) setMemberProfile(profileRes);
      if (membersRes.length > 0) setMembers(membersRes);
      setClasses(classesRes);
      setWorkouts(workoutsRes);
      setFeed(feedRes);
      setLeads(leadsRes);
      setOccupancy(occupancyRes.current);
      setMaxOccupancy(occupancyRes.max);
      setSettings(settingsRes);
      setInvoices(invoicesRes);
      setIsLoaded(true);
    }

    loadInitialData();

    // Setup Realtime subscriptions
    const unsubOccupancy = subscribeToOccupancy((curr, max) => {
      setOccupancy(curr);
      setMaxOccupancy(max);
    });

    const unsubCheckIns = subscribeToCheckIns((newEntry) => {
      setFeed((prev) => [newEntry, ...prev.slice(0, 7)]);
    });

    const unsubClasses = subscribeToClasses(async () => {
      const refreshed = await getClasses();
      setClasses(refreshed);
    });

    return () => {
      if (unsubOccupancy) unsubOccupancy();
      if (unsubCheckIns) unsubCheckIns();
      if (unsubClasses) unsubClasses();
    };
  }, []);

  // 2. Hardware Back Button on Android
  const handleBackPress = useCallback(() => {
    return false;
  }, []);

  useNativeMobile({ onBackPress: handleBackPress });

  // 3. User Actions
  const handleLogin = async (newSession: UserSession) => {
    setSession(newSession);
    showToast(`Signed in as ${newSession.name} (${newSession.role})`);

    // Refresh profile for the authenticated user
    const profile = await getMyProfile();
    if (profile) setMemberProfile(profile);

    const refreshedClasses = await getClasses();
    setClasses(refreshedClasses);

    const refreshedWorkouts = await getWorkouts();
    setWorkouts(refreshedWorkouts);

    const refreshedInvoices = await getInvoices();
    setInvoices(refreshedInvoices);
  };

  const handleLogout = async () => {
    await signOut();
    setSession(null);
    showToast('Signed out successfully');
  };

  const handleCheckInSimulate = async (method = 'Dynamic QR Token') => {
    await incrementOccupancy();
    const entry = await recordManualCheckIn(
      `${memberProfile.name} (You)`,
      memberProfile.tier,
      method,
      'Turnstile Bay A'
    );
    if (entry) {
      setFeed((prev) => [entry, ...prev.slice(0, 7)]);
    }

    const nextStreak = memberProfile.streakDays + 1;
    await updateMyProfile({ streakDays: nextStreak, isCheckedIn: true });
    setMemberProfile((prev) => ({
      ...prev,
      streakDays: nextStreak,
      isCheckedIn: true
    }));
    setOccupancy((prev) => Math.min(maxOccupancy, prev + 1));
    showToast('Gate pass verified! Live occupancy updated.');
  };

  const handleStaffCheckIn = async (m: MemberProfile, method = 'Staff Scanner') => {
    await incrementOccupancy();
    const entry = await recordManualCheckIn(
      m.name,
      m.tier,
      method,
      'Front Desk Scanner'
    );
    if (entry) {
      setFeed((prev) => [entry, ...prev.slice(0, 7)]);
    }
    setOccupancy((prev) => Math.min(maxOccupancy, prev + 1));
    showToast(`Checked in ${m.name}`);
  };

  const handleToggleClassBooking = async (classId: string) => {
    const target = classes.find((c) => c.id === classId);
    if (!target) return;

    if (target.isBookedByMe) {
      const res = await cancelBooking(classId);
      if (res.success) {
        showToast(`Canceled spot in ${target.title}`);
        setClasses((prev) =>
          prev.map((c) =>
            c.id === classId
              ? {
                  ...c,
                  isBookedByMe: false,
                  bookedCount: Math.max(0, c.bookedCount - 1),
                  roster: c.roster.filter((r) => !r.includes('You'))
                }
              : c
          )
        );
      } else {
        showToast(res.error || 'Failed to cancel booking');
      }
    } else {
      const res = await bookClass(classId);
      if (res.success) {
        if (res.waitlist) {
          showToast(`Added to priority waitlist for ${target.title}`);
        } else {
          showToast(`Spot confirmed for ${target.title}!`);
        }
        setClasses((prev) =>
          prev.map((c) =>
            c.id === classId
              ? {
                  ...c,
                  isBookedByMe: true,
                  bookedCount: res.waitlist ? c.bookedCount : c.bookedCount + 1,
                  waitlistCount: res.waitlist ? c.waitlistCount + 1 : c.waitlistCount,
                  roster: [`${memberProfile.name} (You)`, ...c.roster]
                }
              : c
          )
        );
      } else {
        showToast(res.error || 'Failed to book spot');
      }
    }
  };

  const handleAddWorkout = async (entry: Omit<WorkoutEntry, 'id' | 'date'>) => {
    const res = await addWorkout(entry);
    if (res.success && res.workout) {
      setWorkouts((prev) => [res.workout!, ...prev]);
      showToast(`Logged ${entry.exercise} (${entry.weight})`);
    } else {
      showToast(res.error || 'Failed to save workout');
    }
  };

  const handleUpdateProfile = async (updates: Partial<MemberProfile>) => {
    const res = await updateMyProfile(updates);
    if (res) {
      setMemberProfile(res);
      showToast('Profile updated');
    }
  };

  const handlePaymentSuccess = async () => {
    const [profile, refreshedInvoices] = await Promise.all([
      getMyProfile(),
      getInvoices()
    ]);
    if (profile) setMemberProfile(profile);
    setInvoices(refreshedInvoices);
  };

  const handleUpdateSettings = (updates: Partial<AppSettings>) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    StorageService.set('apex_settings', next);
  };

  const handleCreateClass = async (
    newCls: Omit<GymClass, 'id' | 'bookedCount' | 'isBookedByMe' | 'waitlistCount' | 'roster'>
  ) => {
    const res = await createClass(newCls);
    if (res.success && res.newClass) {
      setClasses((prev) => [res.newClass!, ...prev]);
      showToast(`Class "${newCls.title}" published!`);
    } else {
      showToast(res.error || 'Failed to publish class');
    }
  };

  const handleToggleMemberStatus = async (memberId: string) => {
    const success = await toggleMemberStatus(memberId);
    if (success) {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? { ...m, status: m.status === 'Active' ? 'Payment Due' : 'Active' }
            : m
        )
      );
      showToast('Member status updated');
    }
  };

  const handleMemberEnrolled = (newMember: MemberProfile) => {
    setMembers((prev) => [newMember, ...prev]);
    showToast(`Enrolled ${newMember.name} (${newMember.memberId})!`);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="w-8 h-8 rounded-full border-2 border-lime-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  // View router for phone / standalone / bare mode
  const renderPhoneView = () => {
    if (!session) {
      return (
        <div className="max-w-[420px] mx-auto py-10">
          <LoginPanel onLogin={handleLogin} />
        </div>
      );
    }

    if (session.role === 'staff') {
      return (
        <div className="max-w-[420px] mx-auto">
          <StaffScanner
            name={session.name}
            members={members}
            feed={feed}
            occupancy={occupancy}
            maxOccupancy={maxOccupancy}
            onCheckIn={handleStaffCheckIn}
            onLogout={handleLogout}
            wide={false}
          />
        </div>
      );
    }

    if (session.role === 'manager') {
      return (
        <div className="max-w-[420px] mx-auto p-6 space-y-4 text-center">
          <h3 className="text-base font-bold text-white">Manager Portal</h3>
          <p className="text-xs text-zinc-400">
            Manager analytics and class rosters are best viewed on the web operations dashboard.
          </p>
          <button
            onClick={() => setPlatformMode('web')}
            className="w-full py-3 rounded-xl bg-lime-400 text-zinc-950 font-bold text-xs"
          >
            Open Web Operations
          </button>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 rounded-xl border border-zinc-700 text-xs text-zinc-300"
          >
            Log Out
          </button>
        </div>
      );
    }

    return (
      <MemberApp
        member={memberProfile}
        classes={classes}
        workouts={workouts}
        invoices={invoices}
        trainers={TRAINERS}
        club={CLUB}
        occupancy={occupancy}
        maxOccupancy={maxOccupancy}
        settings={settings}
        isBare={isBare}
        onCheckInSimulate={() => handleCheckInSimulate('Dynamic QR Token')}
        onToggleClassBooking={handleToggleClassBooking}
        onAddWorkout={handleAddWorkout}
        onUpdateProfile={handleUpdateProfile}
        onUpdateSettings={handleUpdateSettings}
        onPaymentSuccess={handlePaymentSuccess}
        onLogout={handleLogout}
      />
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-lime-400 selection:text-zinc-950">
      {/* Top Header Switcher for Desktop Browser Preview */}
      {!isBare && (
        <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-lime-400 flex items-center justify-center text-zinc-950 font-black shadow-md shadow-lime-400/20">
                <Dumbbell className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-black text-white text-sm">APEX GYM</span>
                <span className="ml-2 px-2 py-0.5 rounded-md bg-lime-400/15 text-lime-400 text-[10px] font-bold uppercase">
                  Connected Backend
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
              <button
                onClick={() => setPlatformMode('mobile')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  platformMode === 'mobile'
                    ? 'bg-lime-400 text-zinc-950'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Member Mobile App</span>
              </button>

              <button
                onClick={() => setPlatformMode('web')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  platformMode === 'web'
                    ? 'bg-lime-400 text-zinc-950'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Operations Suite</span>
              </button>

              <button
                onClick={() => setPlatformMode('split')}
                className={`hidden xl:flex px-3 py-1.5 rounded-xl text-xs font-bold transition items-center gap-1.5 ${
                  platformMode === 'split'
                    ? 'bg-lime-400 text-zinc-950'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Side-by-Side</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-zinc-900 border border-lime-400/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-lime-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className={isBare ? '' : 'py-6 px-4'}>
        {(isBare || platformMode === 'mobile') && renderPhoneView()}

        {!isBare && platformMode === 'web' && (
          <AdminPortal
            members={members}
            classes={classes}
            leads={leads}
            feed={feed}
            occupancy={occupancy}
            maxOccupancy={maxOccupancy}
            onCreateClass={handleCreateClass}
            onToggleMemberStatus={handleToggleMemberStatus}
            onMemberEnrolled={handleMemberEnrolled}
            onLogout={handleLogout}
          />
        )}

        {!isBare && platformMode === 'split' && (
          <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-4 xl:sticky xl:top-20">
              {renderPhoneView()}
            </div>
            <div className="xl:col-span-8">
              <AdminPortal
                members={members}
                classes={classes}
                leads={leads}
                feed={feed}
                occupancy={occupancy}
                maxOccupancy={maxOccupancy}
                onCreateClass={handleCreateClass}
                onToggleMemberStatus={handleToggleMemberStatus}
                onMemberEnrolled={handleMemberEnrolled}
                onLogout={handleLogout}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
