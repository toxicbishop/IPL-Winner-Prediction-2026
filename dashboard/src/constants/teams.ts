// Team color map for all tournament types
export const TEAM_COLORS: Record<string, string> = {
  // IPL Franchises
  "CSK": "#F9CD02", "MI": "#004BA0", "RCB": "#EC1C24", "KKR": "#3A225D",
  "DC": "#00008B", "PBKS": "#ED1B24", "RR": "#2D9CDB", "SRH": "#F7A721",
  "LSG": "#A2D9CE", "GT": "#1B2A4A",
  // International Men
  "India": "#004BA0", "Australia": "#FFCD00", "England": "#CE1126",
  "South Africa": "#007A4D", "Pakistan": "#115740", "New Zealand": "#000000",
  "West Indies": "#7B121C", "Sri Lanka": "#002F6C", "Afghanistan": "#0048E0",
  "Bangladesh": "#006A4E",
  // International Women
  "India Women": "#004BA0", "Australia Women": "#FFCD00", "England Women": "#CE1126",
  "South Africa Women": "#007A4D", "Pakistan Women": "#115740", "New Zealand Women": "#000000",
  "West Indies Women": "#7B121C", "Sri Lanka Women": "#002F6C",
};

// Tournament dropdown options
export const TOURNAMENTS = [
  { value: 'ipl', label: 'IPL 2026' },
  { value: 'icc_men', label: "ICC Men's T20 WC" },
  { value: 'icc_women', label: "ICC Women's T20 WC" },
] as const;

// Shared data interfaces
export interface TeamData {
  team: string;
  prob: number;
  color: string;
}

export interface ModelStat {
  name: string;
  acc: string;
  auc: string;
}

export interface ShapFeature {
  name: string;
  val: number;
}

export interface MatchFixture {
  date?: string;
  team1: string;
  team2: string;
  predicted_winner: string;
  win_probability?: number;
}

export interface IntelligenceData {
  squad_strength: Record<string, number>;
  playoff_rate: Record<string, number>;
  form_score: Record<string, number>;
}
