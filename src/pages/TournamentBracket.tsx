import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, Users, Clock, ChevronLeft, Eye, 
  Crown, Target, Zap, Calendar, Settings, Play 
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface TournamentMatch {
  id: string;
  tournament_id: string;
  round_number: number;
  match_number: number;
  player1_id?: string;
  player1_name?: string;
  player2_id?: string;
  player2_name?: string;
  team1_members?: string[];
  team2_members?: string[];
  team1_names?: string[];
  team2_names?: string[];
  team_size?: number;
  winner_id?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'walkover' | 'bye';
  scheduled_time?: string;
  started_at?: string;
  completed_at?: string;
  player1_score?: number;
  player2_score?: number;
  created_at: string;
  updated_at: string;
}

interface Tournament {
  id: string;
  name: string;
  description?: string;
  game_id: string;
  games?: { name: string; short_name: string };
  status: 'registration' | 'full' | 'live' | 'completed' | 'cancelled';
  start_date: string;
  end_date?: string;
  entry_fee: number;
  prize_pool: number;
  max_participants: number;
  current_participants: number;
  format: string;
  winner_user_id?: string;
}

interface TournamentParticipant {
  id: string;
  user_id: string;
  username?: string;
  registered_at: string;
}

interface BracketProgress {
  id: string;
  tournament_id: string;
  current_round: number;
  total_rounds: number;
  bracket_type: string;
}

