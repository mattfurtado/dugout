export interface Season {
  id: string;
  ownerId: string;
  name: string;
  year: number;
  teamName: string;
  ageGroup: string;
  createdAt: string;
}

export interface Game {
  id: string;
  seasonId: string;
  date: string;
  time: string;
  opponent: string;
  location: string;
  isHome: boolean;
  result?: 'W' | 'L' | 'T';
  myScore?: number;
  opponentScore?: number;
  notes?: string;
}

export interface Player {
  id: string;
  seasonId: string;
  firstName: string;
  lastName: string;
  number?: number;
  positions: Position[];
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  notes?: string;
}

export type Position =
  | 'P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH' | 'Bench';

export type CoachRole = 'Head Coach' | 'Assistant Coach' | 'Pitching Coach' | 'Team Parent' | 'Other';

export interface Coach {
  id: string;
  seasonId: string;
  name: string;
  role: CoachRole;
  phone?: string;
  email?: string;
}

export type LineupPosition = 'P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH';
export type LineupRankings = Partial<Record<LineupPosition, string[]>>;
