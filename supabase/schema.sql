-- =============================================================================
-- APEX GYM — V1 PRODUCTION DATABASE SCHEMA
-- Supabase (PostgreSQL) with Row-Level Security
-- =============================================================================

-- 0. Helper: Get the current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid();
$$;

-- 0b. Helper: Check if current user is staff or manager
CREATE OR REPLACE FUNCTION public.is_staff_or_manager()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('staff', 'manager')
  );
$$;

-- =============================================================================
-- 1. USER ROLES — maps auth.users to application roles
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       VARCHAR(32) NOT NULL CHECK (role IN ('member', 'staff', 'manager')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own role; staff/managers can read all roles
CREATE POLICY "Users read own role"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid() OR public.is_staff_or_manager());

-- Only managers can assign/change roles
CREATE POLICY "Managers manage roles"
  ON public.user_roles FOR ALL
  USING (public.get_user_role() = 'manager');

-- =============================================================================
-- 2. MEMBERS — gym member profiles
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.members (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  member_id         VARCHAR(32) UNIQUE NOT NULL,
  name              VARCHAR(255) NOT NULL,
  tier              VARCHAR(64) NOT NULL DEFAULT 'Monthly Pro',
  status            VARCHAR(32) NOT NULL DEFAULT 'Active'
                      CHECK (status IN ('Active', 'Payment Due', 'Expired', 'Frozen')),
  streak_days       INT NOT NULL DEFAULT 0,
  next_renewal      DATE,
  card_last_4       VARCHAR(4),
  is_checked_in     BOOLEAN DEFAULT FALSE,
  mobile            VARCHAR(32) NOT NULL,
  email             VARCHAR(255),
  goal              VARCHAR(128) DEFAULT 'Fitness & Strength',
  home_club         VARCHAR(128) DEFAULT 'Park Street Flagship',
  coach             VARCHAR(128),
  emergency_contact VARCHAR(255),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Members read their own profile; staff/managers read all
CREATE POLICY "Members read own profile"
  ON public.members FOR SELECT
  USING (user_id = auth.uid() OR public.is_staff_or_manager());

-- Members update their own profile
CREATE POLICY "Members update own profile"
  ON public.members FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Staff/managers can update any member (e.g. toggle status)
CREATE POLICY "Staff update members"
  ON public.members FOR UPDATE
  USING (public.is_staff_or_manager());

-- Staff/managers can insert new members
CREATE POLICY "Staff insert members"
  ON public.members FOR INSERT
  WITH CHECK (public.is_staff_or_manager() OR user_id = auth.uid());

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 3. CLASSES — gym class schedule
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.classes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(255) NOT NULL,
  category     VARCHAR(64) NOT NULL DEFAULT 'HIIT',
  trainer      VARCHAR(128) NOT NULL,
  time         VARCHAR(32) NOT NULL,
  duration     VARCHAR(32) NOT NULL DEFAULT '45 min',
  room         VARCHAR(128) NOT NULL DEFAULT 'Main Studio',
  capacity     INT NOT NULL DEFAULT 20,
  booked_count INT NOT NULL DEFAULT 0,
  intensity    VARCHAR(32) NOT NULL DEFAULT 'High'
                 CHECK (intensity IN ('Low', 'Moderate', 'High', 'Extreme')),
  is_active    BOOLEAN DEFAULT TRUE,
  class_date   DATE DEFAULT CURRENT_DATE,
  created_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Everyone can read classes (members need to browse the schedule)
CREATE POLICY "Public read classes"
  ON public.classes FOR SELECT
  USING (true);

-- Only staff/managers can create, update, or delete classes
CREATE POLICY "Staff manage classes"
  ON public.classes FOR INSERT
  WITH CHECK (public.is_staff_or_manager());

CREATE POLICY "Staff update classes"
  ON public.classes FOR UPDATE
  USING (public.is_staff_or_manager());

CREATE POLICY "Staff delete classes"
  ON public.classes FOR DELETE
  USING (public.is_staff_or_manager());

-- =============================================================================
-- 4. CLASS BOOKINGS — many-to-many between members and classes
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.class_bookings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  member_id   UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  is_waitlist BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, member_id)
);

ALTER TABLE public.class_bookings ENABLE ROW LEVEL SECURITY;

-- Members can read their own bookings; staff/managers read all
CREATE POLICY "Read own bookings"
  ON public.class_bookings FOR SELECT
  USING (
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
    OR public.is_staff_or_manager()
  );

-- Members can book for themselves
CREATE POLICY "Members book classes"
  ON public.class_bookings FOR INSERT
  WITH CHECK (
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  );

-- Members can cancel their own bookings
CREATE POLICY "Members cancel bookings"
  ON public.class_bookings FOR DELETE
  USING (
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  );

-- Staff/managers can manage all bookings
CREATE POLICY "Staff manage bookings"
  ON public.class_bookings FOR ALL
  USING (public.is_staff_or_manager());

-- Trigger: auto-increment/decrement booked_count on classes
CREATE OR REPLACE FUNCTION public.update_booked_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NOT NEW.is_waitlist THEN
    UPDATE public.classes SET booked_count = booked_count + 1 WHERE id = NEW.class_id;
  ELSIF TG_OP = 'DELETE' AND NOT OLD.is_waitlist THEN
    UPDATE public.classes SET booked_count = GREATEST(0, booked_count - 1) WHERE id = OLD.class_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER booking_count_trigger
  AFTER INSERT OR DELETE ON public.class_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_booked_count();

-- Constraint: prevent overbooking (non-waitlist bookings cannot exceed capacity)
CREATE OR REPLACE FUNCTION public.check_class_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_booked INT;
  max_cap INT;
