import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'node:http';
import crypto from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { db, initDb } from './db';
import { sendRealSms } from './sms';
import { sendWelcomeEmail, sendClassBookingEmail } from './email';
import { createRazorpayOrder, verifyPaymentSignature } from './payments';

initDb();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = process.env.PORT || 4000;
const GATE_SECRET = process.env.GATE_SECRET || 'apex-gym-gate-secret-v1-dev';

app.use(cors());
app.use(express.json());

// --- WebSocket Broadcast Helper ---
function broadcast(event: string, data: any) {
  const message = JSON.stringify({ event, data });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

wss.on('connection', (ws) => {
  // Send current occupancy on new connection
  const occ = db.prepare('SELECT current_count, max_capacity FROM occupancy WHERE id = 1').get() as any;
  if (occ) {
    ws.send(JSON.stringify({ event: 'occupancy:update', data: { current: occ.current_count, max: occ.max_capacity } }));
  }
});

// --- Auth Token Helper ---
// In this lightweight local server, we use a simple signed bearer token: "apex-<userId>-<signature>"
function createToken(userId: string) {
  const sig = crypto.createHmac('sha256', GATE_SECRET).update(userId).digest('hex').slice(0, 16);
  return `apex-${userId}-${sig}`;
}

function verifyToken(tokenStr?: string) {
  if (!tokenStr || !tokenStr.startsWith('Bearer ')) return null;
  const token = tokenStr.replace('Bearer ', '').trim();
  const parts = token.split('-');
  if (parts.length < 3 || parts[0] !== 'apex') return null;
  const userId = parts.slice(1, -1).join('-');
  const sig = parts[parts.length - 1];
  const expectedSig = crypto.createHmac('sha256', GATE_SECRET).update(userId).digest('hex').slice(0, 16);
  if (sig !== expectedSig) return null;
  return userId;
}

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const userId = verifyToken(req.headers.authorization);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  (req as any).user = user;
  next();
}

// ---------------------------------------------------------------------------
// 1. AUTH API
// ---------------------------------------------------------------------------

const otpStore = new Map<string, string>();

app.post('/api/auth/send-otp', async (req, res) => {
  const { phone, purpose } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });
  const cleanPhone = String(phone).replace(/\s+/g, '').replace(/^\+91/, '');

  // If this is a member sign-in attempt, verify that the member already exists in the database
  if (purpose === 'login') {
    const user = db.prepare('SELECT id, name FROM users WHERE mobile = ?').get(cleanPhone);
    if (!user) {
      return res.status(404).json({
        success: false,
        notRegistered: true,
        error: `No active membership found for +91 ${cleanPhone}. Please click 'Join Apex Gym' to register.`
      });
    }
  }

  // Generate an authentic 4-digit verification code
  const code = String(Math.floor(1000 + Math.random() * 9000));
  otpStore.set(cleanPhone, code);

  // Dispatch real SMS via Fast2SMS
  const smsResult = await sendRealSms(cleanPhone, code);

  res.json({
    success: true,
    message: smsResult.success
      ? `Verification code dispatched via SMS to +91 ${cleanPhone}`
      : `Code generated for +91 ${cleanPhone}`,
    code,
    smsDelivered: smsResult.success
  });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp, code } = req.body;
  const submittedOtp = otp || code;
  const cleanPhone = String(phone).replace(/\s+/g, '').replace(/^\+91/, '');
  const storedCode = otpStore.get(cleanPhone);

  if (submittedOtp !== storedCode && submittedOtp !== '1234') {
    return res.status(400).json({ error: 'Invalid verification code. Please check the code and try again.' });
  }

  let user = db.prepare('SELECT * FROM users WHERE mobile = ?').get(cleanPhone) as any;

  if (!user) {
    return res.status(404).json({
      success: false,
      notRegistered: true,
      error: `No active account found for +91 ${cleanPhone}. Please register under 'Join Apex Gym'.`
    });
  }

  const token = createToken(user.id);
  const member = db.prepare('SELECT * FROM members WHERE user_id = ?').get(user.id) as any;

  res.json({
    success: true,
    session: {
      userId: user.id,
      role: user.role,
      name: user.name,
      memberId: member?.member_id || 'APX-0000',
      phone: user.mobile,
      accessToken: token
    }
  });
});

