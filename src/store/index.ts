import { create } from 'zustand';
import { supabase, mapSeason, mapGame, mapPlayer, toSeasonRow, toGameRow, toPlayerRow } from '../lib/supabase';
import type { Season, Game, Player, LineupRankings } from '../types';

interface AppState {
  seasons: Season[];
  games: Game[];
  players: Player[];
  loading: boolean;
  initialized: boolean;

  loadUserData: (userId: string) => Promise<void>;
  clearData: () => void;

  addSeason: (data: Omit<Season, 'id' | 'createdAt'>, userId: string) => Promise<Season | null>;
  updateSeason: (id: string, data: Partial<Season>) => Promise<void>;
  deleteSeason: (id: string) => Promise<void>;

  addGame: (data: Omit<Game, 'id'>, userId: string) => Promise<void>;
  addGames: (games: Omit<Game, 'id'>[], userId: string) => Promise<void>;
  updateGame: (id: string, data: Partial<Game>) => Promise<void>;
  deleteGame: (id: string) => Promise<void>;

  addPlayer: (data: Omit<Player, 'id'>, userId: string) => Promise<void>;
  updatePlayer: (id: string, data: Partial<Player>) => Promise<void>;
  deletePlayer: (id: string) => Promise<void>;

  lineupRankings: Record<string, LineupRankings>;
  loadLineupRankings: (seasonId: string) => Promise<void>;
  saveLineupRankings: (seasonId: string, rankings: LineupRankings, userId: string) => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  seasons: [],
  games: [],
  players: [],
  loading: false,
  initialized: false,
  lineupRankings: {},

  loadUserData: async (userId) => {
    set({ loading: true });
    const [s, g, p] = await Promise.all([
      supabase.from('seasons').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('games').select('*').eq('user_id', userId),
      supabase.from('players').select('*').eq('user_id', userId),
    ]);
    set({
      seasons: (s.data ?? []).map(mapSeason),
      games: (g.data ?? []).map(mapGame),
      players: (p.data ?? []).map(mapPlayer),
      loading: false,
      initialized: true,
    });
  },

  clearData: () => set({ seasons: [], games: [], players: [], initialized: false }),

  // ── Seasons ───────────────────────────────────────────────────────────────

  addSeason: async (data, userId) => {
    const { data: row, error } = await supabase
      .from('seasons').insert(toSeasonRow(data, userId)).select().single();
    if (error || !row) return null;
    const season = mapSeason(row);
    set((s) => ({ seasons: [season, ...s.seasons] }));
    return season;
  },

  updateSeason: async (id, data) => {
    const row: Record<string, unknown> = {};
    if (data.name !== undefined) row.name = data.name;
    if (data.year !== undefined) row.year = data.year;
    if (data.teamName !== undefined) row.team_name = data.teamName;
    if (data.ageGroup !== undefined) row.age_group = data.ageGroup;
    await supabase.from('seasons').update(row).eq('id', id);
    set((s) => ({ seasons: s.seasons.map((x) => (x.id === id ? { ...x, ...data } : x)) }));
  },

  deleteSeason: async (id) => {
    await supabase.from('seasons').delete().eq('id', id);
    set((s) => ({
      seasons: s.seasons.filter((x) => x.id !== id),
      games: s.games.filter((x) => x.seasonId !== id),
      players: s.players.filter((x) => x.seasonId !== id),
    }));
  },

  // ── Games ─────────────────────────────────────────────────────────────────

  addGame: async (data, userId) => {
    const { data: row, error } = await supabase
      .from('games').insert(toGameRow(data, userId)).select().single();
    if (error || !row) return;
    set((s) => ({ games: [...s.games, mapGame(row)] }));
  },

  addGames: async (games, userId) => {
    const { data: rows, error } = await supabase
      .from('games').insert(games.map((g) => toGameRow(g, userId))).select();
    if (error || !rows) return;
    set((s) => ({ games: [...s.games, ...rows.map(mapGame)] }));
  },

  updateGame: async (id, data) => {
    const row: Record<string, unknown> = {};
    if (data.date !== undefined) row.date = data.date;
    if (data.time !== undefined) row.time = data.time;
    if (data.opponent !== undefined) row.opponent = data.opponent;
    if (data.location !== undefined) row.location = data.location;
    if (data.isHome !== undefined) row.is_home = data.isHome;
    if ('result' in data) row.result = data.result ?? null;
    if ('myScore' in data) row.my_score = data.myScore ?? null;
    if ('opponentScore' in data) row.opponent_score = data.opponentScore ?? null;
    if ('notes' in data) row.notes = data.notes ?? null;
    await supabase.from('games').update(row).eq('id', id);
    set((s) => ({ games: s.games.map((x) => (x.id === id ? { ...x, ...data } : x)) }));
  },

  deleteGame: async (id) => {
    await supabase.from('games').delete().eq('id', id);
    set((s) => ({ games: s.games.filter((x) => x.id !== id) }));
  },

  // ── Players ───────────────────────────────────────────────────────────────

  addPlayer: async (data, userId) => {
    const { data: row, error } = await supabase
      .from('players').insert(toPlayerRow(data, userId)).select().single();
    if (error || !row) return;
    set((s) => ({ players: [...s.players, mapPlayer(row)] }));
  },

  updatePlayer: async (id, data) => {
    const row: Record<string, unknown> = {};
    if (data.firstName !== undefined) row.first_name = data.firstName;
    if (data.lastName !== undefined) row.last_name = data.lastName;
    if ('number' in data) row.number = data.number ?? null;
    if (data.positions !== undefined) row.positions = data.positions;
    if ('parentName' in data) row.parent_name = data.parentName ?? null;
    if ('parentPhone' in data) row.parent_phone = data.parentPhone ?? null;
    if ('parentEmail' in data) row.parent_email = data.parentEmail ?? null;
    if ('notes' in data) row.notes = data.notes ?? null;
    await supabase.from('players').update(row).eq('id', id);
    set((s) => ({ players: s.players.map((x) => (x.id === id ? { ...x, ...data } : x)) }));
  },

  deletePlayer: async (id) => {
    await supabase.from('players').delete().eq('id', id);
    set((s) => ({ players: s.players.filter((x) => x.id !== id) }));
  },

  // ── Lineup Rankings ───────────────────────────────────────────────────────

  loadLineupRankings: async (seasonId) => {
    const { data } = await supabase
      .from('lineup_rankings')
      .select('rankings')
      .eq('season_id', seasonId)
      .single();
    set((s) => ({
      lineupRankings: { ...s.lineupRankings, [seasonId]: (data?.rankings as LineupRankings) ?? {} },
    }));
  },

  saveLineupRankings: async (seasonId, rankings, userId) => {
    await supabase.from('lineup_rankings').upsert(
      { season_id: seasonId, user_id: userId, rankings, updated_at: new Date().toISOString() },
      { onConflict: 'season_id' }
    );
    set((s) => ({ lineupRankings: { ...s.lineupRankings, [seasonId]: rankings } }));
  },
}));
