-- =============================================================================
-- APEX GYM — RPC FUNCTIONS
-- Server-side Postgres functions called via supabase.rpc()
-- =============================================================================

-- Atomically increment live occupancy count
CREATE OR REPLACE FUNCTION public.increment_occupancy()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.occupancy
  SET current_count = LEAST(current_count + 1, max_capacity),
      updated_at = NOW()
  WHERE id = 1;
END;
$$;

-- Atomically decrement live occupancy count (checkout / end-of-day reset)
CREATE OR REPLACE FUNCTION public.decrement_occupancy()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.occupancy
  SET current_count = GREATEST(current_count - 1, 0),
      updated_at = NOW()
  WHERE id = 1;
END;
$$;

-- Reset occupancy to zero (nightly cron or manual)
CREATE OR REPLACE FUNCTION public.reset_occupancy()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.occupancy
  SET current_count = 0, updated_at = NOW()
  WHERE id = 1;

  -- Also mark all members as checked out
  UPDATE public.members SET is_checked_in = false WHERE is_checked_in = true;
END;
$$;

-- Get the member UUID for the currently authenticated user
CREATE OR REPLACE FUNCTION public.get_my_member_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM public.members WHERE user_id = auth.uid() LIMIT 1;
$$;
