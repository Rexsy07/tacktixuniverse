import { Database } from './database.types';

export type DbFunctions = {
  create_match_challenge: {
    Args: {
      p_game_id: string;
      p_game_mode_id: string;
      p_format: string;
      p_map_name?: string | null;
      p_stake_amount: number;
      p_duration_minutes?: number | null;
      p_custom_rules?: string | null;
      p_creator_id: string;
    };
    Returns: string;
  };
  get_current_user_role: {
    Args: Record<string, never>;
    Returns: string;
  };
  has_role: {
    Args: { role: string };
    Returns: boolean;
  };
  accept_team_challenge: {
    Args: {
      p_match_id: string;
      p_captain_id: string;
      p_team_members: string[];
    };
    Returns: boolean;
  };
};

export type SupabaseDatabase = Database & {
  public: {
    Functions: DbFunctions;
  };
};