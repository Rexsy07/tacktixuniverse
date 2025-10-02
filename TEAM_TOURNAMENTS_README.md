# Team Tournament Support (2v2, 4v4, etc.) Implementation Guide

## Overview

This implementation adds comprehensive support for team-based tournaments including 2v2, 4v4, and other team formats to your existing tournament system. The enhancement builds upon your existing tournament infrastructure while adding team-specific features.

## Files Created/Modified

### 1. Database Migration
- **`enhance_team_tournaments.sql`**: Complete SQL migration that adds team tournament support
  - Extends `tournament_matches` table with team columns
  - Creates `tournament_team_participants` table for team management  
  - Implements team-aware bracket generation functions
  - Adds tournament completion logic for team tournaments

### 2. Frontend Components
- **`src/components/TeamTournamentRegistration.tsx`**: New component for team registration
  - Handles team creation and member management
  - Supports captain-based team system
  - User search and invitation functionality
- **`src/pages/TournamentBracket.tsx`**: Enhanced to display team information
  - Shows team compositions in brackets
  - Displays captain and team member names
  - Handles team-based winner display
- **`src/pages/Tournaments.tsx`**: Updated with format filtering
  - Added format filter buttons (1v1, 2v2, 4v4, etc.)
  - Enhanced tournament cards to show format badges
- **`src/pages/TournamentDetail.tsx`**: Integrated team registration
  - Conditionally shows team registration for team tournaments
  - Links with individual tournament registration for 1v1

## Key Features Implemented

### 1. Database Schema Enhancements
```sql
-- New columns in tournament_matches
ALTER TABLE tournament_matches ADD COLUMN team1_members uuid[];
ALTER TABLE tournament_matches ADD COLUMN team2_members uuid[];
ALTER TABLE tournament_matches ADD COLUMN team_size integer DEFAULT 1;

-- New table for team participants
CREATE TABLE tournament_team_participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id uuid NOT NULL REFERENCES tournaments(id),
    team_name text NOT NULL,
    captain_id uuid NOT NULL REFERENCES auth.users(id),
    members uuid[] NOT NULL DEFAULT array[]::uuid[]
);
```

### 2. Team Registration System
- **Captain-based**: One user becomes the team captain and invites others
- **User Search**: Search for users by username to add to team
- **Team Name**: Unique team names per tournament
- **Format Detection**: Automatically detects team size from tournament format (e.g., "2v2" = 2 players per team)

### 3. Enhanced Bracket Display
- Shows team compositions with captain marked
- Displays all team members in bracket view
- Proper winner indication for team matches
- Team format badges (2v2, 4v4, etc.)

### 4. Smart Bracket Generation
```sql
-- Auto-detects team size from format
team_size_val := CASE 
    WHEN tournament_record.format LIKE '%v%' THEN 
        CAST(SPLIT_PART(tournament_record.format, 'v', 1) AS INTEGER)
    ELSE 1
END;
```

## Implementation Steps

### Step 1: Run Database Migration
```bash
# Connect to your Supabase database and run:
psql -h your-supabase-host -U postgres -d postgres -f enhance_team_tournaments.sql
```

### Step 2: Update Game Modes (Optional)
Update your game modes to include team formats in the formats array:
```sql
UPDATE game_modes SET formats = array['1v1', '2v2', '4v4'] WHERE name = 'Search & Destroy';
UPDATE game_modes SET formats = array['2v2', '4v4'] WHERE name = 'Team Deathmatch';
```

### Step 3: Create Team Tournaments
When creating tournaments through your admin interface, set the format field to team values:
- `"2v2"` for 2v2 tournaments
- `"4v4"` for 4v4 tournaments  
- `"3v3"` for 3v3 tournaments
- `"5v5"` for 5v5 tournaments

### Step 4: Test Team Registration
1. Create a tournament with format `"2v2"`
2. Navigate to tournament detail page
3. The `TeamTournamentRegistration` component should appear
4. Register a team with the required number of players
5. Generate bracket to see team-based matches

