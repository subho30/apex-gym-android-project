export type UserRole = 'member' | 'staff' | 'manager';

export interface UserSession {
  role: UserRole;
  name: string;
  memberId?: string;
  mobile?: string;
}

export interface MemberProfile {
  id: string;
  name: string;
  memberId: string;
  tier: string;
  status: 'Active' | 'Payment Due' | 'Expired';
  streakDays: number;
  nextRenewal: string;
  cardLast4: string;
  isCheckedIn: boolean;
  mobile: string;
  email: string;
  goal: string;
  homeClub: string;
  coach: string;
  joined: string;
  emergencyContact: string;
}

export type ClassIntensity = 'Low' | 'Moderate' | 'High' | 'Extreme';

export interface GymClass {
  id: string;
  title: string;
  category: string;
  trainer: string;
  time: string;
  duration: string;
  room: string;
  capacity: number;
  bookedCount: number;
  isBookedByMe: boolean;
  waitlistCount: number;
  intensity: ClassIntensity;
  roster: string[];
}

export interface WorkoutEntry {
  id: string;
  exercise: string;
  weight: string;
  sets: number;
  reps: number;
  date: string;
  isPR: boolean;
}

export interface CheckInFeedItem {
  id: string;
  member: string;
  tier: string;
  time: string;
  method: string;
  gate: string;
}

export interface LeadItem {
  id: string;
  name: string;
  phone: string;
  source: string;
  status: string;
  submitted: string;
}

export interface InvoiceItem {
  id: string;
  date: string;
  desc: string;
  amount: string;
  status: 'Paid' | 'Pending';
}

export interface TrainerItem {
  name: string;
  spec: string;
  rating: string;
  clients: number;
  image: string;
}

export interface ClubInfo {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  hours: string;
  features: string[];
}

export interface AppSettings {
  whatsapp: boolean;
  push: boolean;
  classReminders: boolean;
  faceEntry: boolean;
  language: string;
  lite: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  billing: string;
  badge?: string;
  features: string[];
}