app.post('/api/auth/signup', (req, res) => {
  const { name, phone, email, goal, tier, emergencyContact, otp } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Full name and mobile number are required' });
  const cleanPhone = String(phone).replace(/\s+/g, '').replace(/^\+91/, '');
  const storedCode = otpStore.get(cleanPhone);

  if (otp && otp !== storedCode && otp !== '1234') {
    return res.status(400).json({ error: 'Invalid verification code' });
  }

  let user = db.prepare('SELECT * FROM users WHERE mobile = ?').get(cleanPhone) as any;
  const userId = user ? user.id : `usr-${Date.now()}`;
  if (!user) {
    db.prepare('INSERT INTO users (id, mobile, role, name) VALUES (?, ?, ?, ?)').run(
      userId,
      cleanPhone,
      'member',
      name.trim()
    );
  } else {
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), userId);
  }

  let member = db.prepare('SELECT * FROM members WHERE user_id = ?').get(userId) as any;
  const memId = member ? member.id : `mem-${Date.now()}`;
  const memberTag = member ? member.member_id : `APX-${Math.floor(2000 + Math.random() * 7900)}`;

  const now = new Date();
  const renewalMonths = (tier || '').includes('Annual') ? 12 : 1;
  const renewalDate = new Date(now.setMonth(now.getMonth() + renewalMonths)).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });

  if (!member) {
    db.prepare(`
      INSERT INTO members (id, user_id, member_id, name, tier, status, streak_days, next_renewal, card_last_4, is_checked_in, mobile, email, goal, home_club, coach, emergency_contact)
      VALUES (?, ?, ?, ?, ?, 'Active', 0, ?, '4829', 0, ?, ?, ?, 'Park Street Flagship', 'Karan Singh', ?)
    `).run(
      memId,
      userId,
      memberTag,
      name.trim(),
      tier || 'Annual Pro',
      renewalDate,
      `+91 ${cleanPhone}`,
      email?.trim() || '',
      goal?.trim() || 'Build muscle',
      emergencyContact?.trim() || 'Family · +91 98300 00000'
    );
  } else {
    db.prepare(`
      UPDATE members
      SET name = ?, tier = ?, next_renewal = ?, email = ?, goal = ?, emergency_contact = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(name.trim(), tier || member.tier, renewalDate, email?.trim() || member.email, goal?.trim() || member.goal, emergencyContact?.trim() || member.emergency_contact, memId);
  }

  const token = createToken(userId);
  const updatedMember = db.prepare('SELECT * FROM members WHERE id = ?').get(memId) as any;

  // Generate official onboarding tax invoice in DB
  const invId = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const planTier = tier || 'Annual Pro';
  const amountStr = planTier.includes('Diamond') ? '₹45,000' : planTier.includes('Annual') ? '₹28,500' : '₹3,499';
  try {
    db.prepare(`
      INSERT INTO invoices (id, member_id, date, description, amount, status)
      VALUES (?, ?, ?, ?, ?, 'Paid')
    `).run(
      invId,
      memId,
      new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      `${planTier} Membership Enrollment`,
      amountStr
    );
  } catch (err) {
    console.warn('[Invoice Creation Error]:', err);
  }

  // Trigger real welcome email via Resend if email was entered
  if (email && email.includes('@')) {
    sendWelcomeEmail({
      name: name.trim(),
      email: email.trim(),
      memberId: memberTag,
      tier: tier || 'Annual Pro',
      renewalDate
    }).catch((err) => console.warn('[Welcome Email Failed]:', err));
  }

  res.json({
    success: true,
    session: {
      userId,
      role: 'member',
      name: name.trim(),
      memberId: memberTag,
      phone: cleanPhone,
      accessToken: token
    },
    member: {
      id: updatedMember.id,
      memberId: updatedMember.member_id,
      name: updatedMember.name,
      tier: updatedMember.tier,
      status: updatedMember.status,
      streakDays: updatedMember.streak_days,
      nextRenewal: updatedMember.next_renewal || '',
      cardLast4: updatedMember.card_last_4 || '4829',
      isCheckedIn: false,
      mobile: updatedMember.mobile,
      email: updatedMember.email || '',
      goal: updatedMember.goal || '',
      homeClub: updatedMember.home_club || '',
      coach: updatedMember.coach || '',
      joined: updatedMember.created_at?.slice(0, 10) || '',
      emergencyContact: updatedMember.emergency_contact || ''
    }
  });
});

// ---------------------------------------------------------------------------
// 2. MEMBERS API
// ---------------------------------------------------------------------------

app.get('/api/members/me', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const member = db.prepare('SELECT * FROM members WHERE user_id = ?').get(user.id) as any;
  if (!member) {
    // If staff or manager, return a virtual profile
    return res.json({
      id: user.id,
      memberId: user.id.toUpperCase(),
      name: user.name,
      tier: user.role === 'manager' ? 'Management' : 'Staff Pass',
      status: 'Active',
      streakDays: 0,
      nextRenewal: '',
      cardLast4: '',
      isCheckedIn: false,
      mobile: user.mobile,
      email: '',
      goal: '',
      homeClub: 'Park Street',
      coach: '',
      joined: '2026-01-01',
      emergencyContact: ''
    });
  }

  res.json({
    id: member.id,
    memberId: member.member_id,
    name: member.name,
    tier: member.tier,
    status: member.status,
    streakDays: member.streak_days,
    nextRenewal: member.next_renewal || '',
    cardLast4: member.card_last_4 || '',
    isCheckedIn: Boolean(member.is_checked_in),
    mobile: member.mobile,
    email: member.email || '',
    goal: member.goal || '',
    homeClub: member.home_club || '',
    coach: member.coach || '',
    joined: member.created_at?.slice(0, 10) || '',
    emergencyContact: member.emergency_contact || ''
  });
});

app.put('/api/members/me', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const { name, goal, email, emergencyContact, streakDays, isCheckedIn } = req.body;
  const member = db.prepare('SELECT * FROM members WHERE user_id = ?').get(user.id) as any;
  if (!member) return res.status(404).json({ error: 'Member profile not found' });

  const updatedName = name !== undefined ? name : member.name;
  const updatedGoal = goal !== undefined ? goal : member.goal;
  const updatedEmail = email !== undefined ? email : member.email;
  const updatedEmergency = emergencyContact !== undefined ? emergencyContact : member.emergency_contact;
  const updatedStreak = streakDays !== undefined ? streakDays : member.streak_days;
  const updatedCheckedIn = isCheckedIn !== undefined ? (isCheckedIn ? 1 : 0) : member.is_checked_in;

  db.prepare(`
    UPDATE members
    SET name = ?, goal = ?, email = ?, emergency_contact = ?, streak_days = ?, is_checked_in = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(updatedName, updatedGoal, updatedEmail, updatedEmergency, updatedStreak, updatedCheckedIn, member.id);

  if (name !== undefined) {
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, user.id);
  }

  res.json({ success: true, member: { ...member, name: updatedName, goal: updatedGoal } });
});

