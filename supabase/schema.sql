-- APEX GYM SUPABASE DATABASE SCHEMA
-- Realtime-enabled schema for Gym Member Management, Turnstile QR Check-ins, and Class Bookings

-- 1. Members Table
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    member_id VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    tier VARCHAR(64) NOT NULL DEFAULT 'Monthly Pro',
    status VARCHAR(32) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Payment Due', 'Expired', 'Frozen')),
    streak_days INT NOT NULL DEFAULT 0,
    next_renewal DATE,
    card_last_4 VARCHAR(4) DEFAULT '4829',
    is_checked_in BOOLEAN DEFAULT FALSE,
    mobile VARCHAR(32) NOT NULL,
    email VARCHAR(255),
    goal VARCHAR(128) DEFAULT 'Fitness & Strength',
    home_club VARCHAR(128) DEFAULT 'Park Street Flagship',
    coach VARCHAR(128) DEFAULT 'Karan Singh',
    emergency_contact VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Gym Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'HIIT',
    trainer VARCHAR(128) NOT NULL,
    time VARCHAR(32) NOT NULL,
    duration VARCHAR(32) NOT NULL DEFAULT '45 min',
    room VARCHAR(128) NOT NULL DEFAULT 'Main Studio',
    capacity INT NOT NULL DEFAULT 20,
    booked_count INT NOT NULL DEFAULT 0,
    intensity VARCHAR(32) NOT NULL DEFAULT 'High' CHECK (intensity IN ('Low', 'Moderate', 'High', 'Extreme')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Class Bookings (Many-to-Many Join Table)
CREATE TABLE IF NOT EXISTS public.class_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    is_waitlist BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, member_id)
);

-- 4. Workout Logs Table
CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    exercise VARCHAR(128) NOT NULL,
    weight VARCHAR(64) NOT NULL,
    sets INT NOT NULL DEFAULT 3,
    reps INT NOT NULL DEFAULT 10,
    is_pr BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Turnstile Check-in Feed Table
CREATE TABLE IF NOT EXISTS public.check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    member_name VARCHAR(255) NOT NULL,
    tier VARCHAR(64) NOT NULL,
    gate VARCHAR(128) DEFAULT 'Front Desk Scanner',
    method VARCHAR(128) DEFAULT 'Dynamic QR Token',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Leads & Free Passes Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    source VARCHAR(64) DEFAULT 'Landing Page',
    status VARCHAR(32) DEFAULT 'New Lead',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Realtime Occupancy Table (Single Row)
CREATE TABLE IF NOT EXISTS public.occupancy (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    current_count INT NOT NULL DEFAULT 64,
    max_capacity INT NOT NULL DEFAULT 120,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupancy ENABLE ROW LEVEL SECURITY;

-- Setup public read policies for classes and occupancy
CREATE POLICY "Public read classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Public read occupancy" ON public.occupancy FOR SELECT USING (true);
CREATE POLICY "Public read check_ins" ON public.check_ins FOR SELECT USING (true);

-- Enable Realtime publication for turnstile and occupancy
ALTER PUBLICATION supabase_realtime ADD TABLE public.check_ins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.occupancy;
ALTER PUBLICATION supabase_realtime ADD TABLE public.classes;
