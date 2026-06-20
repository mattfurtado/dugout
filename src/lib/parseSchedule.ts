import type { Game } from '../types';

type RawRow = Record<string, string>;

function normalizeKey(k: string) {
  return k.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function parseRow(row: RawRow, seasonId: string): Omit<Game, 'id'> | null {
  const r: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) r[normalizeKey(k)] = v?.trim() ?? '';

  const date =
    r['date'] || r['gamedate'] || r['scheduleddate'] || '';
  const time =
    r['time'] || r['gametime'] || r['starttime'] || '';
  const opponent =
    r['opponent'] || r['opposingteam'] || r['vs'] || r['team'] || '';
  const location =
    r['location'] || r['field'] || r['venue'] || r['site'] || '';
  const home =
    r['home'] || r['ishome'] || r['homeoaway'] || r['homeaway'] || '';

  if (!date && !opponent) return null;

  return {
    seasonId,
    date,
    time,
    opponent,
    location,
    isHome: /^(home|h|yes|y|true|1)$/i.test(home),
  };
}

export function parseCSV(csv: string, seasonId: string): Omit<Game, 'id'>[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',');
  const games: Omit<Game, 'id'>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: RawRow = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });
    const game = parseRow(row, seasonId);
    if (game) games.push(game);
  }

  return games;
}
