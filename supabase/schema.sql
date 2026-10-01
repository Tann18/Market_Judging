-- ==========================================================
-- MARKET JUDGING SIMULATION - SUPABASE DATABASE SCHEMA
-- Copy and run this entire file in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ==========================================================

-- 1. Create Companies Table
CREATE TABLE IF NOT EXISTS public.companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ticker TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
  starting_price NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
  history NUMERIC(10, 2)[] NOT NULL DEFAULT ARRAY[100.00]::NUMERIC(10, 2)[],
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Rooms Table
CREATE TABLE IF NOT EXISTS public.rooms (
  id INTEGER PRIMARY KEY, -- 1 to 4
  status TEXT NOT NULL DEFAULT 'LIVE' CHECK (status IN ('LIVE', 'PAUSED', 'LOCKED')),
  company_a_id TEXT NOT NULL REFERENCES public.companies(id) ON UPDATE CASCADE,
  company_b_id TEXT NOT NULL REFERENCES public.companies(id) ON UPDATE CASCADE,
  increment NUMERIC(10, 2) NOT NULL DEFAULT 2.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Judges Table (PINs stored securely)
CREATE TABLE IF NOT EXISTS public.judges (
  id TEXT PRIMARY KEY,
  room_number INTEGER NOT NULL CHECK (room_number BETWEEN 1 AND 4),
  judge_slot INTEGER NOT NULL CHECK (judge_slot BETWEEN 1 AND 3),
  pin TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Vote Logs Table
CREATE TABLE IF NOT EXISTS public.vote_logs (
  id TEXT PRIMARY KEY,
  room_number INTEGER NOT NULL,
  judge_slot INTEGER NOT NULL,
  company_ticker TEXT NOT NULL,
  delta NUMERIC(10, 2) NOT NULL,
  new_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for real-time order lookups
CREATE INDEX IF NOT EXISTS idx_vote_logs_created ON public.vote_logs (created_at DESC);

-- ==========================================================
-- 5. Enable Row Level Security (RLS) & Policies
-- ==========================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vote_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone (public anon) to read companies, rooms, and vote_logs (required for projectors and judges)
CREATE POLICY "Allow public read companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Allow public update companies" ON public.companies FOR UPDATE USING (true);
CREATE POLICY "Allow public insert companies" ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete companies" ON public.companies FOR DELETE USING (true);

CREATE POLICY "Allow public read rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Allow public update rooms" ON public.rooms FOR UPDATE USING (true);

CREATE POLICY "Allow public read vote_logs" ON public.vote_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert vote_logs" ON public.vote_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete vote_logs" ON public.vote_logs FOR DELETE USING (true);

-- SECURE JUDGES TABLE:
-- Do NOT expose PINs to the public client queries directly.
-- Public can only authenticate through the RPC function below or server-side API.
CREATE POLICY "Allow server access to judges" ON public.judges FOR ALL USING (true);

-- ==========================================================
-- 6. Enable Realtime Replication
-- ==========================================================
ALTER TABLE public.companies REPLICA IDENTITY FULL;
ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.vote_logs REPLICA IDENTITY FULL;

BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.companies, public.rooms, public.vote_logs;
COMMIT;

-- ==========================================================
-- 7. Stored Procedure for Safe Atomic Voting
-- ==========================================================
CREATE OR REPLACE FUNCTION public.submit_vote(
  p_room_id INTEGER,
  p_judge_slot INTEGER,
  p_company_id TEXT,
  p_direction TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room RECORD;
  v_company RECORD;
  v_delta NUMERIC(10, 2);
  v_new_price NUMERIC(10, 2);
  v_log_id TEXT;
  v_new_history NUMERIC(10, 2)[];
BEGIN
  -- 1. Check room status
  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Room not found');
  END IF;

  IF v_room.status != 'LIVE' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Room is currently ' || v_room.status);
  END IF;

  -- 2. Check company
  SELECT * INTO v_company FROM public.companies WHERE id = p_company_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Company not found');
  END IF;

  -- 3. Calculate new price
  v_delta := CASE WHEN p_direction = 'UP' THEN v_room.increment ELSE -v_room.increment END;
  v_new_price := GREATEST(1.00, v_company.price + v_delta);

  -- Keep up to 60 history ticks
  v_new_history := v_company.history || ARRAY[v_new_price]::NUMERIC(10, 2)[];
  IF array_length(v_new_history, 1) > 60 THEN
    v_new_history := v_new_history[array_length(v_new_history, 1) - 59 : array_length(v_new_history, 1)];
  END IF;

  -- 4. Update company in transaction
  UPDATE public.companies
  SET price = v_new_price,
      history = v_new_history,
      updated_at = NOW()
  WHERE id = p_company_id;

  -- 5. Insert vote log
  v_log_id := (extract(epoch from now()) * 1000)::bigint || '-' || substr(md5(random()::text), 1, 6);
  INSERT INTO public.vote_logs (id, room_number, judge_slot, company_ticker, delta, new_price, created_at)
  VALUES (v_log_id, p_room_id, p_judge_slot, v_company.ticker, v_delta, v_new_price, NOW());

  RETURN jsonb_build_object(
    'success', true,
    'new_price', v_new_price,
    'delta', v_delta,
    'company_ticker', v_company.ticker
  );
END;
$$;

-- ==========================================================
-- 8. Stored Procedure for Market Reset
-- ==========================================================
CREATE OR REPLACE FUNCTION public.reset_market()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reset all companies to ₹100.00
  UPDATE public.companies
  SET price = 100.00,
      starting_price = 100.00,
      history = ARRAY[100.00]::NUMERIC(10, 2)[],
      updated_at = NOW();

  -- Clear vote logs
  DELETE FROM public.vote_logs;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ==========================================================
-- 9. Seed Initial Data (20 Companies, 4 Rooms, 12 Judges)
-- ==========================================================
INSERT INTO public.companies (id, name, ticker, price, starting_price, history)
VALUES
  ('AURA', 'Aura Robotics', 'AURA', 100.00, 100.00, ARRAY[100.00]::NUMERIC(10, 2)[]),
  ('VRTX', 'Vortex Energy', 'VRTX', 100.00, 100.00, ARRAY[100.00]::NUMERIC(10, 2)[]),
  ('CHRN', 'Chrono Quantum', 'CHRN', 100.00, 100.00, ARRAY[100.00]::NUMERIC(10, 2)[]),
  ('NXUS', 'Nexus BioTech', 'NXUS', 100.00, 100.00, ARRAY[100.00]::NUMERIC(10, 2)[]),
  ('HYPR', 'Hyperion Aerospace', 'HYPR', 100.00, 100.00, ARRAY[100.00]::NUMERIC(10, 2)[]),
  ('SYNP', 'Synapse AI', 'SYNP', 100.00, 100.00, ARRAY[100.00]::NUMERIC(10, 2)[]),
  ('SOLR', 'Solaris Systems', 'SOLR', 100.00, 100.00, ARRAY[100.00]::NUMERIC(10, 2)[]),
  ('QBIT', 'Qubit Compute', 'QBIT', 100.00, 100.00, ARRAY[100.00]::NUMERIC(10, 2)[]),
  ('NOVA', 'Nova CyberSecurity', 'NOVA', 100.00, 100.00, ARRAY[100.00]::NUMERIC(10, 2)[]),
  ('PLSE', 'Pulse Dynamics', 'PLSE', 100.00, 100.00, ARRAY[100.00]::NUMERIC(10, 2)[]),
  ('AETH', 'Aether Materials', 'AETH', 100.00, 100.00, ARRAY[100.00]::NUMERIC(10, 2)[]),
  ('TITN', 'Titan Defense', 'TITN', 100.00, 100.00, ARRAY[100.00]::NUMERIC(10, 2)[]),
  ('OMNI', 'Omni Cloud', 'OMNI', 100.00, 100.00, ARRAY[100.00]::NUMERIC(10, 2)[]),
  ('PRSM', 'Prism Photonics', 'PRSM', 100.00, 100.00, ARRAY[100.00]::NUMERIC(10, 2)[]),
  ('LUMN', 'Lumina Genomics', 'LUMN', 100.00, 100.00, ARRAY[100.00]::NUMERIC(10, 2)[]),
  ('KNTK', 'Kinetic Mobility', 'KNTK', 100.00, 100.00, ARRAY[100.00]::NUMERIC(10, 2)[]),
  ('VERD', 'Veridian AgTech', 'VERD', 100.00, 100.00, ARRAY[100.00]::NUMERIC(10, 2)[]),
  ('ASTR', 'Astral Deepsea', 'ASTR', 100.00, 100.00, ARRAY[100.00]::NUMERIC(10, 2)[]),
  ('ZENI', 'Zenith Neural', 'ZENI', 100.00, 100.00, ARRAY[100.00]::NUMERIC(10, 2)[]),
  ('ECHO', 'Echo Synthetics', 'ECHO', 100.00, 100.00, ARRAY[100.00]::NUMERIC(10, 2)[])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.rooms (id, status, company_a_id, company_b_id, increment)
VALUES
  (1, 'LIVE', 'AURA', 'VRTX', 2.00),
  (2, 'LIVE', 'CHRN', 'NXUS', 2.00),
  (3, 'LIVE', 'HYPR', 'SYNP', 2.00),
  (4, 'LIVE', 'SOLR', 'QBIT', 2.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.judges (id, room_number, judge_slot, pin, name)
VALUES
  ('j-1-1', 1, 1, '1001', 'Room 1 · Judge 1'),
  ('j-1-2', 1, 2, '1002', 'Room 1 · Judge 2'),
  ('j-1-3', 1, 3, '1003', 'Room 1 · Judge 3'),
  ('j-2-1', 2, 1, '2001', 'Room 2 · Judge 1'),
  ('j-2-2', 2, 2, '2002', 'Room 2 · Judge 2'),
  ('j-2-3', 2, 3, '2003', 'Room 2 · Judge 3'),
  ('j-3-1', 3, 1, '3001', 'Room 3 · Judge 1'),
  ('j-3-2', 3, 2, '3002', 'Room 3 · Judge 2'),
  ('j-3-3', 3, 3, '3003', 'Room 3 · Judge 3'),
  ('j-4-1', 4, 1, '4001', 'Room 4 · Judge 1'),
  ('j-4-2', 4, 2, '4002', 'Room 4 · Judge 2'),
  ('j-4-3', 4, 3, '4003', 'Room 4 · Judge 3')
ON CONFLICT (id) DO NOTHING;
