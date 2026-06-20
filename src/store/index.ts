import { create } from 'zustand';
import { supabase, mapSeason, mapGame, mapPlayer, mapCoach, toSeasonRow, toGameRow, toPlayerRow, toCoachRow } from '../lib/supabase';
import type { Season, Game, Player, Coach, LineupRankings } from '../types';

interface AppState {
  seasons: Season[];
  games: Game[];
  players: Player[];
  coaches: Coach[];
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

  addCoach: (data: Omit<Coach, 'id'>, userId: string) => Promise<void>;
  updateCoach: (id: string, data: Partial<Coach>) => Promise<void>;
  deleteCoach: (id: string) => Promise<void>;
  createInvite: (seasonId: string, userId: string) => Promise<string | null>;

  lineupRankings: Record<string, LineupRankings>;
  loadLineupRankings: (seasonId: string, userId: string) => Promise<void>;
  saveLineupRankings: (seasonId: string, rankings: LineupRankings, userId: string) => Promise<void>;
  coachRankings: Record<string, Record<string, LineupRankings>>;
  loadCoachRankings: (seasonId: string) => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  seasons: [],
  games: [],
  players: [],
  coaches: [],
  loading: false,
  initialized: false,
  lineupRankings: {},
  coachRankings: {},

  loadUserData: async (userId) => {
    set({ loading: true });

    // Fetch owned data with explicit filter (reliable regardless of RLS session timing)
    const [s, g, p, c, memberships] = await Promise.all([
      supabase.from('seasons').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('games').select('*').eq('user_id', userId),
      supabase.from('players').select('*').eq('user_id', userId),
      supabase.from('coaches').select('*').eq('user_id', userId),
      supabase.from('season_members').select('season_id').eq('user_id', userId),
    ]);

    // For seasons the user is invited to, fetch their seasons and players via RLS member policies
    const memberIds = (memberships.data ?? []).map((m) => (m as { season_id: string }).season_id);
    const ownedSeasonIds = new Set((s.data ?? []).map((x) => (x as { id: string }).id));
    const ownedPlayerIds = new Set((p.data ?? []).map((x) => (x as { id: string }).id));

    let extraSeasons: unknown[] = [];
    let extraPlayers: unknown[] = [];
    if (memberIds.length > 0) {
      const [ms, mp] = await Promise.all([
        supabase.from('seasons').select('*').in('id', memberIds),
        supabase.from('players').select('*').in('season_id', memberIds),
      ]);
      extraSeasons = (ms.data ?? []).filter((r) => !ownedSeasonIds.has((r as { id: string }).id));
      extraPlayers = (mp.data ?? []).filter((r) => !ownedPlayerIds.has((r as { id: string }).id));
    }

    set({
      seasons: [
        ...(s.data ?? []).map(mapSeason),
        ...extraSeasons.map((r) => mapSeason(r as Parameters<typeof mapSeason>[0])),
      ],
      games: (g.data ?? []).map(mapGame),
      players: [
        ...(p.data ?? []).map(mapPlayer),
        ...extraPlayers.map((r) => mapPlayer(r as Parameters<typeof mapPlayer>[0])),
      ],
      coaches: (c.data ?? []).map(mapCoach),
      loading: false,
      initialized: true,
    });
  },

  clearData: () => set({ seasons: [], games: [], players: [], coaches: [], initialized: false }),

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
      coaches: s.coaches.filter((x) => x.seasonId !== id),
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

  // ── Coaches ───────────────────────────────────────────────────────────────

  addCoach: async (data, userId) => {
    const { data: row, error } = await supabase
      .from('coaches').insert(toCoachRow(data, userId)).select().single();
    if (error || !row) return;
    set((s) => ({ coaches: [...s.coaches, mapCoach(row)] }));
  },

  updateCoach: async (id, data) => {
    const row: Record<string, unknown> = {};
    if (data.name !== undefined) row.name = data.name;
    if (data.role !== undefined) row.role = data.role;
    if ('phone' in data) row.phone = data.phone ?? null;
    if ('email' in data) row.email = data.email ?? null;
    await supabase.from('coaches').update(row).eq('id', id);
    set((s) => ({ coaches: s.coaches.map((x) => (x.id === id ? { ...x, ...data } : x)) }));
  },

  deleteCoach: async (id) => {
    await supabase.from('coaches').delete().eq('id', id);
    set((s) => ({ coaches: s.coaches.filter((x) => x.id !== id) }));
  },

  createInvite: async (seasonId, userId) => {
    const { data, error } = await supabase
      .from('season_invites')
      .upsert({ season_id: seasonId, user_id: userId }, { onConflict: 'season_id' })
      .select('id')
      .single();
    if (error || !data) return null;
    return data.id as string;
  },

  // ── Lineup Rankings ───────────────────────────────────────────────────────

  loadLineupRankings: async (seasonId, userId) => {
    const { data } = await supabase
      .from('lineup_rankings')
      .select('rankings')
      .eq('season_id', seasonId)
      .eq('user_id', userId)
      .single();
    set((s) => ({
      lineupRankings: { ...s.lineupRankings, [seasonId]: (data?.rankings as LineupRankings) ?? {} },
    }));
  },

  saveLineupRankings: async (seasonId, rankings, userId) => {
    await supabase.from('lineup_rankings').upsert(
      { season_id: seasonId, user_id: userId, rankings, updated_at: new Date().toISOString() },
      { onConflict: 'season_id,user_id' }
    );
    set((s) => ({ lineupRankings: { ...s.lineupRankings, [seasonId]: rankings } }));
  },

  loadCoachRankings: async (seasonId) => {
    const { data } = await supabase
      .from('lineup_rankings')
      .select('user_id, rankings')
      .eq('season_id', seasonId);
    const byCoach: Record<string, LineupRankings> = {};
    for (const row of data ?? []) byCoach[row.user_id] = row.rankings as LineupRankings;
    set((s) => ({ coachRankings: { ...s.coachRankings, [seasonId]: byCoach } }));
  },
}));
