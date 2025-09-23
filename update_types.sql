-- After running the migration, you can generate types by running:
-- npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/integrations/supabase/types.ts

-- Or manually add these types to your existing types.ts file:

/*
Add to the Tables interface:

tournament_matches: {
  Row: {
    id: string
    tournament_id: string
    round_number: number
    match_number: number
    player1_id: string | null
    player2_id: string | null
    winner_id: string | null
    player1_score: number | null
    player2_score: number | null
    status: 'pending' | 'in_progress' | 'completed' | 'walkover' | 'bye'
    scheduled_time: string | null
    started_at: string | null
    completed_at: string | null
    metadata: Json | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    tournament_id: string
    round_number: number
    match_number: number
    player1_id?: string | null
    player2_id?: string | null
    winner_id?: string | null
    player1_score?: number | null
    player2_score?: number | null
    status?: 'pending' | 'in_progress' | 'completed' | 'walkover' | 'bye'
    scheduled_time?: string | null
    started_at?: string | null
    completed_at?: string | null
    metadata?: Json | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    tournament_id?: string
    round_number?: number
    match_number?: number
    player1_id?: string | null
    player2_id?: string | null
    winner_id?: string | null
    player1_score?: number | null
    player2_score?: number | null
    status?: 'pending' | 'in_progress' | 'completed' | 'walkover' | 'bye'
    scheduled_time?: string | null
    started_at?: string | null
    completed_at?: string | null
    metadata?: Json | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "tournament_matches_tournament_id_fkey"
      columns: ["tournament_id"]
      referencedRelation: "tournaments"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "tournament_matches_player1_id_fkey"
      columns: ["player1_id"]
      referencedRelation: "users"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "tournament_matches_player2_id_fkey"
      columns: ["player2_id"]
      referencedRelation: "users"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "tournament_matches_winner_id_fkey"
      columns: ["winner_id"]
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
  ]
}

tournament_bracket_progress: {
  Row: {
    id: string
    tournament_id: string
    current_round: number
    total_rounds: number
    bracket_type: 'single_elimination' | 'double_elimination' | 'round_robin'
    bracket_data: Json | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    tournament_id: string
    current_round?: number
    total_rounds: number
    bracket_type?: 'single_elimination' | 'double_elimination' | 'round_robin'
    bracket_data?: Json | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    tournament_id?: string
    current_round?: number
    total_rounds?: number
    bracket_type?: 'single_elimination' | 'double_elimination' | 'round_robin'
    bracket_data?: Json | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "tournament_bracket_progress_tournament_id_fkey"
      columns: ["tournament_id"]
      referencedRelation: "tournaments"
      referencedColumns: ["id"]
    }
  ]
}

Add to Functions interface:

generate_tournament_bracket: {
  Args: { tournament_id_param: string }
  Returns: void
}

set_tournament_match_result: {
  Args: {
    match_id_param: string
    winner_id_param: string
    player1_score_param?: number
    player2_score_param?: number
  }
  Returns: void
}

advance_tournament_winner: {
  Args: {
    match_id_param: string
    winner_id_param: string
  }
  Returns: void
}

calculate_tournament_rounds: {
  Args: { participant_count: number }
  Returns: number
}
*/