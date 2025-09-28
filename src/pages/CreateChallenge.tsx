import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Target, Gamepad2, Users, Trophy, AlertCircle } from "lucide-react";
import { TeamManagement } from "@/components/TeamManagement";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { useGames } from "@/hooks/useGames";
import { useCreateChallenge } from "@/hooks/useCreateChallenge";
import { supabase } from "@/integrations/supabase/client";
import { getAvailableFormats, getFormatDisplayName, isValidFormat, isTeamFormat } from "@/utils/gameFormats";
import { withBase } from "@/utils/url";

const CreateChallenge = () => {
  const navigate = useNavigate();
  const { games, loading: gamesLoading } = useGames();
  const { createChallenge, loading: createLoading } = useCreateChallenge();
  const [gameModes, setGameModes] = useState<any[]>([]);
  const [loadingModes, setLoadingModes] = useState(false);
  
  const [challengeData, setChallengeData] = useState({
    gameId: "",
    modeId: "",
    format: "",
    stake: "",
    rules: "",
    map: "",
    duration: "",
    teamMembers: [] as string[]
  });


  const selectedGame = games.find(game => game.id === challengeData.gameId);
  const selectedMode = gameModes.find(mode => mode.id === challengeData.modeId);

  // Get available formats based on selected game and mode
  const availableFormats = useMemo(() => {
    if (!selectedGame || !selectedMode) {
      return [];
    }

    // Prefer DB-provided formats for the selected mode if available
    if (Array.isArray((selectedMode as any).formats)) {
      const raw = (selectedMode as any).formats as any[];
      const normalized = Array.from(new Set(
        raw.flatMap((f: any) => String(f).split(','))
          .map((s: string) => s.trim())
          .filter(Boolean)
      ));
      if (normalized.length > 0) {
        return normalized;
      }
    }

    // Fallback to curated mapping
    return getAvailableFormats(selectedGame.name, selectedMode.name);
  }, [selectedGame, selectedMode]);

  // Check if current format is valid for the selected game/mode combination
  const isCurrentFormatValid = useMemo(() => {
    if (!challengeData.format || !selectedGame || !selectedMode) {
      return true; // No format selected yet or missing data
    }
    // Validate against available formats derived above
    return availableFormats.includes(challengeData.format);
  }, [challengeData.format, selectedGame, selectedMode, availableFormats]);

  // Fetch game modes when game is selected
  useEffect(() => {
    if (challengeData.gameId) {
      fetchGameModes(challengeData.gameId);
    } else {
      setGameModes([]);
    }
  }, [challengeData.gameId]);

  const fetchGameModes = async (gameId: string) => {
    try {
      setLoadingModes(true);
      const { data, error } = await supabase
        .from('game_modes')
        .select('*')
        .eq('game_id', gameId);

      if (error) throw error;
      setGameModes(data || []);
    } catch (error) {
      console.error('Error fetching game modes:', error);
      toast.error('Failed to load game modes');
    } finally {
      setLoadingModes(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!challengeData.gameId || !challengeData.modeId || !challengeData.format || !challengeData.stake) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (parseInt(challengeData.stake) < 500) {
      toast.error("Minimum stake is ₦500");
      return;
    }

    // Team-based matches: Team members are optional at creation
    // Players can join open slots after the match is created

    if (!selectedMode) {
      toast.error("Please select a valid game mode");
      return;
    }
    
    // Validate format is available for the selected game/mode combination
    if (!isValidFormat(selectedGame?.name, selectedMode.name, challengeData.format)) {
      toast.error("The selected format is not available for this game mode");
      return;
    }
    
    await createChallenge({
      gameId: challengeData.gameId,
      modeId: challengeData.modeId,
      format: challengeData.format,
      mapName: challengeData.map || undefined,
      stakeAmount: parseInt(challengeData.stake),
      durationMinutes: challengeData.duration ? parseInt(challengeData.duration.replace('min', '')) : undefined,
      customRules: challengeData.rules || undefined
    });
  };

  return (
    <DashboardLayout 
      title="Create Challenge"
      description="Set up your match parameters and wait for opponents"
    >

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Challenge Form */}
          <div className="lg:col-span-2">
            <Card className="glass-card">
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Game Selection */}
                  <div>
                    <Label htmlFor="game">Select Game *</Label>
                    {gamesLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-sm text-foreground/70">Loading games...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                        {games.map((game) => (
                          <div
                            key={game.id}
                            className={`cursor-pointer rounded-lg border-2 transition-all ${
                              challengeData.gameId === game.id
                                ? 'border-primary bg-primary/10'
                                : 'border-muted hover:border-primary/50'
                            }`}
                            onClick={() => setChallengeData(prev => ({ ...prev, gameId: game.id, modeId: "", format: "" }))}
                          >
                            <div className="p-3 text-center">
                              <img 
                                src={withBase(game.cover_image_url)}
                                alt={game.name}
                                className="w-full h-20 object-cover rounded mb-2"
                              />
                              <div className="text-sm font-semibold">{game.short_name}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Game Mode */}
                  {challengeData.gameId && (
                    <div>
                      <Label htmlFor="mode">Game Mode *</Label>
                      {loadingModes ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                          <p className="mt-2 text-sm text-foreground/70">Loading modes...</p>
                        </div>
                      ) : (
                        <Select value={challengeData.modeId} onValueChange={(value) => setChallengeData(prev => ({ ...prev, modeId: value, format: "" }))}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Choose game mode" />
                          </SelectTrigger>
                          <SelectContent>
                            {gameModes.map((mode) => (
                              <SelectItem key={mode.id} value={mode.id}>
                                {mode.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}

                  {/* Format Selection */}
                  {challengeData.modeId && selectedMode && (
                    <div>
                      <Label>Match Format *</Label>
                      
                      {!isCurrentFormatValid && challengeData.format && (
                        <div className="mt-2 p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-warning" />
                          <span className="text-sm text-warning">
                            The format "{challengeData.format}" is not available for {selectedGame?.name} - {selectedMode.name}. Please select a valid format.
                          </span>
                        </div>
                      )}
                      
                      {availableFormats.length > 0 ? (
                        <RadioGroup 
                          value={isCurrentFormatValid ? challengeData.format : ""} 
                          onValueChange={(value) => setChallengeData(prev => ({ ...prev, format: value }))}
                          className="flex flex-wrap gap-4 mt-2"
                        >
                          {availableFormats.map((format: string) => (
                            <div key={format} className="flex items-center space-x-2">
                              <RadioGroupItem value={format} id={format} />
                              <Label htmlFor={format} className="cursor-pointer">
                                <Badge variant="outline">{getFormatDisplayName(format)}</Badge>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      ) : (
                        <div className="mt-2 p-4 bg-muted/20 rounded-lg text-center">
                          <p className="text-sm text-muted-foreground">
                            No formats available for this game mode. Please select a different mode.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Map Selection */}
                  {challengeData.format && (
                    <div>
                      <Label htmlFor="map">Map/Stadium (Optional)</Label>
                      <Input
                        id="map"
                        type="text"
                        placeholder="Enter map name (optional)"
                        value={challengeData.map}
                        onChange={(e) => setChallengeData(prev => ({ ...prev, map: e.target.value }))}
                        className="mt-2"
                      />
                    </div>
                  )}

                  {/* Stake Amount */}
                  <div>
                    <Label htmlFor="stake">Stake Amount (₦) *</Label>
                    <Input
                      id="stake"
                      type="number"
                      placeholder="Enter stake amount (min ₦500)"
                      value={challengeData.stake}
                      onChange={(e) => setChallengeData(prev => ({ ...prev, stake: e.target.value }))}
                      min="500"
                      className="mt-2"
                      required
                    />
                  </div>

                  {/* Match Duration */}
                  <div>
                    <Label htmlFor="duration">Match Duration (Optional)</Label>
                    <Select value={challengeData.duration} onValueChange={(value) => setChallengeData(prev => ({ ...prev, duration: value }))}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select duration (or standard rules)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard Duration</SelectItem>
                        <SelectItem value="5min">5 minutes</SelectItem>
                        <SelectItem value="10min">10 minutes</SelectItem>
                        <SelectItem value="15min">15 minutes</SelectItem>
                        <SelectItem value="20min">20 minutes</SelectItem>
                        <SelectItem value="30min">30 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Rules */}
                  <div>
                    <Label htmlFor="rules">Custom Rules (Optional)</Label>
                    <Textarea
                      id="rules"
                      placeholder="Add any specific rules or requirements..."
                      value={challengeData.rules}
                      onChange={(e) => setChallengeData(prev => ({ ...prev, rules: e.target.value }))}
                      className="mt-2"
                      rows={3}
                    />
                  </div>

                  {/* Team Management - Optional */}
                  {challengeData.format && isTeamFormat(challengeData.format) && (
                    <div>
                      <div className="p-4 bg-muted/20 rounded-lg mb-4">
                        <h4 className="font-semibold text-sm text-primary mb-2">Team Match Information</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          This is a {challengeData.format} match. You can optionally invite teammates now, 
                          or let other players join the open slots after you create the challenge.
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>Players can join freely • No pre-formed teams required</span>
                        </div>
                      </div>
                      <TeamManagement 
                        format={challengeData.format}
                        onTeamUpdate={(members) => setChallengeData(prev => ({ ...prev, teamMembers: members }))}
                      />
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary to-accent glow-primary" 
                    size="lg"
                    disabled={createLoading}
                  >
                    <Target className="mr-2 h-5 w-5" />
                    {createLoading ? "Creating Challenge..." : "Create Challenge"}
                  </Button>
                </form>
              </div>
            </Card>
          </div>

          {/* Challenge Preview */}
          <div>
            <Card className="glass-card sticky top-8">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-primary" />
                  Challenge Preview
                </h3>
                
                {selectedGame ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <img 
                        src={withBase(selectedGame.cover_image_url)}
                        alt={selectedGame.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                      <h4 className="font-bold text-lg">{selectedGame.name}</h4>
                    </div>
                    
                    <div className="space-y-3">
                      {challengeData.modeId && selectedMode && (
                        <div>
                          <span className="text-foreground/60 text-sm">Mode:</span>
                          <div className="font-semibold">{selectedMode.name}</div>
                        </div>
                      )}
                      
                      {challengeData.format && (
                        <div>
                          <span className="text-foreground/60 text-sm">Format:</span>
                          <div className="font-semibold">
                            <Badge variant="secondary">{getFormatDisplayName(challengeData.format)}</Badge>
                          </div>
                        </div>
                      )}
                      
                      {challengeData.map && challengeData.map !== "random" && (
                        <div>
                          <span className="text-foreground/60 text-sm">Map:</span>
                          <div className="font-semibold">{challengeData.map}</div>
                        </div>
                      )}
                      
                      {challengeData.stake && (
                        <div>
                          <span className="text-foreground/60 text-sm">Stake:</span>
                          <div className="font-semibold text-primary text-lg">
                            ₦{parseInt(challengeData.stake).toLocaleString()}
                          </div>
                        </div>
                      )}
                      
                      {challengeData.duration && (
                        <div>
                          <span className="text-foreground/60 text-sm">Duration:</span>
                          <div className="font-semibold">{challengeData.duration}</div>
                        </div>
                      )}
                      
                      {challengeData.rules && (
                        <div>
                          <span className="text-foreground/60 text-sm">Rules:</span>
                          <div className="font-semibold text-sm">{challengeData.rules}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-foreground/50 py-8">
                    <Gamepad2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Select a game to see preview</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
    </DashboardLayout>
  );
};

export default CreateChallenge;