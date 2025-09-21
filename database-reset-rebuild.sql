-- COMPLETE DATABASE RESET AND REBUILD SCRIPT
-- This script will clean everything and rebuild from scratch

-- ============================================================================
-- STEP 1: CLEAN SLATE - Remove everything that might cause issues
-- ============================================================================

-- Disable all RLS first
ALTER TABLE IF EXISTS public.matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.match_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.games DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.game_modes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_wallets DISABLE ROW LEVEL SECURITY;

-- Drop all functions (every possible variant)
DROP FUNCTION IF EXISTS public.create_challenge CASCADE;
DROP FUNCTION IF EXISTS create_challenge CASCADE;
DROP FUNCTION IF EXISTS public.create_match_with_escrow CASCADE;
DROP FUNCTION IF EXISTS public.process_wallet_transaction CASCADE;
DROP FUNCTION IF EXISTS public.get_live_matches CASCADE;
DROP FUNCTION IF EXISTS public.test_matches_access CASCADE;

-- Drop all existing tables (in correct order to handle dependencies)
DROP TABLE IF EXISTS public.match_participants CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.user_wallets CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.game_modes CASCADE;
DROP TABLE IF EXISTS public.games CASCADE;

-- ============================================================================
-- STEP 2: CREATE CORE TABLES WITH SIMPLE STRUCTURE
-- ============================================================================

-- Games table
CREATE TABLE public.games (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    image_url text,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Game modes table
CREATE TABLE public.game_modes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id uuid REFERENCES public.games(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    max_players integer DEFAULT 2,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username text UNIQUE,
    display_name text,
    avatar_url text,
    bio text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- User wallets table (simplified)
CREATE TABLE public.user_wallets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    balance numeric(10,2) DEFAULT 0.00,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Matches table (core functionality)
CREATE TABLE public.matches (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    opponent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id uuid REFERENCES public.games(id),
    game_mode_id uuid REFERENCES public.game_modes(id),
    format text DEFAULT '1v1', -- '1v1', '2v2', '3v3', '5v5'
    map_name text,
    stake_amount numeric(10,2) DEFAULT 0.00,
    duration_minutes integer DEFAULT 60,
    custom_rules text,
    status text DEFAULT 'awaiting_opponent', -- 'awaiting_opponent', 'in_progress', 'completed', 'cancelled'
    winner_id uuid REFERENCES auth.users(id),
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Match participants (for team matches)
CREATE TABLE public.match_participants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id uuid REFERENCES public.matches(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    team text DEFAULT 'A', -- 'A' or 'B'
    role text DEFAULT 'member', -- 'captain', 'member'
    joined_at timestamptz DEFAULT now(),
    UNIQUE(match_id, user_id)
);

-- Transactions table (simplified)
CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    amount numeric(10,2) NOT NULL,
    type text NOT NULL, -- 'deposit', 'withdrawal', 'match_win', 'match_loss'
    reference_code text,
    description text,
    status text DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_matches_creator ON public.matches(creator_id);
CREATE INDEX idx_matches_opponent ON public.matches(opponent_id);
CREATE INDEX idx_matches_game ON public.matches(game_id);
CREATE INDEX idx_matches_created_at ON public.matches(created_at DESC);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_match_participants_match ON public.match_participants(match_id);

-- ============================================================================
-- STEP 4: ENABLE RLS WITH SIMPLE, SAFE POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Games and game modes (public read, admin write)
CREATE POLICY "Games are viewable by everyone" ON public.games
    FOR SELECT USING (true);

CREATE POLICY "Game modes are viewable by everyone" ON public.game_modes
    FOR SELECT USING (true);

-- Matches policies (simple and safe)
CREATE POLICY "Matches are viewable by everyone" ON public.matches
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create matches" ON public.matches
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Match participants can update matches" ON public.matches
    FOR UPDATE USING (auth.uid() = creator_id OR auth.uid() = opponent_id);

-- Match participants policies
CREATE POLICY "Match participants are viewable by everyone" ON public.match_participants
    FOR SELECT USING (true);

CREATE POLICY "Users can join matches" ON public.match_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User wallets policies (private)
CREATE POLICY "Users can view their own wallet" ON public.user_wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wallet" ON public.user_wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON public.user_wallets
    FOR UPDATE USING (auth.uid() = user_id);

-- Transactions policies (private)
CREATE POLICY "Users can view their own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- STEP 5: INSERT SAMPLE DATA
-- ============================================================================

-- Insert sample games
INSERT INTO public.games (id, name, description, image_url) VALUES
    (gen_random_uuid(), 'Counter-Strike 2', 'Tactical first-person shooter', 'https://example.com/cs2.jpg'),
    (gen_random_uuid(), 'Valorant', 'Character-based tactical shooter', 'https://example.com/valorant.jpg'),
    (gen_random_uuid(), 'League of Legends', 'Multiplayer online battle arena', 'https://example.com/lol.jpg');

-- Insert sample game modes
INSERT INTO public.game_modes (game_id, name, description, max_players) 
SELECT 
    g.id,
    mode.name,
    mode.description,
    mode.max_players
FROM public.games g
CROSS JOIN (VALUES 
    ('Competitive', '5v5 competitive match', 10),
    ('Casual', 'Casual gameplay', 10),
    ('1v1', 'One versus one', 2),
    ('2v2', 'Two versus two', 4)
) AS mode(name, description, max_players);

-- ============================================================================
-- STEP 6: GRANT PERMISSIONS
-- ============================================================================

-- Grant basic permissions to authenticated users
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.matches TO authenticated;
GRANT ALL ON public.match_participants TO authenticated;
GRANT ALL ON public.user_wallets TO authenticated;
GRANT ALL ON public.transactions TO authenticated;
GRANT SELECT ON public.games TO authenticated;
GRANT SELECT ON public.game_modes TO authenticated;

-- Grant read permissions to anonymous users
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.matches TO anon;
GRANT SELECT ON public.match_participants TO anon;
GRANT SELECT ON public.games TO anon;
GRANT SELECT ON public.game_modes TO anon;

-- ============================================================================
-- STEP 7: CREATE SIMPLE HELPER FUNCTIONS (OPTIONAL)
-- ============================================================================

-- Simple function to get live matches (no complex logic)
CREATE OR REPLACE FUNCTION public.get_live_matches()
RETURNS SETOF public.matches
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT * FROM public.matches 
    WHERE status IN ('awaiting_opponent', 'in_progress')
    ORDER BY created_at DESC
    LIMIT 20;
$$;

-- Function to automatically create user wallet on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, username, display_name)
    VALUES (NEW.id, NEW.email, NEW.email);
    
    INSERT INTO public.user_wallets (user_id, balance)
    VALUES (NEW.id, 1000.00); -- Give new users $1000 starting balance
    
    RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_live_matches TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_live_matches TO anon;