import {
  GymClass,
  MemberProfile,
  WorkoutEntry,
  CheckInFeedItem,
  TrainerItem,
  InvoiceItem,
  ClubInfo,
  LeadItem,
  PricingPlan
} from '../types';

export const INITIAL_CLASSES: GymClass[] = [
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
    room: 'Private Bay 2',
    capacity: 1,
    bookedCount: 0,
    isBookedByMe: false,
    waitlistCount: 0,
    intensity: 'High',
    roster: []
  },
  {
    id: 'cls-5',
    title: 'Functional Calisthenics',
    category: 'Strength',
    trainer: 'Vikram Seth',
    time: '07:00 PM',
    duration: '45 min',
    room: 'Rig Zone',
    capacity: 16,
    bookedCount: 9,
    isBookedByMe: false,
    waitlistCount: 0,
    intensity: 'High',
    roster: ['Rohan Sharma', 'Dev Patel', 'Arjun Sengupta']
  }
];

export const INITIAL_WORKOUT_LOGS: WorkoutEntry[] = [
  { id: 'w-1', exercise: 'Deadlift (Conventional)', weight: '160 kg', sets: 4, reps: 5, date: 'Yesterday', isPR: true },
  { id: 'w-2', exercise: 'Incline Dumbbell Bench', weight: '36 kg / hand', sets: 3, reps: 8, date: '3 days ago', isPR: false },
  { id: 'w-3', exercise: 'Back Squat (High Bar)', weight: '135 kg', sets: 5, reps: 5, date: 'Nov 12', isPR: false },
  { id: 'w-4', exercise: 'Weighted Pull-ups', weight: '+20 kg', sets: 3, reps: 6, date: 'Nov 09', isPR: true }
];

export const INITIAL_MEMBERS: MemberProfile[] = [
  {
    id: 'APX-2041',
    memberId: 'APX-2041',
    name: 'Rohan Sharma (You)',
    tier: 'Annual Pro',
    status: 'Active',
    streakDays: 14,
    nextRenewal: 'Dec 01, 2026',
    cardLast4: '4829',
    isCheckedIn: true,
    mobile: '+91 98300 10001',
    email: 'rohan.sharma@example.com',
    goal: 'Build muscle',
    homeClub: 'Park Street',
    coach: 'Karan Singh',
    joined: 'Jan 12, 2026',
    emergencyContact: 'Meera Sharma · +91 98300 20002'
  },
  {
    id: 'APX-1088',
    memberId: 'APX-1088',
    name: 'Priya Nair',
    tier: 'Monthly Pro',
    status: 'Active',
    streakDays: 9,
    nextRenewal: 'Nov 28, 2026',
    cardLast4: '1092',
    isCheckedIn: true,
    mobile: '+91 98300 10002',
    email: 'priya.nair@example.com',
    goal: 'Weight Loss',
    homeClub: 'Park Street',
    coach: 'Neha Kapoor',
    joined: 'Feb 15, 2026',
    emergencyContact: 'Sunil Nair · +91 98300 20003'
  },
  {
    id: 'APX-3012',
    memberId: 'APX-3012',
    name: 'Kabir Khan',
    tier: 'Annual Pro',
    status: 'Active',
    streakDays: 22,
    nextRenewal: 'Jan 15, 2027',
    cardLast4: '9912',
    isCheckedIn: false,
    mobile: '+91 98300 10003',
    email: 'kabir.khan@example.com',
    goal: 'Athletic Conditioning',
    homeClub: 'Park Street',
    coach: 'Karan Singh',
    joined: 'Aug 01, 2025',
    emergencyContact: 'Ayesha Khan · +91 98300 20004'
  },
  {
    id: 'APX-4105',
    memberId: 'APX-4105',
    name: 'Ananya Iyer',
    tier: 'Monthly Basic',
    status: 'Payment Due',
    streakDays: 3,
    nextRenewal: 'Overdue · Nov 05',
    cardLast4: '5511',
    isCheckedIn: false,
    mobile: '+91 98300 10004',
    email: 'ananya.iyer@example.com',
    goal: 'Yoga & Mobility',
    homeClub: 'Park Street',
    coach: 'Ritu Bansal',
    joined: 'Oct 05, 2026',
    emergencyContact: 'V. Iyer · +91 98300 20005'
  }
];