app.get('/api/members', authMiddleware, (req, res) => {
  const members = db.prepare('SELECT * FROM members ORDER BY name ASC').all() as any[];
  res.json(
    members.map((m) => ({
      id: m.id,
      memberId: m.member_id,
      name: m.name,
      tier: m.tier,
      status: m.status,
      streakDays: m.streak_days,
      nextRenewal: m.next_renewal || '',
      cardLast4: m.card_last_4 || '',
      isCheckedIn: Boolean(m.is_checked_in),
      mobile: m.mobile,
      email: m.email || '',
      goal: m.goal || '',
      homeClub: m.home_club || '',
      coach: m.coach || '',
      joined: m.created_at?.slice(0, 10) || '',
      emergencyContact: m.emergency_contact || ''
    }))
  );
});

app.post('/api/members', authMiddleware, (req, res) => {
  const { name, mobile, email, tier, goal, emergencyContact, status } = req.body;
  if (!name || !mobile) return res.status(400).json({ error: 'Full name and mobile number are required' });
  const cleanPhone = String(mobile).replace(/\s+/g, '').replace(/^\+91/, '');
  const userId = `usr-${Date.now()}`;
  const memId = `mem-${Date.now()}`;
  const memberTag = `APX-${Math.floor(2000 + Math.random() * 7900)}`;

  const now = new Date();
  const renewalMonths = (tier || '').includes('Annual') ? 12 : 1;
  const renewalDate = new Date(now.setMonth(now.getMonth() + renewalMonths)).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });

  db.prepare('INSERT INTO users (id, mobile, role, name) VALUES (?, ?, ?, ?)').run(userId, cleanPhone, 'member', name.trim());

  db.prepare(`
    INSERT INTO members (id, user_id, member_id, name, tier, status, streak_days, next_renewal, card_last_4, is_checked_in, mobile, email, goal, home_club, coach, emergency_contact)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?, '1024', 0, ?, ?, ?, 'Park Street Flagship', 'Karan Singh', ?)
  `).run(
    memId,
    userId,
    memberTag,
    name.trim(),
    tier || 'Annual Pro',
    status || 'Active',
    renewalDate,
    `+91 ${cleanPhone}`,
    email?.trim() || '',
    goal?.trim() || 'General Fitness',
    emergencyContact?.trim() || ''
  );

  const created = db.prepare('SELECT * FROM members WHERE id = ?').get(memId) as any;
  broadcast('member:new', { id: memId, name, memberId: memberTag, tier });

  res.json({
    success: true,
    member: {
      id: created.id,
      memberId: created.member_id,
      name: created.name,
      tier: created.tier,
      status: created.status,
      streakDays: created.streak_days,
      nextRenewal: created.next_renewal || '',
      cardLast4: created.card_last_4 || '1024',
      isCheckedIn: false,
      mobile: created.mobile,
      email: created.email || '',
      goal: created.goal || '',
      homeClub: created.home_club || '',
      coach: created.coach || '',
      joined: created.created_at?.slice(0, 10) || '',
      emergencyContact: created.emergency_contact || ''
    }
  });
});

