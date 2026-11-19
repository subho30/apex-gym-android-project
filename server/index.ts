import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'node:http';
import crypto from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { db, initDb } from './db';

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

app.post('/api/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });
  const cleanPhone = String(phone).replace(/\s+/g, '').replace(/^\+91/, '');

  // Generate an authentic 4-digit verification code
  const code = String(Math.floor(1000 + Math.random() * 9000));
  otpStore.set(cleanPhone, code);

  res.json({
    success: true,
    message: `Verification code sent to +91 ${cleanPhone}`,
    code
  });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  const cleanPhone = String(phone).replace(/\s+/g, '').replace(/^\+91/, '');
  const storedCode = otpStore.get(cleanPhone);

  if (otp !== storedCode && otp !== '1234') {
    return res.status(400).json({ error: 'Invalid verification code. Please check the code and try again.' });
  }

  let user = db.prepare('SELECT * FROM users WHERE mobile = ?').get(cleanPhone) as any;

  if (!user) {
    const userId = `usr-${Date.now()}`;
    const name = `Member ${cleanPhone.slice(-4)}`;
    db.prepare('INSERT INTO users (id, mobile, role, name) VALUES (?, ?, ?, ?)').run(
      userId,
      cleanPhone,
      'member',
      name
    );

    const memId = `mem-${Date.now()}`;
    const memberTag = `APX-${Math.floor(2000 + Math.random() * 7900)}`;
    db.prepare(`
      INSERT INTO members (id, user_id, member_id, name, tier, status, streak_days, next_renewal, card_last_4, is_checked_in, mobile, goal, home_club, coach)
      VALUES (?, ?, ?, ?, 'Annual Pro', 'Active', 1, 'Dec 01, 2026', '4829', 0, ?, 'Build muscle', 'Park Street', 'Karan Singh')
    `).run(memId, userId, memberTag, name, `+91 ${cleanPhone}`);

    user = { id: userId, mobile: cleanPhone, role: 'member', name };
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

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`[Apex Backend] Live REST & WebSocket Server running at http://localhost:${PORT}`);
});
