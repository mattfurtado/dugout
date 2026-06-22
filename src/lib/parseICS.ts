import type { Game } from '../types';

function unfold(ics: string): string {
  return ics.replace(/\r?\n[ \t]/g, '');
}

function parseDate(value: string): { date: string; time: string } {
  const clean = value.split(';').pop()?.split(':').pop() ?? value;
  if (/^\d{8}$/.test(clean)) {
    return {
      date: `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`,
      time: '',
    };
  }
  const m = clean.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
  if (m) {
    const isUtc = clean.includes('Z');
    if (isUtc) {
      const utc = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00Z`);
      const etDate = utc.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      const etTime = utc.toLocaleTimeString('en-US', {
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
        timeZone: 'America/New_York',
      }).slice(0, 5);
      return { date: etDate, time: etTime };
    }
    return {
      date: `${m[1]}-${m[2]}-${m[3]}`,
      time: `${m[4]}:${m[5]}`,
    };
  }
  return { date: '', time: '' };
}

function extractOpponentAndHome(
  summary: string,
  myTeam: string
): { opponent: string; isHome: boolean } {
  const s = summary.trim();

  // "@ TeamName" or "Away @ Team"
  const awayMatch = s.match(/^(?:away\s*)?@\s*(.+)$/i);
  if (awayMatch) return { opponent: awayMatch[1].trim(), isHome: false };

  // "vs TeamName" or "vs. TeamName"
  const vsMatch = s.match(/^vs\.?\s+(.+)$/i);
  if (vsMatch) return { opponent: vsMatch[1].trim(), isHome: true };

  // "TeamA vs TeamB" — figure out which one we are
  const dualVs = s.match(/^(.+?)\s+vs\.?\s+(.+)$/i);
  if (dualVs) {
    const [, teamA, teamB] = dualVs;
    if (myTeam && teamA.toLowerCase().includes(myTeam.toLowerCase())) {
      return { opponent: teamB.trim(), isHome: true };
    }
    if (myTeam && teamB.toLowerCase().includes(myTeam.toLowerCase())) {
      return { opponent: teamA.trim(), isHome: false };
    }
    return { opponent: teamB.trim(), isHome: true };
  }

  // "TeamA at TeamB"
  const atMatch = s.match(/^(.+?)\s+at\s+(.+)$/i);
  if (atMatch) {
    const [, teamA, teamB] = atMatch;
    if (myTeam && teamA.toLowerCase().includes(myTeam.toLowerCase())) {
      return { opponent: teamB.trim(), isHome: false };
    }
    return { opponent: teamA.trim(), isHome: true };
  }

  return { opponent: s, isHome: true };
}

export function parseICS(ics: string, seasonId: string, myTeam = ''): Omit<Game, 'id'>[] {
  const text = unfold(ics);
  const events = text.split(/BEGIN:VEVENT/i).slice(1);
  const games: Omit<Game, 'id'>[] = [];

  for (const block of events) {
    const get = (key: string) => {
      const m = block.match(new RegExp(`^${key}(?:;[^:]*)?:(.+)$`, 'mi'));
      return m ? m[1].trim() : '';
    };

    const dtstart = get('DTSTART');
    const summary = get('SUMMARY');
    const location = get('LOCATION');
    const description = get('DESCRIPTION');

    if (!dtstart && !summary) continue;

    const { date, time } = parseDate(dtstart);
    const { opponent, isHome: isHomeBySummary } = extractOpponentAndHome(summary, myTeam);
    const cleanLocation = location.replace(/\\,/g, ',').replace(/\\n/g, ' ').trim();
    const isHome = cleanLocation
      ? /reading/i.test(cleanLocation)
      : isHomeBySummary;

    games.push({
      seasonId,
      date,
      time,
      opponent,
      location: cleanLocation,
      isHome,
      notes: description.replace(/\\n/g, '\n').replace(/\\,/g, ',').trim() || undefined,
    });
  }

  return games;
}

export async function fetchAndParseICS(
  url: string,
  seasonId: string,
  myTeam = ''
): Promise<Omit<Game, 'id'>[]> {
  const fetchUrl = url.replace(/^webcal:\/\//i, 'https://');
  const res = await fetch(fetchUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  return parseICS(text, seasonId, myTeam);
}