export const INITIAL_CHECKIN_FEED: CheckInFeedItem[] = [
  { id: 'chk-1', member: 'Rohan Sharma (You)', tier: 'Annual Pro', time: '06:12 AM', method: 'Dynamic QR Token', gate: 'Main Turnstile A' },
  { id: 'chk-2', member: 'Priya Nair', tier: 'Monthly Pro', time: '06:08 AM', method: 'Dynamic QR Token', gate: 'Main Turnstile B' },
  { id: 'chk-3', member: 'Aditya Rao', tier: 'Annual Pro', time: '05:58 AM', method: 'Dynamic QR Token', gate: 'Main Turnstile A' },
  { id: 'chk-4', member: 'Meera Joshi', tier: 'Staff Pass', time: '05:45 AM', method: 'NFC Badge', gate: 'Staff Lane' }
];

export const TRAINERS: TrainerItem[] = [
  { name: 'Karan Singh', spec: 'Strength & Conditioning · Crossfit L2', rating: '4.95', clients: 42, image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
  { name: 'Neha Kapoor', spec: 'Olympic Weightlifting · Mobility', rating: '4.98', clients: 35, image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80' },
  { name: 'Imran Qureshi', spec: 'Hypertrophy & Physique Coaching', rating: '4.91', clients: 28, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' }
];

export const INVOICES: InvoiceItem[] = [
  { id: 'INV-2026-11', date: '01 Nov 2026', desc: 'Annual Pro Membership Renewal', amount: '₹28,500', status: 'Paid' },
  { id: 'INV-2026-10', date: '15 Oct 2026', desc: '10x Personal Training Pack (Coach Karan)', amount: '₹14,000', status: 'Paid' },
  { id: 'INV-2026-08', date: '01 Aug 2026', desc: 'Locker Rental (Bay 42)', amount: '₹1,200', status: 'Paid' }
];

export const CLUB: ClubInfo = {
  name: 'Apex Gym Park Street Flagship',
  tagline: 'Elite Strength & Conditioning Club',
  address: '14/B Park Street, Camac St Crossing, Kolkata 700016',
  phone: '+91 33 2289 4400',
  whatsapp: '+91 98300 00111',
  email: 'parkstreet@apexgym.in',
  hours: 'Mon – Sat: 05:30 AM – 10:30 PM · Sun: 07:00 AM – 08:00 PM',
  features: [
    'Eleiko Olympic Lifting Platforms',
    'Hammer Strength ISO-Lateral Suite',
    '30m Sled & Sprint Turf Bay',
    'Finnish Sauna & Cold Plunges',
    'Dedicated Reformer Pilates Studio',
    'Valet Parking & High-Speed WiFi'
  ]
};

export const INITIAL_LEADS: LeadItem[] = [
  { id: 'ld-1', name: 'Tanvi Sen', phone: '+91 98311 44550', source: 'Instagram Ad', status: 'Booked Free Trial', submitted: '10 mins ago' },
  { id: 'ld-2', name: 'Aakash Roy', phone: '+91 98302 99881', source: 'Walk-in Inquiry', status: 'Demo Scheduled', submitted: '2 hours ago' },
  { id: 'ld-3', name: 'Debolina Dutta', phone: '+91 98310 11223', source: 'Google Maps', status: 'Pending Call', submitted: 'Yesterday' }
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'plan-monthly',
    name: 'Monthly Pro',
    price: '₹3,499',
    billing: 'billed monthly · no lock-in',
    features: ['Full gym floor access', 'All group HIIT & Yoga classes', 'App-based dynamic QR gate pass', 'Locker & towel service']
  },
  {
    id: 'plan-annual',
    name: 'Annual Pro',
    price: '₹2,375',
    billing: '₹28,500 billed annually (Save 32%)',
    badge: 'Most Popular',
    features: ['All Monthly Pro benefits', '2 Free 1-on-1 coach assessments', 'Cold plunge & Finnish sauna access', '5 Guest gate passes per year', 'Priority class waitlist clearance']
  },
  {
    id: 'plan-vip',
    name: 'Apex Black Tier',
    price: '₹4,999',
    billing: 'billed monthly',
    badge: 'VIP Elite',
    features: ['All Annual Pro benefits', 'Unlimited Personal Training check-ins', 'Dedicated private locker bay', 'Complimentary recovery shakes', 'Anytime guest privileges']
  }
];

export const GYM_PHOTOS = [
  { url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80', caption: 'Olympic Lifting & Rig Bay' },
  { url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=80', caption: 'Turf Zone & Functional Sprint Track' },
  { url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80', caption: 'Reformer Pilates & Mobility Studio' }
];
