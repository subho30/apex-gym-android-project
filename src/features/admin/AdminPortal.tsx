import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Activity,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  CreditCard,
  UserCheck,
  Clock
} from 'lucide-react';
import { MemberProfile, GymClass, LeadItem, CheckInFeedItem } from '../../types';

interface AdminPortalProps {
  members: MemberProfile[];
  classes: GymClass[];
  leads: LeadItem[];
  feed: CheckInFeedItem[];
  occupancy: number;
  maxOccupancy: number;
  onCreateClass: (cls: Omit<GymClass, 'id' | 'bookedCount' | 'isBookedByMe' | 'waitlistCount' | 'roster'>) => void;
  onToggleMemberStatus: (memberId: string) => void;
  onLogout: () => void;
}

export function AdminPortal({
  members,
  classes,
  leads,
  feed,
  occupancy,
  maxOccupancy,
  onCreateClass,
  onToggleMemberStatus,
  onLogout
}: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<'rosters' | 'members' | 'leads'>('rosters');
  const [memberQuery, setMemberQuery] = useState('');

  // New Class Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('HIIT');
  const [trainer, setTrainer] = useState('Karan Singh');
  const [time, setTime] = useState('06:00 PM');
  const [room, setRoom] = useState('Main Studio');
  const [capacity, setCapacity] = useState(16);

  const handleClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreateClass({
      title: title.trim(),
      category,
      trainer,
      time,
      duration: '45 min',
      room,
      capacity: Number(capacity) || 16,
      intensity: 'High'
    });
    setTitle('');
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(memberQuery.toLowerCase()) ||
      m.memberId.toLowerCase().includes(memberQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <span className="text-xs text-zinc-400 block font-medium">Live Club Headcount</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-lime-400">{occupancy}</span>
            <span className="text-xs text-zinc-500">/ {maxOccupancy} limit</span>
          </div>
          <span className="text-[10px] text-lime-400 mt-2 block font-semibold">● Turnstile Connected</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <span className="text-xs text-zinc-400 block font-medium">Active Memberships</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-white">{members.length}</span>
            <span className="text-xs text-lime-400 font-semibold">+12% this month</span>
          </div>
          <span className="text-[10px] text-zinc-500 mt-2 block font-semibold">4 Due for Renewal</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <span className="text-xs text-zinc-400 block font-medium">Daily Class Capacity</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-white">{classes.length} Sessions</span>
          </div>
          <span className="text-[10px] text-zinc-400 mt-2 block">Peak Hours: 6:00 AM & 6:30 PM</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <span className="text-xs text-zinc-400 block font-medium">Free Trial Inquiries</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-white">{leads.length} Pending</span>
          </div>
          <span className="text-[10px] text-amber-400 mt-2 block font-semibold">Requires Staff Follow-up</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        {[
          { id: 'rosters', label: 'Class Schedules & Rosters' },
          { id: 'members', label: 'Member Directory & Access' },
          { id: 'leads', label: 'Leads & Free Pass Trials' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === tab.id
                ? 'bg-lime-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ROSTERS & CREATE CLASS */}
      {activeTab === 'rosters' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Class List & Rosters */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-white">Today's Class Rosters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map((cls) => (
                <div key={cls.id} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded">
                        {cls.category}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1">{cls.title}</h4>
                      <p className="text-xs text-zinc-400">{cls.time} • Coach {cls.trainer}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-zinc-300">
                      {cls.bookedCount} / {cls.capacity}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                      Enrolled Roster
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cls.roster.slice(0, 5).map((r, i) => (
                        <span key={i} className="text-[11px] bg-zinc-950 px-2 py-0.5 rounded-md text-zinc-300 border border-zinc-800">
                          {r}
                        </span>
                      ))}
                      {cls.roster.length > 5 && (
                        <span className="text-[11px] text-zinc-500 font-semibold px-1 py-0.5">
                          +{cls.roster.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create New Class Bay */}
          <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-lime-400" /> Create New Class Slot
            </h3>
            <form onSubmit={handleClassSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Class Title</label>
                <input
                  required
                  placeholder="e.g. Kettlebell Power Flow"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-white focus:outline-none focus:border-lime-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-white"
                  >
                    <option>HIIT</option>
                    <option>Strength</option>
                    <option>Yoga</option>
                    <option>Personal Training</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Time Slot</label>
                  <input
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Assigned Coach</label>
                <input
                  value={trainer}
                  onChange={(e) => setTrainer(e.target.value)}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1">Studio / Room</label>
                  <input
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Max Capacity</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-bold text-xs uppercase tracking-wider transition"
              >
                Publish to Member App
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: MEMBERS */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                placeholder="Search member name or ID…"
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-lime-400"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-bold border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Next Renewal</th>
                  <th className="px-4 py-3 text-right">Gate Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-800/40 transition">
                    <td className="px-4 py-3 font-semibold text-white">{m.name}</td>
                    <td className="px-4 py-3 font-mono text-zinc-400">{m.memberId}</td>
                    <td className="px-4 py-3 text-zinc-300">{m.tier}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          m.status === 'Active'
                            ? 'bg-lime-400/15 text-lime-400'
                            : 'bg-amber-400/15 text-amber-400'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{m.nextRenewal}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onToggleMemberStatus(m.id)}
                        className="px-2.5 py-1 rounded-lg border border-zinc-700 bg-zinc-800 text-[11px] font-semibold text-zinc-200 hover:border-lime-400 transition"
                      >
                        Toggle Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LEADS */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white">Trial Pass Inquiries</h3>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden divide-y divide-zinc-800">
            {leads.map((l) => (
              <div key={l.id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-white">{l.name}</p>
                  <p className="text-zinc-400 text-[11px]">{l.phone} • Source: {l.source}</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full bg-lime-400/15 text-lime-400 font-bold text-[10px]">
                    {l.status}
                  </span>
                  <p className="text-[10px] text-zinc-500 mt-1">{l.submitted}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
