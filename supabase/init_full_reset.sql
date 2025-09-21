-- ============================================================================
-- Clean reset + full setup for Tacktix Arena (Supabase) - corrected order
-- WARNING: This drops and recreates tables in the public schema. Use for dev.
-- ============================================================================

-- 0) Extensions
create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- 1) Disable RLS on known tables (if they exist), drop policies, then drop objects

-- Disable RLS to avoid policy conflicts on drop
DO $$
BEGIN
  IF to_regclass('public.matches') IS NOT NULL THEN
    EXECUTE 'alter table public.matches disable row level security';
  END IF;
  IF to_regclass('public.match_participants') IS NOT NULL THEN
    EXECUTE 'alter table public.match_participants disable row level security';
  END IF;
  IF to_regclass('public.profiles') IS NOT NULL THEN
    EXECUTE 'alter table public.profiles disable row level security';
  END IF;
  IF to_regclass('public.games') IS NOT NULL THEN
    EXECUTE 'alter table public.games disable row level security';
  END IF;
  IF to_regclass('public.game_modes') IS NOT NULL THEN
    EXECUTE 'alter table public.game_modes disable row level security';
  END IF;
  IF to_regclass('public.transactions') IS NOT NULL THEN
    EXECUTE 'alter table public.transactions disable row level security';
  END IF;
  IF to_regclass('public.user_wallets') IS NOT NULL THEN
    EXECUTE 'alter table public.user_wallets disable row level security';
  END IF;
  IF to_regclass('public.tournaments') IS NOT NULL THEN
    EXECUTE 'alter table public.tournaments disable row level security';
  END IF;
  IF to_regclass('public.tournament_participants') IS NOT NULL THEN
    EXECUTE 'alter table public.tournament_participants disable row level security';
  END IF;
  IF to_regclass('public.achievements') IS NOT NULL THEN
    EXECUTE 'alter table public.achievements disable row level security';
  END IF;
  IF to_regclass('public.user_achievements') IS NOT NULL THEN
    EXECUTE 'alter table public.user_achievements disable row level security';
  END IF;
  IF to_regclass('public.user_roles') IS NOT NULL THEN
    EXECUTE 'alter table public.user_roles disable row level security';
  END IF;
  IF to_regclass('public.gamer_tags') IS NOT NULL THEN
    EXECUTE 'alter table public.gamer_tags disable row level security';
  END IF;
END$$;

-- Drop helper functions and triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.get_live_matches CASCADE;

-- Drop tables in dependency-safe order
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.gamer_tags CASCADE;
DROP TABLE IF EXISTS public.match_participants CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.user_wallets CASCADE;
DROP TABLE IF EXISTS public.tournament_participants CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.tournaments CASCADE;
DROP TABLE IF EXISTS public.game_modes CASCADE;
DROP TABLE IF EXISTS public.games CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop enum types last
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN EXECUTE 'drop type public.app_role'; END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_status') THEN EXECUTE 'drop type public.match_status'; END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_result') THEN EXECUTE 'drop type public.match_result'; END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tournament_status') THEN EXECUTE 'drop type public.tournament_status'; END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN EXECUTE 'drop type public.transaction_status'; END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN EXECUTE 'drop type public.transaction_type'; END IF;
END$$;

-- 2) Enums (align with src/integrations/supabase/types.ts)
CREATE TYPE public.app_role AS ENUM ('user', 'admin');
CREATE TYPE public.match_result AS ENUM ('win', 'loss', 'draw');
CREATE TYPE public.match_status AS ENUM (
  'awaiting_opponent',
  'in_progress',
  'pending_result',
  'completed',
  'cancelled',
  'disputed'
);
CREATE TYPE public.tournament_status AS ENUM ('registration', 'full', 'live', 'completed', 'cancelled');
CREATE TYPE public.transaction_status AS ENUM ('pending','completed','failed','cancelled');
CREATE TYPE public.transaction_type AS ENUM ('deposit','withdrawal','match_win','match_loss','tournament_entry','tournament_prize','refund');

-- 3) Tables

-- games
CREATE TABLE public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text NOT NULL,
  description text,
  cover_image_url text,
  is_active boolean NOT NULL DEFAULT true,
  min_stake numeric(10,2) NOT NULL DEFAULT 0.00,
  max_stake numeric(10,2) NOT NULL DEFAULT 1000000.00,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS games_name_key ON public.games(lower(name));

