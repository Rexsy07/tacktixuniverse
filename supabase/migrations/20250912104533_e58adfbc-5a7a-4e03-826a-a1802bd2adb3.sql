-- Create comprehensive gaming platform database schema

-- Enums for various status types
CREATE TYPE match_status AS ENUM ('awaiting_opponent', 'in_progress', 'pending_result', 'completed', 'cancelled', 'disputed');
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'match_win', 'match_loss', 'tournament_entry', 'tournament_prize', 'refund');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
CREATE TYPE tournament_status AS ENUM ('registration', 'full', 'live', 'completed', 'cancelled');
CREATE TYPE match_result AS ENUM ('win', 'loss', 'draw');

-- Games table - stores available games and their configurations
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  short_name TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  min_stake INTEGER NOT NULL DEFAULT 100,
  max_stake INTEGER NOT NULL DEFAULT 50000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Game modes for each game
CREATE TABLE public.game_modes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  formats TEXT[] NOT NULL, -- e.g., ['1v1', '2v2', '5v5']
  maps TEXT[], -- available maps for this mode
  min_stake INTEGER NOT NULL DEFAULT 100,
  max_stake INTEGER NOT NULL DEFAULT 50000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(game_id, name)
);

-- User gaming statistics
CREATE TABLE public.user_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_matches INTEGER NOT NULL DEFAULT 0,
  total_wins INTEGER NOT NULL DEFAULT 0,
  total_losses INTEGER NOT NULL DEFAULT 0,
  total_draws INTEGER NOT NULL DEFAULT 0,
  win_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_matches > 0 THEN (total_wins::DECIMAL / total_matches * 100)
      ELSE 0
    END
  ) STORED,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_win_streak INTEGER NOT NULL DEFAULT 0,
  total_earnings INTEGER NOT NULL DEFAULT 0,
  favorite_game_id UUID REFERENCES public.games(id),
  current_rank INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User gamer tags for different games
CREATE TABLE public.gamer_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  gamer_tag TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- User wallet for managing funds
CREATE TABLE public.user_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_deposited INTEGER NOT NULL DEFAULT 0,
  total_withdrawn INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Financial transactions
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount INTEGER NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending',
  reference_code TEXT NOT NULL UNIQUE,
  description TEXT,
  metadata JSONB, -- store additional transaction details
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tournaments
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  game_id UUID NOT NULL REFERENCES public.games(id),
  game_mode_id UUID NOT NULL REFERENCES public.game_modes(id),
  description TEXT,
  prize_pool INTEGER NOT NULL DEFAULT 0,
  entry_fee INTEGER NOT NULL DEFAULT 0,
  max_participants INTEGER NOT NULL,
  current_participants INTEGER NOT NULL DEFAULT 0,
  format TEXT NOT NULL, -- e.g., "Battle Royale Knockout", "5v5 Team Elimination"
  status tournament_status NOT NULL DEFAULT 'registration',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  winner_user_id UUID REFERENCES auth.users(id),
  winner_prize INTEGER,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (current_participants <= max_participants),
  CHECK (start_date > now()),
  CHECK (prize_pool >= 0),
  CHECK (entry_fee >= 0)
);

-- Tournament participants
CREATE TABLE public.tournament_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

-- Matches/Challenges
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  opponent_id UUID REFERENCES auth.users(id),
  game_id UUID NOT NULL REFERENCES public.games(id),
  game_mode_id UUID NOT NULL REFERENCES public.game_modes(id),
  tournament_id UUID REFERENCES public.tournaments(id), -- null for regular matches
  format TEXT NOT NULL, -- e.g., "1v1", "2v2", "5v5"
  map_name TEXT,
  stake_amount INTEGER NOT NULL CHECK (stake_amount > 0),
  status match_status NOT NULL DEFAULT 'awaiting_opponent',
  custom_rules TEXT,
  duration_minutes INTEGER,
  
  -- Match results
  winner_id UUID REFERENCES auth.users(id),
  creator_result match_result,
  opponent_result match_result,
  creator_proof_url TEXT, -- screenshot/video proof
  opponent_proof_url TEXT,
  admin_decision TEXT,
  
  -- Timestamps
  accepted_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CHECK (creator_id != opponent_id),
  CHECK (
    CASE 
      WHEN status = 'completed' THEN winner_id IS NOT NULL
      ELSE true 
    END
  ),
  CHECK (
    CASE 
      WHEN winner_id IS NOT NULL THEN winner_id IN (creator_id, opponent_id)
      ELSE true
    END
  )
);

