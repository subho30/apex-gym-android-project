import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const dataDir = path.resolve(process.cwd(), '.data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'apex.db');
export const db = new DatabaseSync(dbPath);

// Initialize Tables
export function initDb() {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      mobile TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('member', 'staff', 'manager')),
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      member_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      tier TEXT NOT NULL DEFAULT 'Annual Pro',
      status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Payment Due', 'Expired', 'Frozen')),
      streak_days INTEGER NOT NULL DEFAULT 0,
      next_renewal TEXT,
      card_last_4 TEXT DEFAULT '4829',
      is_checked_in INTEGER DEFAULT 0,
      mobile TEXT NOT NULL,
      email TEXT,
      goal TEXT DEFAULT 'Build muscle',
      home_club TEXT DEFAULT 'Park Street Flagship',
      coach TEXT DEFAULT 'Karan Singh',
      emergency_contact TEXT DEFAULT 'Meera Sharma · +91 98300 20002',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'HIIT',
      trainer TEXT NOT NULL,
      time TEXT NOT NULL,
      duration TEXT NOT NULL DEFAULT '45 min',
      room TEXT NOT NULL DEFAULT 'Turf Zone A',
      capacity INTEGER NOT NULL DEFAULT 20,
      booked_count INTEGER NOT NULL DEFAULT 0,
      intensity TEXT NOT NULL DEFAULT 'High',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS class_bookings (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      is_waitlist INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(class_id, member_id),
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      exercise TEXT NOT NULL,
      weight TEXT NOT NULL,
      sets INTEGER NOT NULL DEFAULT 3,
      reps INTEGER NOT NULL DEFAULT 8,
      is_pr INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS check_ins (
      id TEXT PRIMARY KEY,
      member_id TEXT,
      member_name TEXT NOT NULL,
      tier TEXT NOT NULL,
      gate TEXT DEFAULT 'Main Turnstile A',
      method TEXT DEFAULT 'Dynamic QR Token',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS occupancy (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      current_count INTEGER NOT NULL DEFAULT 64,
      max_capacity INTEGER NOT NULL DEFAULT 120,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      source TEXT DEFAULT 'Landing Page',
      status TEXT DEFAULT 'New Lead',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gate_tokens (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      issued_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      used INTEGER DEFAULT 0,
      used_at TEXT,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Paid',
      payment_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    );
  `);

  // Seed default occupancy if not present
  const occ = db.prepare('SELECT id FROM occupancy WHERE id = 1').get();
  if (!occ) {
    db.prepare('INSERT INTO occupancy (id, current_count, max_capacity) VALUES (1, 64, 120)').run();
  }

  // Seed default users & members if table empty
  const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    // 1. Demo Member
    db.prepare(`
      INSERT INTO users (id, mobile, role, name)
      VALUES ('usr-member-1', '9830010001', 'member', 'Rohan Sharma')
    `).run();

    db.prepare(`
      INSERT INTO members (id, user_id, member_id, name, tier, status, streak_days, next_renewal, card_last_4, is_checked_in, mobile, email, goal, home_club, coach, emergency_contact)
      VALUES ('mem-1', 'usr-member-1', 'APX-2041', 'Rohan Sharma', 'Annual Pro', 'Active', 14, 'Dec 01, 2026', '4829', 1, '+91 98300 10001', 'rohan.sharma@example.com', 'Build muscle', 'Park Street', 'Karan Singh', 'Meera Sharma · +91 98300 20002')
    `).run();

    // Extra members for staff scanner directory
    db.prepare(`
      INSERT INTO members (id, member_id, name, tier, status, streak_days, next_renewal, card_last_4, is_checked_in, mobile, email, goal, home_club, coach)
      VALUES
      ('mem-2', 'APX-1088', 'Priya Nair', 'Monthly Pro', 'Active', 9, 'Nov 28, 2026', '1092', 1, '+91 98300 10002', 'priya.nair@example.com', 'Weight Loss', 'Park Street', 'Neha Kapoor'),
      ('mem-3', 'APX-3012', 'Kabir Khan', 'Annual Pro', 'Active', 22, 'Jan 15, 2027', '9912', 0, '+91 98300 10003', 'kabir.khan@example.com', 'Athletic Conditioning', 'Park Street', 'Karan Singh'),
      ('mem-4', 'APX-4105', 'Ananya Iyer', 'Monthly Basic', 'Payment Due', 3, 'Nov 05, 2026', '5511', 0, '+91 98300 10004', 'ananya.iyer@example.com', 'Yoga & Mobility', 'Park Street', 'Ritu Bansal')
    `).run();

    // 2. Demo Staff
    db.prepare(`
      INSERT INTO users (id, mobile, role, name)
      VALUES ('usr-staff-1', '9830010002', 'staff', 'Meera Joshi (Front Desk)')
    `).run();

    // 3. Demo Manager
    db.prepare(`
      INSERT INTO users (id, mobile, role, name)
      VALUES ('usr-manager-1', '9830010003', 'manager', 'Anita Das (General Manager)')
    `).run();

    // Classes
    db.prepare(`
      INSERT INTO classes (id, title, category, trainer, time, duration, room, capacity, booked_count, intensity)
      VALUES
      ('cls-1', 'Metcon Burn HIIT', 'HIIT', 'Karan Singh', '06:00 AM', '45 min', 'Turf Zone A', 20, 18, 'High'),
      ('cls-2', 'Olympic Lifting & Power', 'Strength', 'Neha Kapoor', '07:30 AM', '60 min', 'Platform Bay', 12, 11, 'Extreme'),
      ('cls-3', 'Surya Namaskar & Power Yoga', 'Yoga', 'Ritu Bansal', '09:00 AM', '50 min', 'Yoga Studio', 15, 15, 'Moderate'),
      ('cls-4', '1-on-1 Hypertrophy Assessment', 'Personal Training', 'Imran Qureshi', '06:00 PM', '60 min', 'Private Bay 2', 1, 0, 'High'),
      ('cls-5', 'Functional Calisthenics', 'Strength', 'Vikram Seth', '07:00 PM', '45 min', 'Rig Zone', 16, 9, 'High')
    `).run();

    // Initial member booking
    db.prepare(`
      INSERT INTO class_bookings (id, class_id, member_id, is_waitlist)
      VALUES ('cb-1', 'cls-1', 'mem-1', 0)
    `).run();

    // Workouts
    db.prepare(`
      INSERT INTO workouts (id, member_id, exercise, weight, sets, reps, is_pr)
      VALUES
      ('w-1', 'mem-1', 'Deadlift (Conventional)', '160 kg', 4, 5, 1),
      ('w-2', 'mem-1', 'Incline Dumbbell Bench', '36 kg / hand', 3, 8, 0),
      ('w-3', 'mem-1', 'Back Squat (High Bar)', '135 kg', 5, 5, 0),
      ('w-4', 'mem-1', 'Weighted Pull-ups', '+20 kg', 3, 6, 1)
    `).run();

    // Checkins
    db.prepare(`
      INSERT INTO check_ins (id, member_id, member_name, tier, gate, method)
      VALUES
      ('chk-1', 'mem-1', 'Rohan Sharma', 'Annual Pro', 'Main Turnstile A', 'Dynamic QR Token'),
      ('chk-2', 'mem-2', 'Priya Nair', 'Monthly Pro', 'Main Turnstile B', 'Dynamic QR Token'),
      ('chk-3', 'mem-3', 'Kabir Khan', 'Annual Pro', 'Main Turnstile A', 'Dynamic QR Token')
    `).run();

    // Leads
    db.prepare(`
      INSERT INTO leads (id, name, phone, source, status)
      VALUES
      ('ld-1', 'Tanvi Sen', '+91 98311 44550', 'Instagram Ad', 'Booked Free Trial'),
      ('ld-2', 'Aakash Roy', '+91 98302 99881', 'Walk-in Inquiry', 'Demo Scheduled'),
      ('ld-3', 'Debolina Dutta', '+91 98310 11223', 'Google Maps', 'Pending Call')
    `).run();

    // Invoices for Rohan Sharma (mem-1)
    db.prepare(`
      INSERT INTO invoices (id, member_id, date, description, amount, status)
      VALUES
      ('INV-2026-11', 'mem-1', '01 Nov 2026', 'Annual Pro Membership Renewal', '₹28,500', 'Paid'),
      ('INV-2026-10', 'mem-1', '15 Oct 2026', '10x Personal Training Pack (Coach Karan)', '₹14,000', 'Paid'),
      ('INV-2026-08', 'mem-1', '01 Aug 2026', 'Locker Rental (Bay 42)', '₹1,200', 'Paid')
    `).run();
  }
}