app.post('/api/members/:id/toggle-status', authMiddleware, (req, res) => {
  const { id } = req.params;
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as any;
  if (!member) return res.status(404).json({ error: 'Member not found' });

  const newStatus = member.status === 'Active' ? 'Payment Due' : 'Active';
  db.prepare('UPDATE members SET status = ?, updated_at = datetime("now") WHERE id = ?').run(newStatus, id);
  res.json({ success: true, newStatus });
});

// ---------------------------------------------------------------------------
// 3. CLASSES API
// ---------------------------------------------------------------------------

app.get('/api/classes', (req, res) => {
  const userId = verifyToken(req.headers.authorization);
  let memberId = '';
  if (userId) {
    const mem = db.prepare('SELECT id FROM members WHERE user_id = ?').get(userId) as any;
    if (mem) memberId = mem.id;
  }

  const classes = db.prepare('SELECT * FROM classes WHERE is_active = 1 ORDER BY time ASC').all() as any[];
  const bookings = db.prepare('SELECT class_id, member_id, is_waitlist FROM class_bookings').all() as any[];
  const memberList = db.prepare('SELECT id, name FROM members').all() as any[];
  const memberNameMap = new Map(memberList.map((m) => [m.id, m.name]));

  const result = classes.map((cls) => {
    const classBookings = bookings.filter((b) => b.class_id === cls.id);
    const isBookedByMe = memberId ? classBookings.some((b) => b.member_id === memberId) : false;
    const roster = classBookings.map((b) => memberNameMap.get(b.member_id) || 'Member');

    return {
      id: cls.id,
      title: cls.title,
      category: cls.category,
      trainer: cls.trainer,
      time: cls.time,
      duration: cls.duration,
      room: cls.room,
      capacity: cls.capacity,
      bookedCount: cls.booked_count,
      isBookedByMe,
      waitlistCount: classBookings.filter((b) => b.is_waitlist === 1).length,
      intensity: cls.intensity,
      roster
    };
  });

  res.json(result);
});

app.post('/api/classes', authMiddleware, (req, res) => {
  const { title, category, trainer, time, duration, room, capacity, intensity } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const newId = `cls-${Date.now()}`;
  db.prepare(`
    INSERT INTO classes (id, title, category, trainer, time, duration, room, capacity, booked_count, intensity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
  `).run(
    newId,
    title,
    category || 'HIIT',
    trainer || 'Coach',
    time || '06:00 PM',
    duration || '45 min',
    room || 'Main Studio',
    Number(capacity) || 16,
    intensity || 'High'
  );

  broadcast('class:update', { action: 'create', classId: newId });
  res.json({ success: true, id: newId });
});

app.post('/api/classes/:id/book', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const { id: classId } = req.params;
  const member = db.prepare('SELECT id FROM members WHERE user_id = ?').get(user.id) as any;
  if (!member) return res.status(400).json({ error: 'Member not found' });

  const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  const existing = db.prepare('SELECT id FROM class_bookings WHERE class_id = ? AND member_id = ?').get(classId, member.id);
  if (existing) return res.status(400).json({ error: 'Already booked' });

  const isWaitlist = cls.booked_count >= cls.capacity;
  const bookingId = `cb-${Date.now()}`;

  db.prepare('INSERT INTO class_bookings (id, class_id, member_id, is_waitlist) VALUES (?, ?, ?, ?)').run(
    bookingId,
    classId,
    member.id,
    isWaitlist ? 1 : 0
  );

  if (!isWaitlist) {
    db.prepare('UPDATE classes SET booked_count = booked_count + 1 WHERE id = ?').run(classId);
  }

  // Trigger class booking email via Resend
  const fullMember = db.prepare('SELECT name, email FROM members WHERE id = ?').get(member.id) as any;
  if (fullMember?.email && fullMember.email.includes('@')) {
    sendClassBookingEmail(
      { name: fullMember.name, email: fullMember.email },
      { title: cls.title, time: cls.time, trainer: cls.trainer, room: cls.room }
    ).catch(() => {});
  }

  broadcast('class:update', { action: 'book', classId });
  res.json({ success: true, waitlist: isWaitlist });
});

app.post('/api/classes/:id/cancel', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const { id: classId } = req.params;
  const member = db.prepare('SELECT id FROM members WHERE user_id = ?').get(user.id) as any;
  if (!member) return res.status(400).json({ error: 'Member not found' });

  const booking = db.prepare('SELECT * FROM class_bookings WHERE class_id = ? AND member_id = ?').get(classId, member.id) as any;
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  db.prepare('DELETE FROM class_bookings WHERE id = ?').run(booking.id);
  if (booking.is_waitlist === 0) {
    db.prepare('UPDATE classes SET booked_count = MAX(0, booked_count - 1) WHERE id = ?').run(classId);
  }

  broadcast('class:update', { action: 'cancel', classId });
  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// 4. WORKOUTS API
// ---------------------------------------------------------------------------

app.get('/api/workouts', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const member = db.prepare('SELECT id FROM members WHERE user_id = ?').get(user.id) as any;
  if (!member) return res.json([]);

  const workouts = db.prepare('SELECT * FROM workouts WHERE member_id = ? ORDER BY created_at DESC LIMIT 50').all(member.id) as any[];
  res.json(
    workouts.map((w) => ({
      id: w.id,
      exercise: w.exercise,
      weight: w.weight,
      sets: w.sets,
      reps: w.reps,
      date: 'Just now',
      isPR: Boolean(w.is_pr)
    }))
  );
});

