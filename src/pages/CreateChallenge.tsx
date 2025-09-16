import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Target, Gamepad2, Users, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

// Import game covers for preview
import codmCover from "@/assets/codm-cover.jpg";
import pubgCover from "@/assets/pubg-cover.jpg";
import freefireCover from "@/assets/freefire-cover.jpg";
import eafcCover from "@/assets/eafc-cover.jpg";
import pesCover from "@/assets/pes-cover.jpg";

const CreateChallenge = () => {
  const navigate = useNavigate();
  const [challengeData, setChallengeData] = useState({
    game: "",
    mode: "",
    format: "",
    stake: "",
    rules: "",
    map: "",
    duration: ""
  });

  const gameOptions = [
    { id: "call-of-duty-mobile", name: "Call of Duty: Mobile", shortName: "CODM", cover: codmCover },
    { id: "pubg-mobile", name: "PUBG Mobile", shortName: "PUBG", cover: pubgCover },
    { id: "free-fire", name: "Free Fire", shortName: "FF", cover: freefireCover },
    { id: "ea-fc-mobile", name: "EA FC Mobile", shortName: "EA FC", cover: eafcCover },
    { id: "pes-mobile", name: "PES Mobile", shortName: "PES", cover: pesCover }
  ];

  const gameModes = {
    "call-of-duty-mobile": [
      { name: "Search & Destroy", formats: ["1v1", "2v2", "3v3", "5v5"], maps: ["Standoff", "Crash", "Crossfire", "Raid", "Summit"] },
      { name: "Hardpoint", formats: ["2v2", "3v3", "5v5"], maps: ["Nuketown", "Raid", "Hijacked", "Firing Range", "Takeoff"] },
      { name: "Domination", formats: ["2v2", "3v3", "5v5"], maps: ["Terminal", "Hackney Yard", "Meltdown", "Tunisia", "Highrise"] },
      { name: "Team Deathmatch", formats: ["1v1", "2v2", "3v3", "5v5"], maps: ["Killhouse", "Shipment", "Rust", "Dome", "Coastal"] },
      { name: "Gunfight", formats: ["1v1", "2v2"], maps: ["King", "Gulag Showers", "Pine", "Docks", "Saloon"] },
      { name: "Snipers Only", formats: ["1v1", "2v2", "3v3"], maps: ["Crossfire", "Highrise", "Oasis", "Monastery", "Tunisia"] },
      { name: "Battle Royale Kill Race", formats: ["Solo", "Duo", "Squad"], maps: ["Isolated", "Alcatraz"] }
    ],
    "pubg-mobile": [
      { name: "Battle Royale Kill Race", formats: ["Solo", "Duo", "Squad"], maps: ["Erangel", "Miramar", "Sanhok", "Livik", "Vikendi"] },
      { name: "Team Deathmatch", formats: ["2v2", "4v4"], maps: ["Warehouse", "Library", "Hangar", "Ruins"] },
      { name: "Arena Challenges", formats: ["2v2", "4v4"], maps: ["Payload", "Arena Training", "Domination Maps"] }
    ],
    "free-fire": [
      { name: "Battle Royale Kill Race", formats: ["Solo", "Duo", "Squad"], maps: ["Bermuda", "Kalahari", "Purgatory", "Alpine"] },
      { name: "Clash Squad", formats: ["4v4"], maps: ["Factory", "Clock Tower", "Bermuda Peak", "Kalahari Base"] },
      { name: "Lone Wolf", formats: ["1v1"], maps: ["Iron Dome", "Colosseum"] }
    ],
    "ea-fc-mobile": [
      { name: "Head-to-Head", formats: ["1v1"], maps: ["Allianz Arena", "Old Trafford", "Santiago Bernabéu", "Parc des Princes"] },
      { name: "VS Attack", formats: ["1v1"], maps: ["Various Stadiums"] },
      { name: "Goal Challenges", formats: ["1v1"], maps: ["Training Ground", "Mini Pitch"] }
    ],
    "pes-mobile": [
      { name: "Online Match", formats: ["1v1"], maps: ["Camp Nou", "San Siro", "Emirates Stadium", "Signal Iduna Park"] },
      { name: "Quick Match", formats: ["1v1"], maps: ["Various Stadiums"] },
      { name: "Skill Challenges", formats: ["1v1"], maps: ["Training Pitch"] }
    ]
  };

  const selectedGame = gameOptions.find(game => game.id === challengeData.game);
  const availableModes = challengeData.game ? gameModes[challengeData.game as keyof typeof gameModes] : [];
  const selectedMode = availableModes.find(mode => mode.name === challengeData.mode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!challengeData.game || !challengeData.mode || !challengeData.format || !challengeData.stake) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (parseInt(challengeData.stake) < 100) {
      toast.error("Minimum stake is ₦100");
      return;
    }
    
    toast.success("Challenge created successfully! Waiting for opponents...");
    navigate("/matches");
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
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                      {gameOptions.map((game) => (
                        <div
                          key={game.id}
                          className={`cursor-pointer rounded-lg border-2 transition-all ${
                            challengeData.game === game.id
                              ? 'border-primary bg-primary/10'
                              : 'border-muted hover:border-primary/50'
                          }`}
                          onClick={() => setChallengeData(prev => ({ ...prev, game: game.id, mode: "", format: "" }))}
                        >
                          <div className="p-3 text-center">
                            <img 
                              src={game.cover} 
                              alt={game.name}
                              className="w-full h-20 object-cover rounded mb-2"
                            />
                            <div className="text-sm font-semibold">{game.shortName}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Game Mode */}
                  {challengeData.game && (
                    <div>
                      <Label htmlFor="mode">Game Mode *</Label>
                      <Select value={challengeData.mode} onValueChange={(value) => setChallengeData(prev => ({ ...prev, mode: value, format: "" }))}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Choose game mode" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableModes.map((mode) => (
                            <SelectItem key={mode.name} value={mode.name}>
                              {mode.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Format Selection */}
                  {challengeData.mode && selectedMode && (
                    <div>
                      <Label>Match Format *</Label>
                      <RadioGroup 
                        value={challengeData.format} 
                        onValueChange={(value) => setChallengeData(prev => ({ ...prev, format: value }))}
                        className="flex flex-wrap gap-4 mt-2"
                      >
                        {selectedMode.formats.map((format) => (
                          <div key={format} className="flex items-center space-x-2">
                            <RadioGroupItem value={format} id={format} />
                            <Label htmlFor={format} className="cursor-pointer">
                              <Badge variant="outline">{format}</Badge>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  {/* Map Selection */}
                  {challengeData.format && selectedMode && (
                    <div>
                      <Label htmlFor="map">Map/Stadium (Optional)</Label>
                      <Select value={challengeData.map} onValueChange={(value) => setChallengeData(prev => ({ ...prev, map: value }))}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Choose map (or leave random)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="random">Random Map</SelectItem>
                          {selectedMode.maps.map((map) => (
                            <SelectItem key={map} value={map}>
                              {map}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Stake Amount */}
                  <div>
                    <Label htmlFor="stake">Stake Amount (₦) *</Label>
                    <Input
                      id="stake"
                      type="number"
                      placeholder="Enter stake amount (min ₦100)"
                      value={challengeData.stake}
                      onChange={(e) => setChallengeData(prev => ({ ...prev, stake: e.target.value }))}
                      min="100"
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

                  <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent glow-primary" size="lg">
                    <Target className="mr-2 h-5 w-5" />
                    Create Challenge
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
                        src={selectedGame.cover} 
                        alt={selectedGame.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                      <h4 className="font-bold text-lg">{selectedGame.name}</h4>
                    </div>
                    
                    <div className="space-y-3">
                      {challengeData.mode && (
                        <div>
                          <span className="text-foreground/60 text-sm">Mode:</span>
                          <div className="font-semibold">{challengeData.mode}</div>
                        </div>
                      )}
                      
                      {challengeData.format && (
                        <div>
                          <span className="text-foreground/60 text-sm">Format:</span>
                          <div className="font-semibold">
                            <Badge variant="secondary">{challengeData.format}</Badge>
                          </div>
                        </div>
                      )}
                      
                      {challengeData.map && (
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