-- game_modes
CREATE TABLE public.game_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  formats text[] NOT NULL DEFAULT array['1v1']::text[],
  maps text[] NULL,
  is_active boolean NOT NULL DEFAULT true,
  min_stake numeric(10,2) NOT NULL DEFAULT 0.00,
  max_stake numeric(10,2) NOT NULL DEFAULT 1000000.00,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS game_modes_game_id_idx ON public.game_modes(game_id);

-- profiles (extends auth.users)
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);

-- user_wallets
CREATE TABLE public.user_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric(12,2) NOT NULL DEFAULT 0.00,
  total_deposited numeric(12,2) NOT NULL DEFAULT 0.00,
  total_withdrawn numeric(12,2) NOT NULL DEFAULT 0.00,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_wallets_user_id_idx ON public.user_wallets(user_id);

-- IMPORTANT: tournaments BEFORE matches
CREATE TABLE public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES public.games(id),
  game_mode_id uuid NOT NULL REFERENCES public.game_modes(id),
  name text NOT NULL,
  description text NULL,
  format text NOT NULL,
  prize_pool numeric(12,2) NOT NULL DEFAULT 0,
  winner_prize numeric(12,2) NULL,
  entry_fee numeric(12,2) NOT NULL DEFAULT 0,
  max_participants integer NOT NULL,
  current_participants integer NOT NULL DEFAULT 0,
  start_date timestamptz NOT NULL,
  end_date timestamptz NULL,
  status public.tournament_status NOT NULL DEFAULT 'registration',
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tournaments_status_idx ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS tournaments_start_date_idx ON public.tournaments(start_date);

-- matches
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  game_id uuid NOT NULL REFERENCES public.games(id),
  game_mode_id uuid NOT NULL REFERENCES public.game_modes(id),
  format text NOT NULL DEFAULT '1v1',
  map_name text NULL,
  stake_amount numeric(12,2) NOT NULL DEFAULT 0.00,
  duration_minutes integer NULL,
  custom_rules text NULL,
  status public.match_status NOT NULL DEFAULT 'awaiting_opponent',
  admin_decision text NULL,
  creator_result public.match_result NULL,
  opponent_result public.match_result NULL,
  winner_id uuid NULL REFERENCES auth.users(id),
  tournament_id uuid NULL REFERENCES public.tournaments(id),
  accepted_at timestamptz NULL,
  started_at timestamptz NULL,
  completed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS matches_status_idx ON public.matches(status);
CREATE INDEX IF NOT EXISTS matches_creator_idx ON public.matches(creator_id);
CREATE INDEX IF NOT EXISTS matches_opponent_idx ON public.matches(opponent_id);
CREATE INDEX IF NOT EXISTS matches_game_idx ON public.matches(game_id);
CREATE INDEX IF NOT EXISTS matches_created_at_idx ON public.matches(created_at DESC);

-- match_participants
CREATE TABLE public.match_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team text NOT NULL DEFAULT 'A' CHECK (team IN ('A','B')),
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('captain','member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, user_id)
);
CREATE INDEX IF NOT EXISTS match_participants_match_idx ON public.match_participants(match_id);
CREATE INDEX IF NOT EXISTS match_participants_user_idx ON public.match_participants(user_id);

-- transactions
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  type public.transaction_type NOT NULL,
  reference_code text NOT NULL,
  description text NULL,
  status public.transaction_status NOT NULL DEFAULT 'pending',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS transactions_user_idx ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON public.transactions(created_at DESC);

-- tournament_participants
CREATE TABLE public.tournament_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, user_id)
);
CREATE INDEX IF NOT EXISTS tournament_participants_tournament_idx ON public.tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS tournament_participants_user_idx ON public.tournament_participants(user_id);

-- achievements
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- user_achievements
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

-- user_roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- gamer_tags
CREATE TABLE public.gamer_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  gamer_tag text NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_id)
);

-- 4) updated_at trigger utility
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach updated_at triggers
CREATE TRIGGER set_updated_at_games BEFORE UPDATE ON public.games
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_game_modes BEFORE UPDATE ON public.game_modes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_user_wallets BEFORE UPDATE ON public.user_wallets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_matches BEFORE UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_transactions BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_tournaments BEFORE UPDATE ON public.tournaments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_gamer_tags BEFORE UPDATE ON public.gamer_tags
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5) RLS and policies

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamer_tags ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "users insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Games & Modes (public read)
CREATE POLICY "games are viewable by everyone"
  ON public.games FOR SELECT USING (true);