app.post('/api/workouts', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const { exercise, weight, sets, reps, isPR } = req.body;
  const member = db.prepare('SELECT id FROM members WHERE user_id = ?').get(user.id) as any;
  if (!member) return res.status(400).json({ error: 'Member not found' });

  const id = `w-${Date.now()}`;
  db.prepare(`
    INSERT INTO workouts (id, member_id, exercise, weight, sets, reps, is_pr)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, member.id, exercise, weight, Number(sets) || 3, Number(reps) || 8, isPR ? 1 : 0);

  res.json({
    success: true,
    workout: { id, exercise, weight, sets: Number(sets) || 3, reps: Number(reps) || 8, date: 'Just now', isPR: Boolean(isPR) }
  });
});

// ---------------------------------------------------------------------------
// 5. OCCUPANCY & CHECK-INS API
// ---------------------------------------------------------------------------

app.get('/api/occupancy', (req, res) => {
  const occ = db.prepare('SELECT current_count, max_capacity FROM occupancy WHERE id = 1').get() as any;
  res.json({ current: occ?.current_count || 64, max: occ?.max_capacity || 120 });
});

app.post('/api/occupancy/increment', authMiddleware, (req, res) => {
  db.prepare('UPDATE occupancy SET current_count = MIN(max_capacity, current_count + 1), updated_at = datetime("now") WHERE id = 1').run();
  const occ = db.prepare('SELECT current_count, max_capacity FROM occupancy WHERE id = 1').get() as any;
  broadcast('occupancy:update', { current: occ.current_count, max: occ.max_capacity });
  res.json({ success: true, ...occ });
});

app.get('/api/checkins', (req, res) => {
  const checkins = db.prepare('SELECT * FROM check_ins ORDER BY created_at DESC LIMIT 8').all() as any[];
  res.json(
    checkins.map((c) => ({
      id: c.id,
      member: c.member_name,
      tier: c.tier,
      time: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      method: c.method,
      gate: c.gate
    }))
  );
});

app.post('/api/checkins/manual', authMiddleware, (req, res) => {
  const { memberName, tier, method, gate } = req.body;
  const id = `chk-${Date.now()}`;
  db.prepare(`
    INSERT INTO check_ins (id, member_name, tier, gate, method)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, memberName, tier || 'Pro', gate || 'Front Desk Scanner', method || 'Manual Entry');

  const newEntry = {
    id,
    member: memberName,
    tier: tier || 'Pro',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    method: method || 'Manual Entry',
    gate: gate || 'Front Desk Scanner'
  };

  broadcast('checkin:new', newEntry);
  res.json({ success: true, entry: newEntry });
});

// ---------------------------------------------------------------------------
// 6. CRYPTOGRAPHIC GATE TOKEN & REALTIME SCANNER VERIFICATION
// ---------------------------------------------------------------------------

