import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from '../lib/nanoid';
import type { Season, Game, Player } from '../types';

interface AppState {
  seasons: Season[];
  games: Game[];
  players: Player[];
  activeSeason: string | null;

  // Seasons
  addSeason: (data: Omit<Season, 'id' | 'createdAt'>) => Season;
  updateSeason: (id: string, data: Partial<Season>) => void;
  deleteSeason: (id: string) => void;
  setActiveSeason: (id: string | null) => void;

  // Games
  addGame: (data: Omit<Game, 'id'>) => void;
  addGames: (games: Omit<Game, 'id'>[]) => void;
  updateGame: (id: string, data: Partial<Game>) => void;
  deleteGame: (id: string) => void;

  // Players
  addPlayer: (data: Omit<Player, 'id'>) => void;
  updatePlayer: (id: string, data: Partial<Player>) => void;
  deletePlayer: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      seasons: [],
      games: [],
      players: [],
      activeSeason: null,

      addSeason: (data) => {
        const season: Season = { ...data, id: nanoid(), createdAt: new Date().toISOString() };
        set((s) => ({ seasons: [...s.seasons, season] }));
        return season;
      },
      updateSeason: (id, data) =>
        set((s) => ({ seasons: s.seasons.map((x) => (x.id === id ? { ...x, ...data } : x)) })),
      deleteSeason: (id) =>
        set((s) => ({
          seasons: s.seasons.filter((x) => x.id !== id),
          games: s.games.filter((x) => x.seasonId !== id),
          players: s.players.filter((x) => x.seasonId !== id),
          activeSeason: s.activeSeason === id ? null : s.activeSeason,
        })),
      setActiveSeason: (id) => set({ activeSeason: id }),

      addGame: (data) =>
        set((s) => ({ games: [...s.games, { ...data, id: nanoid() }] })),
      addGames: (games) =>
        set((s) => ({ games: [...s.games, ...games.map((g) => ({ ...g, id: nanoid() }))] })),
      updateGame: (id, data) =>
        set((s) => ({ games: s.games.map((x) => (x.id === id ? { ...x, ...data } : x)) })),
      deleteGame: (id) =>
        set((s) => ({ games: s.games.filter((x) => x.id !== id) })),

      addPlayer: (data) =>
        set((s) => ({ players: [...s.players, { ...data, id: nanoid() }] })),
      updatePlayer: (id, data) =>
        set((s) => ({ players: s.players.map((x) => (x.id === id ? { ...x, ...data } : x)) })),
      deletePlayer: (id) =>
        set((s) => ({ players: s.players.filter((x) => x.id !== id) })),
    }),
    { name: 'dugout-storage' }
  )
);