BEGIN
  IF NEW.is_waitlist THEN
    RETURN NEW; -- waitlist entries bypass capacity check
  END IF;

  SELECT booked_count, capacity INTO current_booked, max_cap
  FROM public.classes WHERE id = NEW.class_id;

  IF current_booked >= max_cap THEN
    RAISE EXCEPTION 'Class is at full capacity. Join the waitlist instead.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_capacity
  BEFORE INSERT ON public.class_bookings
  FOR EACH ROW EXECUTE FUNCTION public.check_class_capacity();

-- =============================================================================
-- 5. WORKOUTS — member training logs
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.workouts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id  UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  exercise   VARCHAR(128) NOT NULL,
  weight     VARCHAR(64) NOT NULL,
  sets       INT NOT NULL DEFAULT 3,
  reps       INT NOT NULL DEFAULT 10,
  is_pr      BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- Members read/write their own workouts
CREATE POLICY "Members own workouts"
  ON public.workouts FOR SELECT
  USING (
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
    OR public.is_staff_or_manager()
  );

CREATE POLICY "Members insert workouts"
  ON public.workouts FOR INSERT
  WITH CHECK (
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members delete workouts"
  ON public.workouts FOR DELETE
  USING (
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  );

-- =============================================================================
-- 6. CHECK-INS — turnstile gate access log
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.check_ins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   UUID REFERENCES public.members(id) ON DELETE SET NULL,
  member_name VARCHAR(255) NOT NULL,
  tier        VARCHAR(64) NOT NULL,
  gate        VARCHAR(128) DEFAULT 'Main Turnstile A',
  method      VARCHAR(128) DEFAULT 'Dynamic QR Token',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- Everyone can read check-ins (staff need the feed, members see own)
CREATE POLICY "Read check_ins"
  ON public.check_ins FOR SELECT
  USING (true);

-- Only staff/managers and edge functions can insert check-ins
CREATE POLICY "Staff insert check_ins"
  ON public.check_ins FOR INSERT
  WITH CHECK (public.is_staff_or_manager());

-- Service role (edge functions) bypass RLS automatically

-- =============================================================================
-- 7. OCCUPANCY — single-row live headcount
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.occupancy (
  id            INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  current_count INT NOT NULL DEFAULT 0,
  max_capacity  INT NOT NULL DEFAULT 120,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.occupancy ENABLE ROW LEVEL SECURITY;

-- Everyone can read occupancy
CREATE POLICY "Public read occupancy"
  ON public.occupancy FOR SELECT
  USING (true);

-- Only staff/managers can update occupancy
CREATE POLICY "Staff update occupancy"
  ON public.occupancy FOR UPDATE
  USING (public.is_staff_or_manager());

-- Initialize occupancy row
INSERT INTO public.occupancy (id, current_count, max_capacity)
VALUES (1, 0, 120)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 8. LEADS — marketing inquiry / free trial captures
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL,
  phone      VARCHAR(32) NOT NULL,
  email      VARCHAR(255),
  source     VARCHAR(64) DEFAULT 'Landing Page',
  status     VARCHAR(32) DEFAULT 'New Lead',
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Staff/managers can read all leads
CREATE POLICY "Staff read leads"
  ON public.leads FOR SELECT
  USING (public.is_staff_or_manager());

-- Public can insert leads (unauthenticated website visitors)
CREATE POLICY "Public submit leads"
  ON public.leads FOR INSERT
  WITH CHECK (true);

-- Staff can update lead status
CREATE POLICY "Staff update leads"
  ON public.leads FOR UPDATE
  USING (public.is_staff_or_manager());

-- =============================================================================
-- 9. GATE TOKENS — server-issued QR pass tokens for verification
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gate_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id  UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  token      VARCHAR(128) NOT NULL UNIQUE,
  issued_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN DEFAULT FALSE,
  used_at    TIMESTAMPTZ,
  CONSTRAINT token_not_expired CHECK (expires_at > issued_at)
);

ALTER TABLE public.gate_tokens ENABLE ROW LEVEL SECURITY;

-- Members can read their own tokens
CREATE POLICY "Members read own tokens"
  ON public.gate_tokens FOR SELECT
  USING (
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  );

-- Service role (edge functions) handles insert/update — bypasses RLS

-- Auto-cleanup: delete expired tokens older than 1 hour (run via pg_cron or manually)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('cleanup-gate-tokens', '*/15 * * * *',
--   $$DELETE FROM public.gate_tokens WHERE expires_at < NOW() - INTERVAL '1 hour'$$);

-- =============================================================================
-- 10. REALTIME SUBSCRIPTIONS
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.check_ins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.occupancy;
ALTER PUBLICATION supabase_realtime ADD TABLE public.classes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.class_bookings;

-- =============================================================================
-- 11. INDEXES for performance
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_members_user_id ON public.members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_member_id ON public.members(member_id);
CREATE INDEX IF NOT EXISTS idx_members_mobile ON public.members(mobile);
CREATE INDEX IF NOT EXISTS idx_class_bookings_member ON public.class_bookings(member_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_class ON public.class_bookings(class_id);
CREATE INDEX IF NOT EXISTS idx_workouts_member ON public.workouts(member_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_created ON public.check_ins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gate_tokens_token ON public.gate_tokens(token);
CREATE INDEX IF NOT EXISTS idx_gate_tokens_member ON public.gate_tokens(member_id);
CREATE INDEX IF NOT EXISTS idx_gate_tokens_expires ON public.gate_tokens(expires_at);
