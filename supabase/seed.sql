-- =============================================================================
-- APEX GYM — SEED DATA FOR DEVELOPMENT & DEMO
-- Run after schema.sql to populate the database with realistic demo data
-- =============================================================================

-- NOTE: In production, members are created via the auth flow.
-- This seed data uses NULL user_id since there are no auth.users yet.
-- After a user signs up via phone OTP, their user_id is linked to the member row.

-- 1. SEED MEMBERS
INSERT INTO public.members (member_id, name, tier, status, streak_days, next_renewal, card_last_4, is_checked_in, mobile, email, goal, home_club, coach, emergency_contact) VALUES
  ('APX-2041', 'Rohan Sharma',  'Annual Pro',    'Active',      14, '2026-12-01', '4829', true,  '+91 98300 10001', 'rohan.sharma@example.com',  'Build muscle',           'Park Street', 'Karan Singh',   'Meera Sharma · +91 98300 20002'),
  ('APX-1088', 'Priya Nair',    'Monthly Pro',   'Active',       9, '2026-11-28', '1092', true,  '+91 98300 10002', 'priya.nair@example.com',    'Weight Loss',            'Park Street', 'Neha Kapoor',   'Sunil Nair · +91 98300 20003'),
  ('APX-3012', 'Kabir Khan',    'Annual Pro',    'Active',      22, '2027-01-15', '9912', false, '+91 98300 10003', 'kabir.khan@example.com',    'Athletic Conditioning',  'Park Street', 'Karan Singh',   'Ayesha Khan · +91 98300 20004'),
  ('APX-4105', 'Ananya Iyer',   'Monthly Basic', 'Payment Due',  3, '2026-11-05', '5511', false, '+91 98300 10004', 'ananya.iyer@example.com',   'Yoga & Mobility',        'Park Street', 'Ritu Bansal',   'V. Iyer · +91 98300 20005'),
  ('APX-5200', 'Dev Patel',     'Annual Pro',    'Active',      45, '2027-03-01', '7788', false, '+91 98300 10005', 'dev.patel@example.com',     'Powerlifting',           'Park Street', 'Imran Qureshi', 'S. Patel · +91 98300 20006'),
  ('APX-6010', 'Isha Banerjee', 'Monthly Pro',   'Active',       6, '2026-12-15', '3344', false, '+91 98300 10006', 'isha.banerjee@example.com', 'Functional Fitness',     'Park Street', 'Vikram Seth',   'R. Banerjee · +91 98300 20007')
ON CONFLICT (member_id) DO NOTHING;

-- 2. SEED CLASSES
INSERT INTO public.classes (id, title, category, trainer, time, duration, room, capacity, booked_count, intensity) VALUES
  (gen_random_uuid(), 'Metcon Burn HIIT',              'HIIT',              'Karan Singh',   '06:00 AM', '45 min', 'Turf Zone A',    20, 18, 'High'),
  (gen_random_uuid(), 'Olympic Lifting & Power',       'Strength',          'Neha Kapoor',   '07:30 AM', '60 min', 'Platform Bay',   12, 11, 'Extreme'),
  (gen_random_uuid(), 'Surya Namaskar & Power Yoga',   'Yoga',              'Ritu Bansal',   '09:00 AM', '50 min', 'Yoga Studio',    15, 15, 'Moderate'),
  (gen_random_uuid(), '1-on-1 Hypertrophy Assessment', 'Personal Training', 'Imran Qureshi', '06:00 PM', '60 min', 'Private Bay 2',   1,  0, 'High'),
  (gen_random_uuid(), 'Functional Calisthenics',       'Strength',          'Vikram Seth',   '07:00 PM', '45 min', 'Rig Zone',       16,  9, 'High')
ON CONFLICT DO NOTHING;

-- 3. SEED OCCUPANCY
INSERT INTO public.occupancy (id, current_count, max_capacity)
VALUES (1, 64, 120)
ON CONFLICT (id) DO UPDATE SET current_count = 64;

-- 4. SEED CHECK-IN FEED
INSERT INTO public.check_ins (member_name, tier, gate, method) VALUES
  ('Rohan Sharma', 'Annual Pro',  'Main Turnstile A', 'Dynamic QR Token'),
  ('Priya Nair',   'Monthly Pro', 'Main Turnstile B', 'Dynamic QR Token'),
  ('Aditya Rao',   'Annual Pro',  'Main Turnstile A', 'Dynamic QR Token'),
  ('Meera Joshi',  'Staff Pass',  'Staff Lane',       'NFC Badge');

-- 5. SEED LEADS
INSERT INTO public.leads (name, phone, source, status) VALUES
  ('Tanvi Sen',      '+91 98311 44550', 'Instagram Ad',   'Booked Free Trial'),
  ('Aakash Roy',     '+91 98302 99881', 'Walk-in Inquiry', 'Demo Scheduled'),
  ('Debolina Dutta', '+91 98310 11223', 'Google Maps',    'Pending Call');
