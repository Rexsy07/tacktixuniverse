// Game format mapping based on game and gamemode combinations
export interface GameFormatMapping {
  [gameName: string]: {
    [gameMode: string]: string[];
  };
}

export const GAME_FORMAT_MAPPING: GameFormatMapping = {
  // Call of Duty: Mobile
  "Call of Duty: Mobile": {
    "Search & Destroy": ["1v1", "2v2", "3v3", "5v5"],
    "S&D": ["1v1", "2v2", "3v3", "5v5"],
    "Hardpoint": ["2v2", "3v3", "5v5"],
    "Domination": ["2v2", "3v3", "5v5"],
    "Team Deathmatch": ["1v1", "2v2", "3v3", "5v5"],
    "TDM": ["1v1", "2v2", "3v3", "5v5"],
    "Gunfight": ["1v1", "2v2"],
    "Snipers Only": ["1v1", "2v2", "3v3"],
    "Battle Royale Classic": ["1v1", "2v2", "4v4"],
    "Battle Royale Kill Races": ["1v1", "2v2"],
    "1vX Clutch Bets": ["1v2", "1v3", "1v4"],
    "Fastest Round Wins": ["1v1", "2v2"],
    "Speedrun": ["1v1", "2v2"]
  },

  // PUBG Mobile
  "PUBG Mobile": {
    "Battle Royale Classic": ["Solo", "Duo", "Squad"],
    "Battle Royale": ["Solo", "Duo", "Squad"],
    "Kill Races": ["Solo", "Duo", "Squad"],
    "Team Deathmatch": ["2v2", "4v4"],
    "TDM": ["2v2", "4v4"],
    "Payload": ["2v2", "4v4"],
    "Arena Challenges": ["2v2", "4v4"]
  },

  // Free Fire
  "Free Fire": {
    "Battle Royale Classic": ["1v1", "2v2", "4v4"],
    "Battle Royale": ["1v1", "2v2", "4v4"],
    "Ranked": ["1v1", "2v2", "4v4"],
    "Clash Squad": ["4v4"],
    "Lone Wolf": ["1v1"]
  },

  // Blood Strike
  "Blood Strike": {
    "Battle Royale": ["Solo", "Squad"],
    "Kill Races": ["Solo", "Squad"],
    "Team Deathmatch": ["3v3", "5v5"],
    "TDM": ["3v3", "5v5"],
    "Duel Mode": ["1v1", "2v2"]
  },

  // Sniper Strike
  "Sniper Strike": {
    "1v1 Sniper Duels": ["1v1"],
    "Sniper Deathmatch": ["1v1", "3v3", "5v5"],
    "Timed Kill Challenges": ["1v1", "3v3", "5v5"],
    "Speedrun": ["1v1"]
  },

  // EA FC Mobile
  "EA FC Mobile": {
    "Head-to-Head": ["1v1"],
    "Full Match": ["1v1"],
    "VS Attack": ["1v1"],
    "Goal Challenges": ["1v1"],
    "Penalty Duels": ["1v1"]
  },

  // eFootball / PES Mobile
  "eFootball": {
    "Online Match": ["1v1"],
    "Full Match": ["1v1"],
    "Event Mode": ["1v1"],
    "Quick Matches": ["1v1"],
    "Skill Challenges": ["1v1"],
    "Custom Bets": ["1v1"]
  },

  "PES Mobile": {
    "Online Match": ["1v1"],
    "Full Match": ["1v1"],
    "Event Mode": ["1v1"],
    "Quick Matches": ["1v1"],
    "Skill Challenges": ["1v1"],
    "Custom Bets": ["1v1"]
  }
};

/**
 * Get available formats for a specific game and gamemode combination
 * @param gameName - The name of the game
 * @param gameModeName - The name of the game mode
 * @returns Array of available formats for the combination
 */
export function getAvailableFormats(gameName?: string, gameModeName?: string): string[] {
  if (!gameName || !gameModeName) {
    return [];
  }

  // Try exact match first
  const gameMapping = GAME_FORMAT_MAPPING[gameName];
  if (gameMapping && gameMapping[gameModeName]) {
    return gameMapping[gameModeName];
  }

  // Try case-insensitive search for game
  const gameKey = Object.keys(GAME_FORMAT_MAPPING).find(
    key => key.toLowerCase().includes(gameName.toLowerCase())
  );
  
  if (gameKey) {
    const gameModes = GAME_FORMAT_MAPPING[gameKey];
    
    // Try exact mode match
    if (gameModes[gameModeName]) {
      return gameModes[gameModeName];
    }
    
    // Try case-insensitive search for gamemode
    const modeKey = Object.keys(gameModes).find(
      key => key.toLowerCase().includes(gameModeName.toLowerCase()) ||
             gameModeName.toLowerCase().includes(key.toLowerCase())
    );
    
    if (modeKey) {
      return gameModes[modeKey];
    }
  }

  // Fallback to common formats if no specific mapping found
  console.warn(`No specific format mapping found for ${gameName} - ${gameModeName}, using default formats`);
  return ["1v1", "2v2", "3v3", "5v5"];
}

/**
 * Check if a format is valid for a specific game and gamemode combination
 * @param gameName - The name of the game
 * @param gameModeName - The name of the game mode
 * @param format - The format to check
 * @returns Whether the format is valid for this combination
 */
export function isValidFormat(gameName?: string, gameModeName?: string, format?: string): boolean {
  if (!format) return false;
  
  const availableFormats = getAvailableFormats(gameName, gameModeName);
  return availableFormats.includes(format);
}

/**
 * Check if a format is team-based (requires multiple players per side)
 * @param format - The format string
 * @returns Whether the format is team-based
 */
export function isTeamFormat(format: string): boolean {
  const soloFormats = ['1v1', 'Solo'];
  return !soloFormats.includes(format);
}

/**
 * Get a user-friendly display name for formats
 * @param format - The format string
 * @returns User-friendly format name
 */
export function getFormatDisplayName(format: string): string {
  const formatMap: { [key: string]: string } = {
    "Solo": "Solo",
    "Duo": "Duo (2 Players)",
    "Squad": "Squad (4 Players)",
    "1v1": "1v1",
    "1v2": "1v2 Clutch",
    "1v3": "1v3 Clutch", 
    "1v4": "1v4 Clutch",
    "2v2": "2v2",
    "3v3": "3v3",
    "4v4": "4v4",
    "5v5": "5v5"
  };

  return formatMap[format] || format;
}
