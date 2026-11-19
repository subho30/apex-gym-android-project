import React, { useState, useEffect, useCallback } from 'react';
import { Smartphone, Monitor, Sparkles, CheckCircle2, Dumbbell } from 'lucide-react';
import {
  MemberProfile,
  GymClass,
  WorkoutEntry,
  CheckInFeedItem,
  UserSession,
  AppSettings,
  LeadItem
} from './types';
import {
  INITIAL_CLASSES,
  INITIAL_MEMBERS,
  INITIAL_WORKOUT_LOGS,
  INITIAL_CHECKIN_FEED,
  INITIAL_LEADS,
  INVOICES,
  TRAINERS,
  CLUB
} from './constants/initialData';
import { StorageService } from './services/storage';
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
  const [classes, setClasses] = useState<GymClass[]>(INITIAL_CLASSES);
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>(INITIAL_WORKOUT_LOGS);
  const [feed, setFeed] = useState<CheckInFeedItem[]>(INITIAL_CHECKIN_FEED);
  const [leads, setLeads] = useState<LeadItem[]>(INITIAL_LEADS);
  const [occupancy, setOccupancy] = useState(64);
  const [maxOccupancy] = useState(120);

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

  // 1. Load persisted state on startup
  useEffect(() => {
    async function loadSavedData() {
      const savedSession = await StorageService.get<UserSession | null>('apex_session', {
        role: 'member',
        name: 'Rohan Sharma',
        memberId: 'APX-2041'
      });
      const savedMember = await StorageService.get<MemberProfile>('apex_member', INITIAL_MEMBERS[0]);
      const savedClasses = await StorageService.get<GymClass[]>('apex_classes', INITIAL_CLASSES);
      const savedWorkouts = await StorageService.get<WorkoutEntry[]>('apex_workouts', INITIAL_WORKOUT_LOGS);
      const savedFeed = await StorageService.get<CheckInFeedItem[]>('apex_feed', INITIAL_CHECKIN_FEED);
      const savedSettings = await StorageService.get<AppSettings>('apex_settings', settings);

      setSession(savedSession);
      setMemberProfile(savedMember);
      setClasses(savedClasses);
      setWorkouts(savedWorkouts);
      setFeed(savedFeed);
      setSettings(savedSettings);
      setIsLoaded(true);
    }
    loadSavedData();
  }, []);

  // 2. Hardware Back Button handler on Android
  const handleBackPress = useCallback(() => {
    // If on desktop preview or bare view, return false to let default Android back handle exit if on home
    return false;
  }, []);

  useNativeMobile({ onBackPress: handleBackPress });

  // 3. Handlers with Auto-Persistence
  const handleLogin = (newSession: UserSession) => {
    setSession(newSession);
    StorageService.set('apex_session', newSession);
    showToast(`Signed in as ${newSession.name} (${newSession.role})`);
  };

  const handleLogout = () => {
    setSession(null);
    StorageService.remove('apex_session');
    showToast('Signed out');
  };

  const handleCheckInSimulate = (method = 'Dynamic QR Token') => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newEntry: CheckInFeedItem = {
      id: `chk-${Date.now()}`,
      member: `${memberProfile.name} (You)`,
      tier: memberProfile.tier,
      time: nowStr,
      method,
      gate: 'Turnstile Bay A'
    };
    const nextFeed = [newEntry, ...feed.slice(0, 7)];
    setFeed(nextFeed);
    StorageService.set('apex_feed', nextFeed);

    setOccupancy((prev) => Math.min(maxOccupancy, prev + 1));
    const nextProfile = {
      ...memberProfile,
      streakDays: memberProfile.streakDays + 1,
      isCheckedIn: true
    };
    setMemberProfile(nextProfile);
    StorageService.set('apex_member', nextProfile);
    showToast('Gate pass verified! Live occupancy updated.');
  };

  const handleStaffCheckIn = (m: MemberProfile, method = 'Staff Scanner') => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newEntry: CheckInFeedItem = {
      id: `chk-${Date.now()}`,
      member: m.name,
      tier: m.tier,
      time: nowStr,
      method,
      gate: 'Front Desk Scanner'
    };
    const nextFeed = [newEntry, ...feed.slice(0, 7)];
    setFeed(nextFeed);
    StorageService.set('apex_feed', nextFeed);
    setOccupancy((prev) => Math.min(maxOccupancy, prev + 1));
    showToast(`Checked in ${m.name}`);
  };

  const handleToggleClassBooking = (classId: string) => {
    const updated = classes.map((cls) => {
      if (cls.id !== classId) return cls;
      if (cls.isBookedByMe) {
        showToast(`Canceled spot in ${cls.title}`);
        return {
          ...cls,
          isBookedByMe: false,
          bookedCount: Math.max(0, cls.bookedCount - 1),
          roster: cls.roster.filter((r) => !r.includes('You'))
        };
      } else {
        const isFull = cls.bookedCount >= cls.capacity;
        if (isFull) {
          showToast(`Added to priority waitlist for ${cls.title}`);
          return {
            ...cls,
            isBookedByMe: true,
            waitlistCount: cls.waitlistCount + 1,
            roster: [`${memberProfile.name} (You - Waitlist)`, ...cls.roster]
          };
        } else {
          showToast(`Spot confirmed for ${cls.title}!`);
          return {
            ...cls,
            isBookedByMe: true,
            bookedCount: cls.bookedCount + 1,
            roster: [`${memberProfile.name} (You)`, ...cls.roster]
          };
        }
      }
    });
    setClasses(updated);
    StorageService.set('apex_classes', updated);
  };

  const handleAddWorkout = (entry: Omit<WorkoutEntry, 'id' | 'date'>) => {
    const fullEntry: WorkoutEntry = {
      ...entry,
      id: `w-${Date.now()}`,
      date: 'Just now'
    };
    const updated = [fullEntry, ...workouts];
    setWorkouts(updated);
    StorageService.set('apex_workouts', updated);
    showToast(`Logged ${entry.exercise} (${entry.weight})`);
  };

  const handleUpdateProfile = (updates: Partial<MemberProfile>) => {
    const next = { ...memberProfile, ...updates };
    setMemberProfile(next);
    StorageService.set('apex_member', next);
    showToast('Profile updated');
  };

  const handleUpdateSettings = (updates: Partial<AppSettings>) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    StorageService.set('apex_settings', next);
  };

  const handleCreateClass = (
    newCls: Omit<GymClass, 'id' | 'bookedCount' | 'isBookedByMe' | 'waitlistCount' | 'roster'>
  ) => {
    const full: GymClass = {
      ...newCls,
      id: `cls-${Date.now()}`,
      bookedCount: 0,
      isBookedByMe: false,
      waitlistCount: 0,
      roster: []
    };
    const next = [full, ...classes];
    setClasses(next);
    StorageService.set('apex_classes', next);
    showToast(`Class "${full.title}" published!`);
  };

  const handleToggleMemberStatus = (memberId: string) => {
    const updated = members.map((m) =>
      m.id === memberId
        ? { ...m, status: (m.status === 'Active' ? 'Payment Due' : 'Active') as any }
        : m
    );
    setMembers(updated);
    showToast('Member status updated');
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
        invoices={INVOICES}
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
                  Production Build
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
                onLogout={handleLogout}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
