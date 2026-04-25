// Logo filename map — IPL franchises only (real marks live in /public/logos/)
export const TEAM_LOGOS: Record<string, string> = {
  CSK:  '/logos/CSK.svg',
  MI:   '/logos/MI.svg',
  RCB:  '/logos/RCB.svg',
  KKR:  '/logos/KKR.svg',
  DC:   '/logos/DC.svg',
  PBKS: '/logos/PBKS.svg',
  RR:   '/logos/RR.svg',
  SRH:  '/logos/SRH.svg',
  LSG:  '/logos/LSG.svg',
  GT:   '/logos/GT.svg',
  // International Teams (Real logos in /assets/logos/)
  IND:  '/assets/logos/IND.png',
  PAK:  '/assets/logos/PAK.png',
  AUS:  '/assets/logos/AUS.png',
  ENG:  '/assets/logos/ENG.png',
  RSA:  '/assets/logos/RSA.png',
  NZL:  '/assets/logos/NZL.png',
  WI:   '/assets/logos/WI.png',
  SL:   '/assets/logos/SL.png',
  AFG:  '/assets/logos/AFG.png',
  BAN:  '/assets/logos/BAN.png',
  IRE:  '/assets/logos/IRE.png',
  NED:  '/assets/logos/NED.png',
  NAM:  '/assets/logos/NAM.png',
  USA:  '/assets/logos/USA.png',
  CAN:  '/assets/logos/CAN.png',
  UGA:  '/assets/logos/UGA.png',
};

// Full name → short code, for when the backend returns human names
const TEAM_NAME_TO_CODE: Record<string, string> = {
  'Chennai Super Kings': 'CSK',
  'Mumbai Indians': 'MI',
  'Royal Challengers Bengaluru': 'RCB',
  'Royal Challengers Bangalore': 'RCB',
  'Kolkata Knight Riders': 'KKR',
  'Delhi Capitals': 'DC',
  'Punjab Kings': 'PBKS',
  'Rajasthan Royals': 'RR',
  'Sunrisers Hyderabad': 'SRH',
  'Lucknow Super Giants': 'LSG',
  'Gujarat Titans': 'GT',
  'India': 'IND',
  'Pakistan': 'PAK',
  'Australia': 'AUS',
  'England': 'ENG',
  'South Africa': 'RSA',
  'New Zealand': 'NZL',
  'West Indies': 'WI',
  'Sri Lanka': 'SL',
  'Afghanistan': 'AFG',
  'Bangladesh': 'BAN',
  'Ireland': 'IRE',
  'Netherlands': 'NED',
  'Namibia': 'NAM',
  'USA': 'USA',
  'Canada': 'CAN',
  'Uganda': 'UGA',
  // Women Variants
  'India Women': 'IND',
  'Pakistan Women': 'PAK',
  'Australia Women': 'AUS',
  'England Women': 'ENG',
  'South Africa Women': 'RSA',
  'New Zealand Women': 'NZL',
  'West Indies Women': 'WI',
  'Sri Lanka Women': 'SL',
};

export function getTeamLogo(codeOrName: string): string | undefined {
  if (TEAM_LOGOS[codeOrName]) return TEAM_LOGOS[codeOrName];
  const code = TEAM_NAME_TO_CODE[codeOrName];
  return code ? TEAM_LOGOS[code] : undefined;
}

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