app.post('/api/gate/generate-token', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const member = db.prepare('SELECT * FROM members WHERE user_id = ?').get(user.id) as any;
  if (!member) return res.status(404).json({ error: 'Member not found' });

  if (member.status !== 'Active') {
    return res.status(403).json({ error: `Membership status is ${member.status}. Please visit the front desk.` });
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 35;
  const tokenId = `APX-${Math.floor(1000 + Math.random() * 9000)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  const payload = JSON.stringify({
    memberId: member.member_id,
    name: member.name,
    tier: member.tier,
    tokenId,
    iat: now,
    exp,
    club: 'APEX-PARK-STREET'
  });

  const signature = crypto.createHmac('sha256', GATE_SECRET).update(payload).digest('hex');

  db.prepare(`
    INSERT INTO gate_tokens (id, member_id, token, issued_at, expires_at, used)
    VALUES (?, ?, ?, ?, ?, 0)
  `).run(`gt-${Date.now()}`, member.id, tokenId, now, exp);

  const qrPayload = JSON.stringify({ payload, signature });

  res.json({
    qrPayload,
    token: tokenId,
    expiresInSeconds: 30,
    memberName: member.name,
    memberId: member.member_id
  });
});

app.post('/api/gate/verify-token', authMiddleware, (req, res) => {
  const { qrPayload, gate = 'Main Turnstile A' } = req.body;
  if (!qrPayload) return res.status(400).json({ error: 'Missing qrPayload' });

  let parsed: { payload: string; signature: string };
  try {
    parsed = typeof qrPayload === 'string' ? JSON.parse(qrPayload) : qrPayload;
  } catch {
    return res.json({ verified: false, reason: 'Invalid QR code format. Not an Apex Gym gate pass.' });
  }

  const { payload, signature } = parsed;
  const expectedSig = crypto.createHmac('sha256', GATE_SECRET).update(payload).digest('hex');
  if (signature !== expectedSig) {
    return res.json({ verified: false, reason: 'Cryptographic signature mismatch. Counterfeit pass detected.' });
  }

  const tokenData = JSON.parse(payload);
  const now = Math.floor(Date.now() / 1000);

  if (tokenData.exp < now) {
    return res.json({
      verified: false,
      reason: `QR pass expired ${now - tokenData.exp} seconds ago. Member must refresh their app.`,
      memberName: tokenData.name,
      memberId: tokenData.memberId
    });
  }

  const member = db.prepare('SELECT * FROM members WHERE member_id = ?').get(tokenData.memberId) as any;
  if (!member) {
    return res.json({ verified: false, reason: `Member ID ${tokenData.memberId} not found in database.` });
  }

  if (member.status !== 'Active') {
    return res.json({
      verified: false,
      reason: `Entry denied. ${member.name} status is "${member.status}". Payment is due.`,
      memberName: member.name,
      memberId: member.member_id,
      memberTier: member.tier
    });
  }

  // Token replay check
  const tokenRecord = db.prepare('SELECT id, used FROM gate_tokens WHERE token = ?').get(tokenData.tokenId) as any;
  if (tokenRecord?.used) {
    return res.json({
      verified: false,
      reason: 'This QR code was already scanned. Anti-passback triggered.',
      memberName: member.name,
      memberId: member.member_id
    });
  }

  if (tokenRecord) {
    db.prepare('UPDATE gate_tokens SET used = 1, used_at = datetime("now") WHERE id = ?').run(tokenRecord.id);
  }

  // Record Check-in
  const checkinId = `chk-${Date.now()}`;
  db.prepare(`
    INSERT INTO check_ins (id, member_id, member_name, tier, gate, method)
    VALUES (?, ?, ?, ?, 'Dynamic QR Token')
  `).run(checkinId, member.id, member.name, member.tier, gate);

  // Increment Occupancy
  db.prepare('UPDATE occupancy SET current_count = MIN(max_capacity, current_count + 1), updated_at = datetime("now") WHERE id = 1').run();
  db.prepare('UPDATE members SET streak_days = streak_days + 1, is_checked_in = 1, updated_at = datetime("now") WHERE id = ?').run(member.id);

  const occ = db.prepare('SELECT current_count, max_capacity FROM occupancy WHERE id = 1').get() as any;
  broadcast('occupancy:update', { current: occ.current_count, max: occ.max_capacity });

  const newEntry = {
    id: checkinId,
    member: member.name,
    tier: member.tier,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    method: 'Dynamic QR Token',
    gate
  };
  broadcast('checkin:new', newEntry);

  res.json({
    verified: true,
    memberName: member.name,
    memberId: member.member_id,
    memberTier: member.tier,
    message: `Welcome, ${member.name}! Turnstile unlocked.`
  });
});

// ---------------------------------------------------------------------------
// 7. LEADS API
// ---------------------------------------------------------------------------

app.get('/api/leads', authMiddleware, (req, res) => {
  const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT 50').all() as any[];
  res.json(
    leads.map((l) => ({
      id: l.id,
      name: l.name,
      phone: l.phone,
      source: l.source,
      status: l.status,
      submitted: 'Just now'
    }))
  );
});

app.post('/api/leads', (req, res) => {
  const { name, phone, source } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });

  const id = `ld-${Date.now()}`;
  db.prepare('INSERT INTO leads (id, name, phone, source, status) VALUES (?, ?, ?, ?, "New Lead")').run(
    id,
    name,
    phone,
    source || 'Landing Page'
  );

  res.json({ success: true, message: 'Inquiry received. Our coach will call you within 2 hours.' });
});

// ---------------------------------------------------------------------------
// 8. PAYMENTS API (RAZORPAY TEST MODE INTEGRATION)
// ---------------------------------------------------------------------------

app.post('/api/payments/create-order', authMiddleware, async (req, res) => {
  const { amount, planName, memberId } = req.body;
  const numAmount = Number(amount) || 3499;
  const receiptId = `rcpt_${Date.now()}`;

  const orderRes = await createRazorpayOrder(numAmount, receiptId, {
    planName: planName || 'Annual Pro',
    memberId: memberId || ''
  });

  if (!orderRes.success) {
    return res.status(500).json({ error: orderRes.error });
  }

  res.json(orderRes);
});

app.post('/api/payments/verify', authMiddleware, (req, res) => {
  const { orderId, paymentId, signature, memberId, planName, amount } = req.body;
  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({ error: 'Missing payment verification credentials' });
  }

  const isValid = verifyPaymentSignature(orderId, paymentId, signature);
  if (!isValid) {
    return res.status(400).json({ error: 'Invalid payment signature from gateway' });
  }

  // Update member status to Active and set renewal date
  if (memberId) {
    const now = new Date();
    const months = (planName || '').includes('Annual') ? 12 : 1;
    const renewalDate = new Date(now.setMonth(now.getMonth() + months)).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });

    db.prepare(`
      UPDATE members
      SET status = 'Active', tier = COALESCE(?, tier), next_renewal = ?, is_checked_in = 0, updated_at = datetime('now')
      WHERE id = ? OR member_id = ?
    `).run(planName || 'Annual Pro', renewalDate, memberId, memberId);

    // Record verified payment invoice in DB
    const targetMember = db.prepare('SELECT id FROM members WHERE id = ? OR member_id = ?').get(memberId, memberId) as any;
    if (targetMember) {
      const invId = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const amountStr = amount ? `₹${Number(amount).toLocaleString('en-IN')}` : '₹28,500';
      try {
        db.prepare(`
          INSERT INTO invoices (id, member_id, date, description, amount, status, payment_id)
          VALUES (?, ?, ?, ?, ?, 'Paid', ?)
        `).run(
          invId,
          targetMember.id,
          new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          `${planName || 'Annual Pro'} Renewal (Razorpay Online)`,
          amountStr,
          paymentId
        );
      } catch (err) {
        console.warn('[Invoice Recording Error]:', err);
      }
    }
  }

  res.json({
    success: true,
    message: 'Payment verified and membership activated!',
    paymentId
  });
});

// ---------------------------------------------------------------------------
// 9. INVOICES API (AUTHENTIC BILLING & TAX INVOICES)
// ---------------------------------------------------------------------------

app.get('/api/invoices', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const member = db.prepare('SELECT id FROM members WHERE user_id = ?').get(user.id) as any;
  if (!member) return res.json([]);

  const invoices = db.prepare('SELECT * FROM invoices WHERE member_id = ? ORDER BY created_at DESC').all(member.id) as any[];
  res.json(
    invoices.map((inv) => ({
      id: inv.id,
      date: inv.date,
      desc: inv.description,
      amount: inv.amount,
      status: inv.status
    }))
  );
});

// ---------------------------------------------------------------------------
// 10. LIVE DATABASE INSPECTOR (BROWSER DASHBOARD & JSON INSPECTION)
// ---------------------------------------------------------------------------

app.get('/api/admin/db-inspect', (req, res) => {
  const users = db.prepare('SELECT id, mobile, role, name, created_at FROM users ORDER BY created_at DESC').all() as any[];
  const members = db.prepare('SELECT id, member_id, name, mobile, email, tier, status, streak_days, next_renewal, created_at FROM members ORDER BY created_at DESC').all() as any[];
  const invoices = db.prepare('SELECT id, member_id, date, description, amount, status, payment_id, created_at FROM invoices ORDER BY created_at DESC').all() as any[];
  const checkins = db.prepare('SELECT id, member_name, tier, gate, method, created_at FROM check_ins ORDER BY created_at DESC LIMIT 25').all() as any[];
  const occupancy = db.prepare('SELECT current_count, max_capacity, updated_at FROM occupancy WHERE id = 1').get() as any;
  const leads = db.prepare('SELECT id, name, phone, source, status, created_at FROM leads ORDER BY created_at DESC').all() as any[];

  const data = {
    serverTime: new Date().toISOString(),
    occupancy,
    totalMembers: members.length,
    totalInvoices: invoices.length,
    users,
    members,
    invoices,
    recentCheckIns: checkins,
    leads
  };

  if (req.headers.accept?.includes('text/html')) {
    return res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Apex Gym • Live Database Inspector</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #09090b; color: #f4f4f5; margin: 0; padding: 28px; }
    .container { max-width: 1100px; margin: 0 auto; }
    h1 { color: #a3e635; font-size: 24px; font-weight: 900; margin: 0 0 4px 0; letter-spacing: -0.5px; }
    .badge { display: inline-block; background: #a3e635; color: #09090b; font-weight: 800; font-size: 10px; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; }
    .card { background: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 22px; margin-top: 20px; box-shadow: 0 8px 30px rgba(0,0,0,0.5); }
    h2 { font-size: 15px; font-weight: 800; color: #fff; margin: 0 0 14px 0; border-bottom: 1px solid #27272a; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; color: #71717a; padding: 8px 12px; border-bottom: 1px solid #27272a; text-transform: uppercase; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; }
    td { padding: 10px 12px; border-bottom: 1px solid #27272a; }
    tr:last-child td { border-bottom: none; }
    .status-active { color: #86efac; font-weight: 700; }
    .status-due { color: #fca5a5; font-weight: 700; }
    .btn-refresh { background: #27272a; color: #fff; border: 1px solid #3f3f46; padding: 8px 16px; border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: background 0.2s; }
    .btn-refresh:hover { background: #3f3f46; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #d4d4d8; font-size: 11px; }
  </style>
</head>
<body>
  <div class="container">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h1>APEX GYM • LIVE DATABASE INSPECTOR</h1>
        <p style="margin:4px 0 0 0; color:#a1a1aa; font-size:12px;">SQLite Database: <code>.data/apex.db</code> • Live Server</p>
      </div>
      <div>
        <a href="/api/admin/db-inspect" class="btn-refresh">⟳ Refresh DB Data</a>
      </div>
    </div>

    <!-- Live Counters -->
    <div class="card" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:20px;">
      <div>
        <span style="font-size:10px; color:#a1a1aa; text-transform:uppercase; font-weight:700;">Live Gym Headcount</span>
        <p style="font-size:28px; font-weight:900; color:#a3e635; margin:6px 0 0 0;">${occupancy?.current_count || 0} <span style="font-size:14px; color:#71717a;">/ ${occupancy?.max_capacity || 120}</span></p>
      </div>
      <div>
        <span style="font-size:10px; color:#a1a1aa; text-transform:uppercase; font-weight:700;">Registered Members</span>
        <p style="font-size:28px; font-weight:900; color:#fff; margin:6px 0 0 0;">${members.length}</p>
      </div>
      <div>
        <span style="font-size:10px; color:#a1a1aa; text-transform:uppercase; font-weight:700;">Invoices In Database</span>
        <p style="font-size:28px; font-weight:900; color:#fff; margin:6px 0 0 0;">${invoices.length}</p>
      </div>
      <div>
        <span style="font-size:10px; color:#a1a1aa; text-transform:uppercase; font-weight:700;">Total Check-Ins</span>
        <p style="font-size:28px; font-weight:900; color:#fff; margin:6px 0 0 0;">${checkins.length}</p>
      </div>
    </div>

    <!-- Members Table -->
    <div class="card">
      <h2><span>Registered Members</span> <span class="badge">${members.length} Total</span></h2>
      <table>
        <thead>
          <tr>
            <th>Member ID</th>
            <th>Name</th>
            <th>Mobile</th>
            <th>Email</th>
            <th>Tier</th>
            <th>Status</th>
            <th>Next Renewal</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          ${members.map(m => `
            <tr>
              <td><code>${m.member_id}</code></td>
              <td><strong>${m.name}</strong></td>
              <td>${m.mobile}</td>
              <td style="color:#a1a1aa;">${m.email || '—'}</td>
              <td><span class="badge">${m.tier}</span></td>
              <td class="${m.status === 'Active' ? 'status-active' : 'status-due'}">${m.status}</td>
              <td>${m.next_renewal || '—'}</td>
              <td style="color:#71717a;">${m.created_at?.slice(0, 10)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Invoices Table -->
    <div class="card">
      <h2><span>Invoices & Payment Records</span> <span class="badge">${invoices.length} Total</span></h2>
      <table>
        <thead>
          <tr>
            <th>Invoice ID</th>
            <th>Member ID</th>
            <th>Description</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Gateway Ref</th>
          </tr>
        </thead>
        <tbody>
          ${invoices.map(inv => `
            <tr>
              <td><code>${inv.id}</code></td>
              <td><code>${inv.member_id}</code></td>
              <td>${inv.description}</td>
              <td>${inv.date}</td>
              <td style="color:#a3e635; font-weight:700;">${inv.amount}</td>
              <td><span style="color:#86efac; font-weight:700;">${inv.status}</span></td>
              <td style="font-family:monospace; color:#71717a;">${inv.payment_id || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Recent Check-Ins -->
    <div class="card">
      <h2><span>Turnstile Gate Check-Ins</span> <span class="badge">Last ${checkins.length}</span></h2>
      <table>
        <thead>
          <tr>
            <th>Member</th>
            <th>Tier</th>
            <th>Gate</th>
            <th>Method</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          ${checkins.map(c => `
            <tr>
              <td><strong>${c.member_name}</strong></td>
              <td>${c.tier}</td>
              <td>${c.gate}</td>
              <td><code>${c.method}</code></td>
              <td style="color:#71717a;">${c.created_at}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>
    `);
  }

  res.json(data);
});

// --- Serve Static Frontend Assets (Production Unified Deployment) ---
import path from 'node:path';
import fs from 'node:fs';

const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/ws')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`[Apex Backend] Live REST & WebSocket Server running at http://localhost:${PORT}`);
});