const TournamentBracket = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [bracketProgress, setBracketProgress] = useState<BracketProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(null);
  const [generatingBracket, setGeneratingBracket] = useState(false);

  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      
      // Fetch tournament details
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select(`
          *,
          games(name, short_name)
        `)
        .eq('id', tournamentId)
        .single();

      if (tournamentError) {
        console.error("Tournament error:", tournamentError);
        toast.error("Tournament not found");
        navigate("/my-tournaments");
        return;
      }

      setTournament(tournamentData);

      // Fetch tournament participants with user profiles
      const { data: participantsData, error: participantsError } = await supabase
        .from('tournament_participants')
        .select(`
          id,
          user_id,
          registered_at
        `)
        .eq('tournament_id', tournamentId);

      if (participantsError) {
        console.error("Error fetching participants:", participantsError);
        // Handle case where tournament_participants table might not have the expected structure
        if (participantsError.message.includes('column') || participantsError.message.includes('relation')) {
          console.warn("Tournament participants table may have different structure, using fallback");
        }
        setParticipants([]); // Set empty array on error
      } else {
        // Fetch profiles separately if we have participants
        if (participantsData && participantsData.length > 0) {
          const userIds = participantsData.map(p => p.user_id);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, username')
            .in('user_id', userIds);
          
          const participantsWithUsernames = participantsData.map(p => ({
            ...p,
            username: profilesData?.find(profile => profile.user_id === p.user_id)?.username || `Player_${p.user_id.slice(-4)}`
          }));
          setParticipants(participantsWithUsernames);
        } else {
          setParticipants([]);
        }
      }

      // Fetch bracket progress
      const { data: bracketData, error: bracketError } = await supabase
        .from('tournament_bracket_progress')
        .select('*')
        .eq('tournament_id', tournamentId)
        .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully

      if (bracketError) {
        console.error("Error fetching bracket progress:", bracketError);
        setBracketProgress(null);
      } else {
        setBracketProgress(bracketData);
      }

      // Fetch tournament matches
      const { data: matchesData, error: matchesError } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round_number')
        .order('match_number');

      if (matchesError) {
        console.error("Error fetching matches:", matchesError);
        setMatches([]);
      } else if (matchesData) {
        // Collect all unique player IDs from individual players and team members
        const allPlayerIds = new Set();
        matchesData.forEach(match => {
          if (match.player1_id) allPlayerIds.add(match.player1_id);
          if (match.player2_id) allPlayerIds.add(match.player2_id);
          if (match.team1_members) {
            match.team1_members.forEach(memberId => allPlayerIds.add(memberId));
          }
          if (match.team2_members) {
            match.team2_members.forEach(memberId => allPlayerIds.add(memberId));
          }
        });
        
        // Fetch profiles for all players
        let profilesMap = new Map();
        if (allPlayerIds.size > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, username')
            .in('user_id', Array.from(allPlayerIds));
          
          if (profilesData) {
            profilesData.forEach(profile => {
              profilesMap.set(profile.user_id, profile.username);
            });
          }
        }
        
        // Map matches with player names and team information
        const matchesWithNames = matchesData.map(match => ({
          ...match,
          round: match.round_number,
          player1_name: match.player1_id ? 
            (profilesMap.get(match.player1_id) || `Player_${match.player1_id.slice(-4)}`) : 
            undefined,
          player2_name: match.player2_id ? 
            (profilesMap.get(match.player2_id) || `Player_${match.player2_id.slice(-4)}`) : 
            undefined,
          team1_names: match.team1_members ? 
            match.team1_members.map(memberId => 
              profilesMap.get(memberId) || `Player_${memberId.slice(-4)}`
            ) : undefined,
          team2_names: match.team2_members ? 
            match.team2_members.map(memberId => 
              profilesMap.get(memberId) || `Player_${memberId.slice(-4)}`
            ) : undefined
        }));
        setMatches(matchesWithNames);
      } else {
        setMatches([]);
      }
      
    } catch (error) {
      console.error("Error fetching tournament:", error);
      toast.error("Failed to load tournament data");
    } finally {
      setLoading(false);
    }
  };

  const generateBracket = async () => {
    if (!tournamentId || !tournament) return;
    
    try {
      setGeneratingBracket(true);
      
      // Call the database function to generate bracket
      const { error } = await supabase.rpc('generate_tournament_bracket', {
        tournament_id_param: tournamentId
      });
      
      if (error) {
        console.error('Bracket generation error:', error);
        if (error.message.includes('function') || error.message.includes('does not exist')) {
          toast.error('Tournament bracket tables are not set up. Please run the database migration first.');
        } else {
          toast.error(`Failed to generate bracket: ${error.message}`);
        }
        return;
      }
      
      toast.success('Tournament bracket generated successfully!');
      
      // Refresh the data
      await fetchTournamentData();
      
    } catch (error) {
      console.error('Error generating bracket:', error);
      toast.error('Failed to generate tournament bracket');
    } finally {
      setGeneratingBracket(false);
    }
  };

  const setMatchResult = async (matchId: string, winnerId: string, player1Score?: number, player2Score?: number) => {
    try {
      const { error } = await supabase.rpc('set_tournament_match_result', {
        match_id_param: matchId,
        winner_id_param: winnerId,
        player1_score_param: player1Score,
        player2_score_param: player2Score
      });
      
      if (error) {
        toast.error(`Failed to set match result: ${error.message}`);
        return;
      }
      
      toast.success('Match result updated successfully!');
      
      // Refresh the data
      await fetchTournamentData();
      
    } catch (error) {
      console.error('Error setting match result:', error);
      toast.error('Failed to update match result');
    }
  };

  useEffect(() => {
    if (tournamentId) {
      fetchTournamentData();
    }
  }, [tournamentId]);

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success text-success-foreground';
      case 'in_progress': return 'bg-warning text-warning-foreground animate-pulse';
      case 'pending': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRoundName = (round: number, totalRounds?: number) => {
    const total = totalRounds || bracketProgress?.total_rounds || 1;
    const roundsLeft = total - round + 1;
    if (roundsLeft === 1) return "Final";
    if (roundsLeft === 2) return "Semi-Final";
    if (roundsLeft === 3) return "Quarter-Final";
    return `Round ${round}`;
  };

  const getCurrentRoundName = () => {
    if (!bracketProgress) return "Not Started";
    return getRoundName(bracketProgress.current_round, bracketProgress.total_rounds);
  };

  const MatchCard = ({ match }: { match: TournamentMatch }) => {
    const isTeamMatch = match.team_size && match.team_size > 1;
    
    const renderTeamInfo = (teamNames: string[] | undefined, playerName: string | undefined, isWinner: boolean) => {
      if (isTeamMatch && teamNames && teamNames.length > 0) {
        return (
          <div className="space-y-1">
            <div className="font-medium text-sm">
              {teamNames[0]} (C) {/* Captain */}
            </div>
            {teamNames.slice(1).map((name, index) => (
              <div key={index} className="text-xs text-muted-foreground ml-2">
                {name}
              </div>
            ))}
          </div>
        );
      }
      return (
        <span className="font-medium text-sm">
          {playerName || "TBD"}
        </span>
      );
    };
    
    return (
      <Card 
        className={`glass-card cursor-pointer transition-all hover:scale-105 ${
          selectedMatch?.id === match.id ? 'ring-2 ring-primary' : ''
        }`}
        onClick={() => setSelectedMatch(match)}
      >
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge className={getMatchStatusColor(match.status)} size="sm">
                {match.status === 'bye' ? 'BYE' : match.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <div className="flex items-center gap-2">
                {isTeamMatch && (
                  <Badge variant="outline" size="sm">
                    {match.team_size}v{match.team_size}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  Match #{match.match_number}
                </span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className={`flex items-center justify-between p-2 rounded ${
                match.winner_id === match.player1_id || 
                (match.team1_members && match.team1_members.includes(match.winner_id || '')) 
                  ? 'bg-success/20 border border-success/30' : 'bg-muted/50'
              }`}>
                {renderTeamInfo(match.team1_names, match.player1_name, 
                  match.winner_id === match.player1_id || 
                  (match.team1_members && match.team1_members.includes(match.winner_id || '')))
                }
                <div className="flex items-center gap-2">
                  {match.player1_score !== undefined && match.status === 'completed' && (
                    <span className="font-bold">{match.player1_score}</span>
                  )}
                  {(match.winner_id === match.player1_id || 
                    (match.team1_members && match.team1_members.includes(match.winner_id || ''))) && (
                    <Crown className="h-3 w-3 text-success" />
                  )}
                </div>
              </div>
              
              {match.status !== 'bye' && (
                <div className={`flex items-center justify-between p-2 rounded ${
                  match.winner_id === match.player2_id || 
                  (match.team2_members && match.team2_members.includes(match.winner_id || '')) 
                    ? 'bg-success/20 border border-success/30' : 'bg-muted/50'
                }`}>
                  {renderTeamInfo(match.team2_names, match.player2_name, 
                    match.winner_id === match.player2_id || 
                    (match.team2_members && match.team2_members.includes(match.winner_id || '')))
                  }
                  <div className="flex items-center gap-2">
                    {match.player2_score !== undefined && match.status === 'completed' && (
                      <span className="font-bold">{match.player2_score}</span>
                    )}
                    {(match.winner_id === match.player2_id || 
                      (match.team2_members && match.team2_members.includes(match.winner_id || ''))) && (
                      <Crown className="h-3 w-3 text-success" />
                    )}
                  </div>
                </div>
              )}
            </div>
          
          {match.scheduled_time && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {new Date(match.scheduled_time).toLocaleTimeString()}
            </div>
          )}
          
          {match.started_at && match.status === 'in_progress' && (
            <div className="flex items-center gap-1 text-xs text-success">
              <Play className="h-3 w-3" />
              Started {new Date(match.started_at).toLocaleTimeString()}
            </div>
          )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!tournament) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Tournament Not Found</h2>
          <Button onClick={() => navigate("/my-tournaments")}>
            Back to Tournaments
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const totalRounds = bracketProgress?.total_rounds || 0;
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);
  const hasMatches = matches.length > 0;
  const canGenerateBracket = tournament?.status === 'registration' && tournament?.current_participants >= 2;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/my-tournaments")}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Tournaments
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{tournament.name} - Tournament Bracket</h1>
            <p className="text-muted-foreground">
              {tournament.games?.short_name} • {tournament.format} Format
            </p>
          </div>
        </div>

        {/* Tournament Info */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  ₦{tournament.prize_pool.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Prize Pool</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {tournament.current_participants}/{tournament.max_participants}
                </div>
                <div className="text-sm text-muted-foreground">Players</div>
              </div>
              <div className="text-center">
                <Badge className={
                  tournament.status === 'live' ? 'bg-destructive text-destructive-foreground animate-pulse' :
                  tournament.status === 'completed' ? 'bg-success text-success-foreground' :
                  'bg-warning text-warning-foreground'
                }>
                  {tournament.status.toUpperCase()}
                </Badge>
                <div className="text-sm text-muted-foreground mt-1">Status</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">
                  {new Date(tournament.start_date).toLocaleDateString()}
                </div>
                <div className="text-sm text-muted-foreground">Start Date</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-success">
                  {getCurrentRoundName()}
                </div>
                <div className="text-sm text-muted-foreground">Current Round</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generate Bracket Button or Setup Instructions */}
        {!hasMatches && canGenerateBracket && (
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold mb-2">Generate Tournament Bracket</h3>
                  <p className="text-muted-foreground">
                    Ready to start the tournament? Generate the bracket to create matches for all {tournament.current_participants} participants.
                  </p>
                </div>
                <Button 
                  onClick={generateBracket}
                  disabled={generatingBracket}
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  {generatingBracket ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Bracket...
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4 mr-2" />
                      Generate Bracket
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Setup Instructions */}
        {!hasMatches && !canGenerateBracket && participants.length === 0 && (
          <Card className="glass-card border-warning/20">
            <CardContent className="p-6 text-center">
              <div className="space-y-4">
                <div>
                  <Settings className="h-12 w-12 mx-auto text-warning mb-4" />
                  <h3 className="text-lg font-bold mb-2">Database Setup Required</h3>
                  <p className="text-muted-foreground mb-4">
                    To use tournament brackets, you need to run the database migration first.
                  </p>
                  <div className="text-left bg-muted/20 p-4 rounded-lg text-sm">
                    <p className="font-semibold mb-2">Run this SQL in your Supabase SQL Editor:</p>
                    <code className="text-xs break-all">
                      See create_tournament_tables.sql file in your project root
                    </code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bracket Tabs */}
        <Tabs defaultValue="bracket" className="w-full">
          <TabsList className="glass-card">
            <TabsTrigger value="bracket">Tournament Bracket</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="bracket" className="mt-6">
            <div className="space-y-6">
              {/* Bracket Visualization */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Tournament Bracket
                  </CardTitle>
                  <CardDescription>
                    Click on any match to view details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {hasMatches ? (
                    <div className="overflow-x-auto">
                      <div className="flex gap-8 min-w-fit">
                        {rounds.map((round) => {
                          const roundMatches = matches.filter(m => m.round_number === round);
                          return (
                            <div key={round} className="flex flex-col gap-4 min-w-[200px]">
                              <h3 className="text-lg font-bold text-center mb-4">
                                {getRoundName(round, totalRounds)}
                              </h3>
                              {roundMatches.map((match) => (
                                <MatchCard key={match.id} match={match} />
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Bracket Generated</h3>
                      <p className="text-muted-foreground">
                        {canGenerateBracket 
                          ? "Generate the tournament bracket to see matches here."
                          : "Bracket will be available once the tournament starts."}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Match Details */}
              {selectedMatch && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Match Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2">Match Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Round:</span>
                            <span>{getRoundName(selectedMatch.round_number, totalRounds)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Match:</span>
                            <span>#{selectedMatch.match_number}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge className={getMatchStatusColor(selectedMatch.status)} size="sm">
                              {selectedMatch.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">
                          {selectedMatch.team_size && selectedMatch.team_size > 1 ? 'Teams' : 'Players'}
                        </h4>
                        <div className="space-y-3">
                          <div className={`p-3 rounded-lg ${
                            selectedMatch.winner_id === selectedMatch.player1_id || 
                            (selectedMatch.team1_members && selectedMatch.team1_members.includes(selectedMatch.winner_id || '')) ? 
                            'bg-success/20 border border-success/30' : 'bg-muted/50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                {selectedMatch.team_size && selectedMatch.team_size > 1 && selectedMatch.team1_names ? (
                                  <div className="space-y-1">
                                    <div className="font-medium flex items-center gap-2">
                                      Team 1
                                      {(selectedMatch.winner_id === selectedMatch.player1_id || 
                                        (selectedMatch.team1_members && selectedMatch.team1_members.includes(selectedMatch.winner_id || ''))) && (
                                        <Crown className="h-4 w-4 text-success" />
                                      )}
                                    </div>
                                    {selectedMatch.team1_names.map((name, index) => (
                                      <div key={index} className={`text-sm ${
                                        index === 0 ? 'font-medium' : 'text-muted-foreground ml-2'
                                      }`}>
                                        {name} {index === 0 ? '(Captain)' : ''}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="font-medium">
                                    {selectedMatch.player1_name || "TBD"}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {selectedMatch.player1_score !== undefined && (
                                  <span className="text-xl font-bold">
                                    {selectedMatch.player1_score}
                                  </span>
                                )}
                                {!(selectedMatch.team_size && selectedMatch.team_size > 1) && selectedMatch.winner_id === selectedMatch.player1_id && (
                                  <Crown className="h-4 w-4 text-success" />
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {selectedMatch.status !== 'bye' && (
                            <div className={`p-3 rounded-lg ${
                              selectedMatch.winner_id === selectedMatch.player2_id || 
                              (selectedMatch.team2_members && selectedMatch.team2_members.includes(selectedMatch.winner_id || '')) ? 
                              'bg-success/20 border border-success/30' : 'bg-muted/50'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  {selectedMatch.team_size && selectedMatch.team_size > 1 && selectedMatch.team2_names ? (
                                    <div className="space-y-1">
                                      <div className="font-medium flex items-center gap-2">
                                        Team 2
                                        {(selectedMatch.winner_id === selectedMatch.player2_id || 
                                          (selectedMatch.team2_members && selectedMatch.team2_members.includes(selectedMatch.winner_id || ''))) && (
                                          <Crown className="h-4 w-4 text-success" />
                                        )}
                                      </div>
                                      {selectedMatch.team2_names.map((name, index) => (
                                        <div key={index} className={`text-sm ${
                                          index === 0 ? 'font-medium' : 'text-muted-foreground ml-2'
                                        }`}>
                                          {name} {index === 0 ? '(Captain)' : ''}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="font-medium">
                                      {selectedMatch.player2_name || "TBD"}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {selectedMatch.player2_score !== undefined && (
                                    <span className="text-xl font-bold">
                                      {selectedMatch.player2_score}
                                    </span>
                                  )}
                                  {!(selectedMatch.team_size && selectedMatch.team_size > 1) && selectedMatch.winner_id === selectedMatch.player2_id && (
                                    <Crown className="h-4 w-4 text-success" />
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {selectedMatch.status === 'in_progress' && (
                          <Button className="w-full mt-4 bg-gradient-to-r from-primary to-accent">
                            <Eye className="h-4 w-4 mr-2" />
                            Watch Live
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="participants" className="mt-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Tournament Participants</CardTitle>
                <CardDescription>
                  {tournament.current_participants} out of {tournament.max_participants} players registered
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {participants.map((participant, index) => (
                    <Card key={participant.id} className="glass border">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                            <span className="text-white font-bold">
                              {participant.username ? participant.username.charAt(0).toUpperCase() : (index + 1).toString()}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold">{participant.username}</div>
                            <div className="text-sm text-muted-foreground">
                              Registered {new Date(participant.registered_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Tournament Schedule</CardTitle>
                <CardDescription>
                  Upcoming matches and important dates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {matches.filter(m => m.status === 'pending' || m.status === 'in_progress').length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Scheduled Matches</h3>
                      <p className="text-muted-foreground">
                        {hasMatches ? "All matches have been completed." : "Generate the bracket to see the schedule."}
                      </p>
                    </div>
                  ) : (
                    matches.filter(m => m.status === 'pending' || m.status === 'in_progress').map((match) => (
                      <Card key={match.id} className="glass border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">
                                {getRoundName(match.round_number, totalRounds)} - Match #{match.match_number}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {match.player1_name || "TBD"} vs {match.status === 'bye' ? "(BYE)" : (match.player2_name || "TBD")}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={getMatchStatusColor(match.status)} size="sm">
                                {match.status === 'bye' ? 'BYE' : match.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <div className="text-sm text-muted-foreground mt-1">
                                {match.scheduled_time 
                                  ? new Date(match.scheduled_time).toLocaleString()
                                  : match.started_at 
                                  ? `Started: ${new Date(match.started_at).toLocaleString()}`
                                  : "Time TBD"}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default TournamentBracket;