-- User achievements
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL, -- e.g., 'total_wins', 'win_streak', 'earnings'
  requirement_value INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User earned achievements
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Insert sample games
INSERT INTO public.games (name, short_name, description, min_stake, max_stake) VALUES
('Call of Duty: Mobile', 'CODM', 'Nigeria''s #1 mobile shooter with Battle Royale, Multiplayer, and 1v1 duels.', 200, 15000),
('PUBG Mobile', 'PUBG', 'Classic Battle Royale with up to 100 players. Popular in Nigerian gaming cafés.', 300, 10000),
('Free Fire', 'FF', 'Lightweight Battle Royale optimized for mid-range phones. Huge Nigerian fanbase.', 100, 8000),
('EA FC Mobile', 'EA FC', 'Ultimate football experience with authentic teams and players.', 200, 8000),
('PES Mobile', 'PES', 'Pro Evolution Soccer mobile version with realistic gameplay.', 150, 6000);

-- Insert game modes for CODM
INSERT INTO public.game_modes (game_id, name, description, formats, maps, min_stake, max_stake) VALUES
((SELECT id FROM public.games WHERE short_name = 'CODM'), 'Search & Destroy', 'High stakes tactical mode with bomb defusal', ARRAY['1v1', '2v2', '3v3', '5v5'], ARRAY['Standoff', 'Crash', 'Crossfire', 'Raid', 'Summit'], 500, 10000),
((SELECT id FROM public.games WHERE short_name = 'CODM'), 'Team Deathmatch', 'Fast-paced elimination matches', ARRAY['1v1', '2v2', '3v3', '5v5'], ARRAY['Killhouse', 'Shipment', 'Rust', 'Dome', 'Coastal'], 200, 5000),
((SELECT id FROM public.games WHERE short_name = 'CODM'), 'Hardpoint', 'Objective-based chaos with rotating control points', ARRAY['2v2', '3v3', '5v5'], ARRAY['Nuketown', 'Raid', 'Hijacked', 'Firing Range', 'Takeoff'], 300, 8000);

-- Insert game modes for other games
INSERT INTO public.game_modes (game_id, name, description, formats, maps, min_stake, max_stake) VALUES
((SELECT id FROM public.games WHERE short_name = 'PUBG'), 'Battle Royale Kill Race', 'Kill count wagers in classic BR', ARRAY['Solo', 'Duo', 'Squad'], ARRAY['Erangel', 'Miramar', 'Sanhok', 'Livik', 'Vikendi'], 500, 10000),
((SELECT id FROM public.games WHERE short_name = 'FF'), 'Clash Squad', 'Round-based 4v4 tactical matches', ARRAY['4v4'], ARRAY['Factory', 'Clock Tower', 'Bermuda Peak', 'Kalahari Base'], 300, 10000),
((SELECT id FROM public.games WHERE short_name = 'EA FC'), 'Head-to-Head', 'Full PvP matches with real teams', ARRAY['1v1'], ARRAY['Allianz Arena', 'Old Trafford', 'Santiago Bernabéu', 'Parc des Princes'], 300, 8000),
((SELECT id FROM public.games WHERE short_name = 'PES'), 'Online Match', 'Classic full-game PvP matches', ARRAY['1v1'], ARRAY['Camp Nou', 'San Siro', 'Emirates Stadium', 'Signal Iduna Park'], 300, 6000);

-- Insert sample achievements
INSERT INTO public.achievements (name, description, icon, requirement_type, requirement_value) VALUES
('First Victory', 'Won your first match', 'Trophy', 'total_wins', 1),
('Winning Streak', 'Won 5 matches in a row', 'Target', 'win_streak', 5),
('Top Earner', 'Earned ₦10,000 in total', 'Star', 'total_earnings', 10000),
('Tournament Champion', 'Won a tournament', 'Award', 'tournament_wins', 1),
('Legendary Player', 'Reach 100 total wins', 'TrendingUp', 'total_wins', 100);

