export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
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
      }
      // ... other tables ...
    }
  }
}