## Database Functions Added

### `generate_team_tournament_bracket(tournament_id)`
- Generates brackets for both individual and team tournaments
- Auto-detects format and creates appropriate match structure
- Handles team member arrays in matches

### `set_team_tournament_match_result(match_id, winner_id, score1, score2)`
- Sets match results for team tournaments
- Validates winner is a team participant
- Advances winners to next round

### `increment_tournament_participants(tournament_id)`
- Helper function to update participant count when teams register

## Frontend Integration Points

### Tournament List/Card Display
```tsx
// Tournament cards now show format badges
<Badge variant="outline" className="text-xs">
  {tournament.format || '1v1'}
</Badge>
```

### Tournament Registration
```tsx
// Conditionally show team registration for team tournaments
{tournament.format && tournament.format !== '1v1' && (
  <TeamTournamentRegistration
    tournamentId={tournament.id}
    tournamentName={tournament.name}
    format={tournament.format}
    maxParticipants={tournament.max_participants}
    currentParticipants={participants}
  />
)}
```

### Bracket Display
```tsx
// Enhanced match cards show team compositions
const isTeamMatch = match.team_size && match.team_size > 1;
// Renders team member lists with captain indication
```

## Testing Scenarios

### 1. Team Registration Flow
1. User A creates a 2v2 tournament
2. User B visits tournament page and sees team registration form
3. User B enters team name and searches for User C
4. User B invites User C to complete the team
5. Team registers successfully

### 2. Bracket Generation
1. Multiple teams register for tournament
2. Admin generates bracket via tournament management
3. Bracket shows team compositions in each match
4. Match results can be set with proper team winner validation

### 3. Team vs Individual Tournaments
1. 1v1 tournaments show individual registration
2. Team tournaments show team registration form
3. Bracket display adapts to format type

## Configuration Options

### Supported Formats
The system automatically detects team size from format strings:
- `"1v1"` → 1 player per team (individual)
- `"2v2"` → 2 players per team  
- `"3v3"` → 3 players per team
- `"4v4"` → 4 players per team
- `"5v5"` → 5 players per team

### Tournament Filtering
Added format filters in tournament list:
```tsx
{['all', '1v1', '2v2', '3v3', '4v4', '5v5'].map((formatFilter) => (
  <Button onClick={() => setFormatFilter(formatFilter)}>
    {formatFilter === 'all' ? 'All Formats' : formatFilter}
  </Button>
))}
```

## Future Enhancements

### 1. Team Management
- Team profiles and statistics
- Team history across tournaments
- Team invitations system

### 2. Advanced Bracket Types
- Double elimination for team tournaments
- Group stage + knockout for larger team tournaments
- Swiss system support

### 3. Team Communication
- Team chat integration
- Match coordination features
- Team notifications

## Troubleshooting

### Common Issues

1. **"Tournament participants table not found"**
   - Ensure you've run the `enhance_team_tournaments.sql` migration
   - Check that RLS policies are properly set

2. **Team registration not showing**
   - Verify tournament format is set to team value (e.g., "2v2")
   - Check that tournament status is "registration"

3. **Bracket generation fails**
   - Ensure enough teams are registered (minimum 2)
   - Check that team participants have all required members

4. **Team member search not working**
   - Verify profiles table has username data
   - Check that users being searched have complete profiles

### Database Queries for Debugging

```sql
-- Check team participants for a tournament
SELECT * FROM tournament_team_participants WHERE tournament_id = 'your-tournament-id';

-- Check tournament matches with team data
SELECT * FROM tournament_matches WHERE tournament_id = 'your-tournament-id';

-- Verify tournament format
SELECT id, name, format FROM tournaments WHERE format LIKE '%v%';
```

This implementation provides a complete foundation for team-based tournaments while maintaining compatibility with existing individual tournaments. The system is designed to be extensible for additional team formats and tournament types in the future.