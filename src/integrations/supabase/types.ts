export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      match_participants: {
        Row: {
          id: string
          match_id: string
          user_id: string
          team: 'A' | 'B'
          role: 'captain' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          match_id: string
          user_id: string
          team: 'A' | 'B'
          role?: 'captain' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          user_id?: string
          team?: 'A' | 'B'
          role?: 'captain' | 'member'
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_participants_match_id_fkey"
            columns: ["match_id"]
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_participants_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      achievements: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          name: string
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          is_active?: boolean
          name: string
          requirement_type: string
          requirement_value: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      game_modes: {
        Row: {
          created_at: string
          description: string | null
          formats: string[]
          game_id: string
          id: string
          is_active: boolean
          maps: string[] | null
          max_stake: number
          min_stake: number
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          formats: string[]
          game_id: string
          id?: string
          is_active?: boolean
          maps?: string[] | null
          max_stake?: number
          min_stake?: number
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          formats?: string[]
          game_id?: string
          id?: string
          is_active?: boolean
          maps?: string[] | null
          max_stake?: number
          min_stake?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_modes_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      gamer_tags: {
        Row: {
          created_at: string
          game_id: string
          gamer_tag: string
          id: string
          is_verified: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          gamer_tag: string
          id?: string
          is_verified?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          game_id?: string
          gamer_tag?: string
          id?: string
          is_verified?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamer_tags_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          max_stake: number
          min_stake: number
          name: string
          short_name: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_stake?: number
          min_stake?: number
          name: string
          short_name: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_stake?: number
          min_stake?: number
          name?: string
          short_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          created_at: string
          title: string
          message: string
          audience: 'all' | 'user'
          target_user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          message: string
          audience: 'all' | 'user'
          target_user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          message?: string
          audience?: 'all' | 'user'
          target_user_id?: string | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          accepted_at: string | null
          admin_decision: string | null
          completed_at: string | null
          created_at: string
          creator_id: string
          creator_proof_url: string | null
          creator_result: Database["public"]["Enums"]["match_result"] | null
          custom_rules: string | null
          duration_minutes: number | null
          format: string
          game_id: string
          game_mode_id: string
          id: string
          map_name: string | null
          opponent_id: string | null
          opponent_proof_url: string | null
          opponent_result: Database["public"]["Enums"]["match_result"] | null
          stake_amount: number
          started_at: string | null
          status: Database["public"]["Enums"]["match_status"]
          tournament_id: string | null
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          admin_decision?: string | null
          completed_at?: string | null
          created_at?: string
          creator_id: string
          creator_proof_url?: string | null
          creator_result?: Database["public"]["Enums"]["match_result"] | null
          custom_rules?: string | null
          duration_minutes?: number | null
          format: string
          game_id: string
          game_mode_id: string
          id?: string
          map_name?: string | null
          opponent_id?: string | null
          opponent_proof_url?: string | null
          opponent_result?: Database["public"]["Enums"]["match_result"] | null
          stake_amount: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          tournament_id?: string | null
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          admin_decision?: string | null
          completed_at?: string | null
          created_at?: string
          creator_id?: string
          creator_proof_url?: string | null
          creator_result?: Database["public"]["Enums"]["match_result"] | null
          custom_rules?: string | null
          duration_minutes?: number | null
          format?: string
          game_id?: string
          game_mode_id?: string
          id?: string
          map_name?: string | null
          opponent_id?: string | null
          opponent_proof_url?: string | null
          opponent_result?: Database["public"]["Enums"]["match_result"] | null
          stake_amount?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          tournament_id?: string | null
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_game_mode_id_fkey"
            columns: ["game_mode_id"]
            isOneToOne: false
            referencedRelation: "game_modes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      tournament_participants: {
        Row: {
          id: string
          registered_at: string
          tournament_id: string
          user_id: string
        }
        Insert: {
          id?: string
          registered_at?: string
          tournament_id: string
          user_id: string
        }
        Update: {
          id?: string
          registered_at?: string
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string
          created_by: string
          current_participants: number
          description: string | null
          end_date: string | null
          entry_fee: number
          format: string
          game_id: string
          game_mode_id: string
          id: string
          is_featured: boolean
          max_participants: number
          name: string
          prize_pool: number
          start_date: string
          status: Database["public"]["Enums"]["tournament_status"]
          updated_at: string
          winner_prize: number | null
          winner_user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          current_participants?: number
          description?: string | null
          end_date?: string | null
          entry_fee?: number
          format: string
          game_id: string
          game_mode_id: string
          id?: string
          is_featured?: boolean
          max_participants: number
          name: string
          prize_pool?: number
          start_date: string
          status?: Database["public"]["Enums"]["tournament_status"]
          updated_at?: string
          winner_prize?: number | null
          winner_user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          current_participants?: number
          description?: string | null
          end_date?: string | null
          entry_fee?: number
          format?: string
          game_id?: string
          game_mode_id?: string
          id?: string
          is_featured?: boolean
          max_participants?: number
          name?: string
          prize_pool?: number
          start_date?: string
          status?: Database["public"]["Enums"]["tournament_status"]
          updated_at?: string
          winner_prize?: number | null
          winner_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_game_mode_id_fkey"
            columns: ["game_mode_id"]
            isOneToOne: false
            referencedRelation: "game_modes"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          processed_at: string | null
          reference_code: string
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          reference_code: string
          status?: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          reference_code?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          created_at: string
          current_rank: number
          current_streak: number
          favorite_game_id: string | null
          id: string
          longest_win_streak: number
          total_draws: number
          total_earnings: number
          total_losses: number
          total_matches: number
          total_wins: number
          updated_at: string
          user_id: string
          win_rate: number | null
        }
        Insert: {
          created_at?: string
          current_rank?: number
          current_streak?: number
          favorite_game_id?: string | null
          id?: string
          longest_win_streak?: number
          total_draws?: number
          total_earnings?: number
          total_losses?: number
          total_matches?: number
          total_wins?: number
          updated_at?: string
          user_id: string
          win_rate?: number | null
        }
        Update: {
          created_at?: string
          current_rank?: number
          current_streak?: number
          favorite_game_id?: string | null
          id?: string
          longest_win_streak?: number
          total_draws?: number
          total_earnings?: number
          total_losses?: number
          total_matches?: number
          total_wins?: number
          updated_at?: string
          user_id?: string
          win_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_favorite_game_id_fkey"
            columns: ["favorite_game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_deposited: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_deposited?: number
          total_withdrawn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_deposited?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_holds: {
        Row: {
          id: string
          match_id: string
          user_id: string
          amount: number
          status: string
          created_at: string
          released_at: string | null
        }
        Insert: {
          id?: string
          match_id: string
          user_id: string
          amount: number
          status?: string
          created_at?: string
          released_at?: string | null
        }
        Update: {
          id?: string
          match_id?: string
          user_id?: string
          amount?: number
          status?: string
          created_at?: string
          released_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_holds_match_id_fkey"
            columns: ["match_id"]
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_holds_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      platform_settings: {
        Row: {
          id: string
          fee_percentage: number
          updated_at: string
        }
        Insert: {
          id?: string
          fee_percentage?: number
          updated_at?: string
        }
        Update: {
          id?: string
          fee_percentage?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      accept_team_challenge: {
        Args: {
          p_match_id: string
          p_captain_id: string
          p_team_members: string[]
        }
        Returns: void
      }
      create_challenge: {
        Args: {
          p_creator_id: string
          p_game_id: string
          p_game_mode_id: string
          p_format: string
          p_map_name: string | null
          p_stake_amount: number
          p_duration_minutes: number | null
          p_custom_rules: string | null
          p_team_members: string[]
        }
        Returns: string
      }
      create_match_with_escrow: {
        Args: {
          p_creator_id: string
          p_game_id: string
          p_game_mode_id: string
          p_format: string
          p_map_name: string | null
          p_stake_amount: number
          p_duration_minutes: number | null
          p_custom_rules: string | null
        }
        Returns: string
      }
      accept_challenge_with_escrow: {
        Args: {
          p_match_id: string
          p_user_id: string
        }
        Returns: void
      }
      accept_team_challenge_with_escrow: {
        Args: {
          p_match_id: string
          p_captain_id: string
          p_team_members: string[]
        }
        Returns: void
      }
      cancel_match_escrow: {
        Args: {
          p_match_id: string
        }
        Returns: void
      }
      settle_match_escrow: {
        Args: {
          p_match_id: string
          p_winner_id: string
          p_fee_percentage?: number
        }
        Returns: void
      }
    }
    Enums: {
      app_role: "user" | "admin"
      match_result: "win" | "loss" | "draw"
      match_status:
        | "awaiting_opponent"
        | "in_progress"
        | "pending_result"
        | "completed"
        | "cancelled"
        | "disputed"
      tournament_status:
        | "registration"
        | "full"
        | "live"
        | "completed"
        | "cancelled"
      transaction_status: "pending" | "completed" | "failed" | "cancelled"
      transaction_type:
        | "deposit"
        | "withdrawal"
        | "match_win"
        | "match_loss"
        | "tournament_entry"
        | "tournament_prize"
        | "refund"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "admin"],
      match_result: ["win", "loss", "draw"],
      match_status: [
        "awaiting_opponent",
        "in_progress",
        "pending_result",
        "completed",
        "cancelled",
        "disputed",
      ],
      tournament_status: [
        "registration",
        "full",
        "live",
        "completed",
        "cancelled",
      ],
      transaction_status: ["pending", "completed", "failed", "cancelled"],
      transaction_type: [
        "deposit",
        "withdrawal",
        "match_win",
        "match_loss",
        "tournament_entry",
        "tournament_prize",
        "refund",
      ],
    },
  },
} as const