CREATE POLICY "game modes are viewable by everyone"
  ON public.game_modes FOR SELECT USING (true);

-- Matches
CREATE POLICY "matches are viewable by everyone"
  ON public.matches FOR SELECT USING (true);
CREATE POLICY "authenticated users can create matches"
  ON public.matches FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "creator or opponent can update matches"
  ON public.matches FOR UPDATE USING (auth.uid() = creator_id OR auth.uid() = opponent_id);

-- Match participants
CREATE POLICY "match participants are viewable by everyone"
  ON public.match_participants FOR SELECT USING (true);
CREATE POLICY "users can join matches as themselves"
  ON public.match_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User wallets (private)
CREATE POLICY "users view their own wallet"
  ON public.user_wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users create their own wallet"
  ON public.user_wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update their own wallet"
  ON public.user_wallets FOR UPDATE USING (auth.uid() = user_id);

-- Transactions (private)
CREATE POLICY "users view their own transactions"
  ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users create their own transactions"
  ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tournaments (public read; creators manage their own)
CREATE POLICY "tournaments are viewable by everyone"
  ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "authenticated users can create tournaments"
  ON public.tournaments FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "creator can update their tournaments"
  ON public.tournaments FOR UPDATE USING (auth.uid() = created_by);

-- Tournament participants
CREATE POLICY "tournament participants are viewable by everyone"
  ON public.tournament_participants FOR SELECT USING (true);
CREATE POLICY "users can register themselves to a tournament"
  ON public.tournament_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Achievements (public read)
CREATE POLICY "achievements are viewable by everyone"
  ON public.achievements FOR SELECT USING (true);

-- User achievements (owner-only)
CREATE POLICY "users view their own achievements"
  ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users add their own achievements"
  ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles (read own)
CREATE POLICY "users view their own role"
  ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Gamer tags (public read; owner writes)
CREATE POLICY "gamer tags are viewable by everyone"
  ON public.gamer_tags FOR SELECT USING (true);
CREATE POLICY "users manage their own gamer tags"
  ON public.gamer_tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update their own gamer tags"
  ON public.gamer_tags FOR UPDATE USING (auth.uid() = user_id);

-- 6) Grants (Supabase roles)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.games TO anon, authenticated;
GRANT SELECT ON public.game_modes TO anon, authenticated;
GRANT SELECT ON public.matches TO anon, authenticated;
GRANT SELECT ON public.match_participants TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;

GRANT ALL ON public.tournaments TO authenticated;
GRANT ALL ON public.tournament_participants TO authenticated;

GRANT ALL ON public.matches TO authenticated;
GRANT ALL ON public.match_participants TO authenticated;
GRANT ALL ON public.user_wallets TO authenticated;
GRANT ALL ON public.transactions TO authenticated;

-- 7) Helper functions (optional but used/handy)

-- Live matches feed
CREATE OR REPLACE FUNCTION public.get_live_matches()
RETURNS SETOF public.matches
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT *
  FROM public.matches
  WHERE status IN ('awaiting_opponent','in_progress')
  ORDER BY created_at DESC
  LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION public.get_live_matches TO anon, authenticated;

-- Auto-create profile and wallet when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, full_name)
  VALUES (NEW.id, split_part(NEW.email::text,'@',1), coalesce(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email::text,'@',1)))
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_wallets (user_id, balance)
  VALUES (NEW.id, 1000.00)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8) Optional sample data (comment out if not needed)
INSERT INTO public.games (name, short_name, description, cover_image_url)
VALUES
  ('Counter-Strike 2', 'CS2', 'Tactical first-person shooter', 'https://example.com/cs2.jpg'),
  ('Valorant', 'VAL', 'Character-based tactical shooter', 'https://example.com/valorant.jpg'),
  ('League of Legends', 'LoL', 'Multiplayer online battle arena', 'https://example.com/lol.jpg');

INSERT INTO public.game_modes (game_id, name, description, formats, maps)
SELECT g.id, v.name, v.description, v.formats, v.maps
FROM public.games g
CROSS JOIN (
  VALUES 
    ('Competitive','5v5 ranked play', ARRAY['5v5']::text[], NULL),
    ('Casual','Chill mode', ARRAY['1v1','2v2','5v5']::text[], NULL),
    ('1v1','Duel mode', ARRAY['1v1']::text[], NULL),
    ('2v2','Doubles', ARRAY['2v2']::text[], NULL)
) AS v(name, description, formats, maps);
