// This is a temporary fix until we can properly set up the database types
declare module '@supabase/supabase-js' {
  interface Database {
    public: {
      Functions: {
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
        create_challenge: {
          Args: {
            p_game_id: string;
            p_game_mode_id: string;
            p_format: string;
            p_map_name: string | null;
            p_stake_amount: number;
            p_duration_minutes: number | null;
            p_custom_rules: string | null;
            p_creator_id: string;
          };
          Returns: Array<{ match_id: string }>;
        };
        create_match_with_escrow: {
          Args: {
            p_creator_id: string;
            p_game_id: string;
            p_game_mode_id: string;
            p_format: string;
            p_map_name: string | null;
            p_stake_amount: number;
            p_duration_minutes: number | null;
            p_custom_rules: string | null;
          };
          Returns: string;
        };
      };
      Tables: {
        matches: {
          Row: {
            id: string;
            creator_id: string;
            game_id: string;
            game_mode_id: string;
            format: string;
            map_name?: string;
            stake_amount: number;
            duration_minutes?: number;
            custom_rules?: string;
            status: string;
            created_at: string;
          };
          Insert: {
            id?: string;
            creator_id: string;
            game_id: string;
            game_mode_id: string;
            format: string;
            map_name?: string;
            stake_amount: number;
            duration_minutes?: number;
            custom_rules?: string;
            status?: string;
            created_at?: string;
          };
          Update: {
            id?: string;
            creator_id?: string;
            game_id?: string;
            game_mode_id?: string;
            format?: string;
            map_name?: string;
            stake_amount?: number;
            duration_minutes?: number;
            custom_rules?: string;
            status?: string;
            created_at?: string;
          };
        };
        transactions: {
          Row: {
            id: string;
            user_id: string;
            amount: number;
            type: string;
            reference_code: string;
            description: string;
            status: string;
            created_at: string;
          };
          Insert: {
            id?: string;
            user_id: string;
            amount: number;
            type: string;
            reference_code: string;
            description: string;
            status?: string;
            created_at?: string;
          };
          Update: {
            id?: string;
            user_id?: string;
            amount?: number;
            type?: string;
            reference_code?: string;
            description?: string;
            status?: string;
            created_at?: string;
          };
        };
      };
    };
  }
}

export {};