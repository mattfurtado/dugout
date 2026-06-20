import { createClient } from '@supabase/supabase-js';
import type { Season, Game, Player } from '../types';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, key);

// ── Row types (snake_case from DB) ──────────────────────────────────────────

type SeasonRow = {
  id: string; user_id: string; name: string; year: number;
  team_name: string; age_group: string; created_at: string;
};
type GameRow = {
  id: string; season_id: string; user_id: string; date: string; time: string;
  opponent: string; location: string; is_home: boolean;
  result: 'W' | 'L' | 'T' | null; my_score: number | null;
  opponent_score: number | null; notes: string | null; created_at: string;
};
type PlayerRow = {
  id: string; season_id: string; user_id: string; first_name: string;
  last_name: string; number: number | null; positions: string[];
  parent_name: string | null; parent_phone: string | null;
  parent_email: string | null; notes: string | null; created_at: string;
};

// ── Mappers ─────────────────────────────────────────────────────────────────

export const mapSeason = (r: SeasonRow): Season => ({
  id: r.id, name: r.name, year: r.year,
  teamName: r.team_name, ageGroup: r.age_group, createdAt: r.created_at,
});

export const mapGame = (r: GameRow): Game => ({
  id: r.id, seasonId: r.season_id, date: r.date, time: r.time,
  opponent: r.opponent, location: r.location, isHome: r.is_home,
  result: r.result ?? undefined, myScore: r.my_score ?? undefined,
  opponentScore: r.opponent_score ?? undefined, notes: r.notes ?? undefined,
});

export const mapPlayer = (r: PlayerRow): Player => ({
  id: r.id, seasonId: r.season_id, firstName: r.first_name,
  lastName: r.last_name, number: r.number ?? undefined,
  positions: r.positions as Player['positions'],
  parentName: r.parent_name ?? undefined, parentPhone: r.parent_phone ?? undefined,
  parentEmail: r.parent_email ?? undefined, notes: r.notes ?? undefined,
});

// ── Insert payloads ──────────────────────────────────────────────────────────

export const toSeasonRow = (d: Omit<Season, 'id' | 'createdAt'>, userId: string) => ({
  name: d.name, year: d.year, team_name: d.teamName,
  age_group: d.ageGroup, user_id: userId,
});

export const toGameRow = (d: Omit<Game, 'id'>, userId: string) => ({
  season_id: d.seasonId, date: d.date, time: d.time, opponent: d.opponent,
  location: d.location, is_home: d.isHome, result: d.result ?? null,
  my_score: d.myScore ?? null, opponent_score: d.opponentScore ?? null,
  notes: d.notes ?? null, user_id: userId,
});

export const toPlayerRow = (d: Omit<Player, 'id'>, userId: string) => ({
  season_id: d.seasonId, first_name: d.firstName, last_name: d.lastName,
  number: d.number ?? null, positions: d.positions,
  parent_name: d.parentName ?? null, parent_phone: d.parentPhone ?? null,
  parent_email: d.parentEmail ?? null, notes: d.notes ?? null, user_id: userId,
});
