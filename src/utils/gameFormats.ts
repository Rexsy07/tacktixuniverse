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
    "Search & Destroy (S&D)": ["1v1", "2v2", "3v3", "5v5"],
    "S&D": ["1v1", "2v2", "3v3", "5v5"],
    "Hardpoint": ["2v2", "3v3", "5v5"],
    "Domination": ["2v2", "3v3", "5v5"],
    "Team Deathmatch": ["1v1", "2v2", "3v3", "5v5"],
    "Team Deathmatch (TDM)": ["1v1", "2v2", "3v3", "5v5"],
    "TDM": ["1v1", "2v2", "3v3", "5v5"],
    "Gunfight": ["1v1", "2v2"],
    "Snipers Only": ["1v1", "2v2", "3v3"],
    "Battle Royale Classic": ["1v1", "2v2", "4v4"],
    "Battle Royale (Classic)": ["1v1", "2v2", "4v4"],
    "Battle Royale Kill Races": ["1v1", "2v2"],
    "1vX Clutch Bets": ["1v2", "1v3", "1v4"],
    "Fastest Round Wins": ["1v1", "2v2"],
    "Fastest Round Wins (Speedrun)": ["1v1", "2v2"],
    "Speedrun": ["1v1", "2v2"]
  },

  // PUBG Mobile
  "PUBG Mobile": {
    "Battle Royale Classic": ["1v1", "2v2", "4v4"],
    "Battle Royale (Classic)": ["1v1", "2v2", "4v4"],
    "Battle Royale": ["1v1", "2v2", "4v4"],
    "Kill Races": ["1v1", "2v2", "4v4"],
    "Team Deathmatch": ["2v2", "4v4"],
    "TDM": ["2v2", "4v4"],
    "TDM (Team Deathmatch)": ["2v2", "4v4"],
    "Payload": ["2v2", "4v4"],
    "Payload / Arena Challenges": ["2v2", "4v4"],
    "Arena Challenges": ["2v2", "4v4"]
  },

  // Free Fire
  "Free Fire": {
    "Battle Royale Classic": ["1v1", "2v2", "4v4"],
    "Battle Royale": ["1v1", "2v2", "4v4"],
    "Battle Royale (Classic & Ranked)": ["1v1", "2v2", "4v4"],
    "Ranked": ["1v1", "2v2", "4v4"],
    "Clash Squad": ["4v4"],
    "Lone Wolf": ["1v1"]
  },

  // Blood Strike
  "Blood Strike": {
    "Battle Royale": ["1v1", "4v4"],
    "Kill Races": ["1v1", "4v4"],
    "Team Deathmatch": ["3v3", "5v5"],
    "Team Deathmatch (TDM)": ["3v3", "5v5"],
    "TDM": ["3v3", "5v5"],
    "Duel Mode": ["1v1", "2v2"]
  },

  // Sniper Strike
  "Sniper Strike": {
    "Sniper Duels": ["1v1"],
    "1v1 Sniper Duels": ["1v1"],
    "Sniper Deathmatch": ["1v1", "3v3", "5v5"],
    "Timed Kill Challenges": ["1v1"],
    "Timed Kill Challenges (Speedrun)": ["1v1"],
    "Speedrun": ["1v1"]
  },

  // EA FC Mobile
  "EA FC Mobile": {
    "Head-to-Head": ["1v1"],
    "Head-to-Head (Full Match)": ["1v1"],
    "Full Match": ["1v1"],
    "VS Attack": ["1v1"],
    "Goal Challenges": ["1v1"],
    "Penalty Duels": ["1v1"]
  },

  // eFootball / PES Mobile
  "eFootball": {
    "Online Match": ["1v1"],
    "Online Match (Full Match)": ["1v1"],
    "Full Match": ["1v1"],
    "Event Mode": ["1v1"],
    "Event Mode / Quick Matches": ["1v1"],
    "Quick Matches": ["1v1"],
    "Skill Challenges": ["1v1"],
    "Skill Challenges / Custom Bets": ["1v1"],
    "Custom Bets": ["1v1"]
  },

  "PES Mobile": {
    "Online Match": ["1v1"],
    "Online Match (Full Match)": ["1v1"],
    "Full Match": ["1v1"],
    "Event Mode": ["1v1"],
    "Event Mode / Quick Matches": ["1v1"],
    "Quick Matches": ["1v1"],
    "Skill Challenges": ["1v1"],
    "Skill Challenges / Custom Bets": ["1v1"],
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

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const gNorm = norm(gameName);
  const mNorm = norm(gameModeName);

  // Try exact match first
  const gameMapping = GAME_FORMAT_MAPPING[gameName];
  if (gameMapping) {
    if (gameMapping[gameModeName]) return gameMapping[gameModeName];
    // Try normalized keys inside the same game
    const modeKeyExact = Object.keys(gameMapping).find(k => norm(k) === mNorm);
    if (modeKeyExact) return gameMapping[modeKeyExact];
    const modeKeyFuzzy = Object.keys(gameMapping).find(k => norm(k).includes(mNorm) || mNorm.includes(norm(k)));
    if (modeKeyFuzzy) return gameMapping[modeKeyFuzzy];
  }

  // Try case-insensitive/fuzzy search for game
  const gameKey = Object.keys(GAME_FORMAT_MAPPING).find(
    key => norm(key) === gNorm || norm(key).includes(gNorm) || gNorm.includes(norm(key))
  );
  
  if (gameKey) {
    const gameModes = GAME_FORMAT_MAPPING[gameKey];
    
    // Try exact and normalized mode match
    if (gameModes[gameModeName]) return gameModes[gameModeName];
    const modeKeyExact = Object.keys(gameModes).find(k => norm(k) === mNorm);
    if (modeKeyExact) return gameModes[modeKeyExact];
    const modeKeyFuzzy = Object.keys(gameModes).find(k => norm(k).includes(mNorm) || mNorm.includes(norm(k)));
    if (modeKeyFuzzy) return gameModes[modeKeyFuzzy];
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
 * Parse format strings like "4v4", "3v3", "1v4" into team sizes
 * Also supports synonyms: Solo -> 1v1, Duo -> 2v2, Squad -> 4v4
 */
export function getTeamSizes(format: string): { a: number; b: number } {
  const norm = (format || '').trim();
  // Normalize common synonyms
  const synonyms: Record<string, string> = {
    'Solo': '1v1',
    'Duo': '2v2',
    'Squad': '4v4',
  };
  const f = synonyms[norm] || norm;

  const parts = f.split('v');
  if (parts.length === 2) {
    const a = parseInt(parts[0], 10);
    const b = parseInt(parts[1], 10);
    if (!Number.isNaN(a) && !Number.isNaN(b) && a > 0 && b > 0) {
      return { a, b };
    }
  }
  // Fallback: treat as 1v1
  return { a: 1, b: 1 };
}

/** Get total required players for a match format */
export function getTotalRequiredPlayers(format: string): number {
  const { a, b } = getTeamSizes(format);
  return a + b;
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