-- Enable Row Level Security
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for games (public read)
CREATE POLICY "Games are viewable by everyone" ON public.games FOR SELECT USING (is_active = true);
CREATE POLICY "Game modes are viewable by everyone" ON public.game_modes FOR SELECT USING (is_active = true);
CREATE POLICY "Achievements are viewable by everyone" ON public.achievements FOR SELECT USING (is_active = true);

-- RLS Policies for user data
CREATE POLICY "Users can view their own stats" ON public.user_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own gamer tags" ON public.gamer_tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own gamer tags" ON public.gamer_tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own gamer tags" ON public.gamer_tags FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own wallet" ON public.user_wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for tournaments
CREATE POLICY "Tournaments are viewable by everyone" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Users can create tournaments" ON public.tournaments FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Tournament participants can view participations" ON public.tournament_participants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can register for tournaments" ON public.tournament_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for matches
CREATE POLICY "Users can view matches they're involved in" ON public.matches 
  FOR SELECT USING (auth.uid() = creator_id OR auth.uid() = opponent_id);
CREATE POLICY "Users can view open challenges" ON public.matches 
  FOR SELECT USING (status = 'awaiting_opponent' AND opponent_id IS NULL);
CREATE POLICY "Users can create matches" ON public.matches 
  FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update their own matches" ON public.matches 
  FOR UPDATE USING (auth.uid() = creator_id OR auth.uid() = opponent_id);

-- Admin policies
CREATE POLICY "Admins can manage all games" ON public.games FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all game modes" ON public.game_modes FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all user stats" ON public.user_stats FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all wallets" ON public.user_wallets FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update transactions" ON public.transactions FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all matches" ON public.matches FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all matches" ON public.matches FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Triggers for updating timestamps
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON public.games FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON public.user_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_gamer_tags_updated_at BEFORE UPDATE ON public.gamer_tags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_wallets_updated_at BEFORE UPDATE ON public.user_wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON public.tournaments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to initialize user data on signup
CREATE OR REPLACE FUNCTION public.initialize_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user stats
  INSERT INTO public.user_stats (user_id) VALUES (NEW.id);
  
  -- Insert user wallet
  INSERT INTO public.user_wallets (user_id) VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update the existing trigger to include user data initialization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (user_id, username, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'full_name'
  );
  
  -- Insert default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Initialize user gaming data
  INSERT INTO public.user_stats (user_id) VALUES (NEW.id);
  INSERT INTO public.user_wallets (user_id) VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update user stats when match is completed
CREATE OR REPLACE FUNCTION public.update_user_stats_on_match_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when match status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.winner_id IS NOT NULL THEN
    -- Update winner stats
    UPDATE public.user_stats 
    SET 
      total_matches = total_matches + 1,
      total_wins = total_wins + 1,
      current_streak = current_streak + 1,
      longest_win_streak = GREATEST(longest_win_streak, current_streak + 1),
      total_earnings = total_earnings + NEW.stake_amount,
      updated_at = now()
    WHERE user_id = NEW.winner_id;
    
    -- Update loser stats
    UPDATE public.user_stats 
    SET 
      total_matches = total_matches + 1,
      total_losses = total_losses + 1,
      current_streak = 0,
      updated_at = now()
    WHERE user_id = CASE 
      WHEN NEW.winner_id = NEW.creator_id THEN NEW.opponent_id 
      ELSE NEW.creator_id 
    END;
    
    -- Update wallets
    UPDATE public.user_wallets 
    SET balance = balance + NEW.stake_amount, updated_at = now() 
    WHERE user_id = NEW.winner_id;
    
    UPDATE public.user_wallets 
    SET balance = balance - NEW.stake_amount, updated_at = now() 
    WHERE user_id = CASE 
      WHEN NEW.winner_id = NEW.creator_id THEN NEW.opponent_id 
      ELSE NEW.creator_id 
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update stats when match is completed
CREATE TRIGGER update_stats_on_match_completion 
  AFTER UPDATE ON public.matches 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_user_stats_on_match_completion();

-- Function to update tournament participant count
CREATE OR REPLACE FUNCTION public.update_tournament_participants_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tournaments 
    SET current_participants = current_participants + 1
    WHERE id = NEW.tournament_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tournaments 
    SET current_participants = current_participants - 1
    WHERE id = OLD.tournament_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update tournament participant count
CREATE TRIGGER update_tournament_participants_count_trigger
  AFTER INSERT OR DELETE ON public.tournament_participants
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_tournament_participants_count();