# Tournament Bracket System Setup

## Overview
The tournament bracket system provides full database-driven tournament management with real participants, match tracking, and automatic progression through elimination rounds.

## Database Setup

### Step 1: Run the SQL Migration
Copy and paste the contents of `create_tournament_tables.sql` into your Supabase SQL Editor and run it.

This will create:
- `tournament_matches` table - stores individual matches with players, scores, and status
- `tournament_bracket_progress` table - tracks overall tournament state
- Functions for bracket generation and management

### Step 2: Verify Tables Created
After running the SQL, you should see these new tables in your Supabase dashboard:
- ✅ `tournament_matches`
- ✅ `tournament_bracket_progress`

## Features

### 🏆 **Real Tournament Management**
- **Participant-driven**: Uses actual tournament registrations from your database
- **Smart Bracket Generation**: Automatically creates proper single-elimination brackets
- **Bye Handling**: Automatically handles odd numbers of participants
- **Round Progression**: Winners automatically advance to next rounds

### 🎮 **Interactive Bracket View**
- **Visual Bracket**: Interactive tournament tree showing all rounds
- **Match Details**: Click any match to see details, scores, and participants
- **Live Status**: Real-time match status (Pending, In Progress, Completed)
- **Player Profiles**: Shows actual usernames from registered participants

### 📊 **Tournament Tracking**
- **Current Round**: Shows which round is currently active
- **Participant List**: Real registered users with registration dates
- **Match Schedule**: Upcoming and completed matches with timestamps
- **Tournament Progress**: Visual progress through elimination rounds

## How to Use

### For Tournament Admins:
1. **Tournament Registration**: Users register for tournaments as normal
2. **Generate Bracket**: When ready, click "Generate Bracket" button
3. **Bracket Created**: System automatically creates all matches and rounds
4. **Manage Progress**: Track matches and tournament progression

### For Users:
1. **View Bracket**: Click "View Bracket" from any tournament you're registered for
2. **See Progress**: View your position in the bracket and upcoming matches
3. **Track Tournament**: See other participants and match results

## Database Schema

### tournament_matches
```sql
- id (uuid) - Unique match ID
- tournament_id (uuid) - Links to tournaments table
- round_number (int) - Round number (1, 2, 3, etc.)
- match_number (int) - Match number within round
- player1_id (uuid) - First player
- player2_id (uuid) - Second player (null for bye)
- winner_id (uuid) - Winner after completion
- player1_score (int) - Player 1 final score
- player2_score (int) - Player 2 final score
- status (text) - pending, in_progress, completed, bye, walkover
```

### tournament_bracket_progress
```sql
- id (uuid) - Unique progress ID
- tournament_id (uuid) - Links to tournaments table
- current_round (int) - Currently active round
- total_rounds (int) - Total rounds in tournament
- bracket_type (text) - single_elimination, etc.
```

## Functions

### generate_tournament_bracket(tournament_id)
- Creates complete bracket structure for a tournament
- Handles odd numbers of participants with bye matches
- Generates all rounds from first round to final

### calculate_tournament_rounds(participant_count)
- Calculates how many rounds needed for given participants
- Uses log2 formula for single elimination

## URL Structure

Tournament brackets are accessible at:
```
/tournaments/{tournament_id}/bracket
```

Users can access this from:
- "View Bracket" button in My Tournaments
- Direct navigation if they know the tournament ID

## Permissions

The system uses Row Level Security (RLS):
- **Anyone** can view tournament matches and bracket progress
- **Authenticated users** can manage tournaments (you can restrict this further)
- **Tournament participants** can view their tournament brackets

## Troubleshooting

### "Tournament bracket tables are not set up"
- Run the `create_tournament_tables.sql` script in Supabase SQL Editor

### "Not enough participants to generate bracket"
- Ensure tournament has at least 2 registered participants

### Foreign key relationship errors
- Verify that `tournaments` and `tournament_participants` tables exist
- Check that participant user_ids exist in `auth.users`

## Next Steps

After setup, you can extend the system with:
- Match result reporting interface
- Real-time match updates
- Tournament scheduling
- Prize distribution
- Different tournament formats (double elimination, round robin)

The foundation is now in place for a complete tournament management system!