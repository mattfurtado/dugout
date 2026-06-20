import { Link } from 'react-router-dom';
import { Baseball, CalendarDots, Users, Plus, List } from '@phosphor-icons/react';
import { format, parseISO, isAfter, startOfToday } from 'date-fns';
import { useStore } from '../store';
import { Button } from '../components/ui/Button';

function formatDate(date: string) {
  try { return format(parseISO(date), 'EEE, MMM d'); } catch { return date; }
}

export function HomePage() {
  const { seasons, games, players, activeSeason, setActiveSeason } = useStore();
  const season = seasons.find((s) => s.id === activeSeason);
  const today = startOfToday();

  const seasonGames = games.filter((g) => g.seasonId === activeSeason);
  const upcoming = seasonGames
    .filter((g) => !g.result && isAfter(parseISO(g.date + 'T00:00:00'), today))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const roster = players.filter((p) => p.seasonId === activeSeason);
  const wins = seasonGames.filter((g) => g.result === 'W').length;
  const losses = seasonGames.filter((g) => g.result === 'L').length;

  if (!activeSeason || !season) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <Baseball size={64} weight="fill" className="text-green-400 mb-4" />
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">Welcome to Dugout</h1>
        <p className="text-zinc-500 text-sm mb-6 max-w-xs">
          Your little league coaching companion. Start by creating a season.
        </p>
        {seasons.length > 0 ? (
          <div className="space-y-2 w-full max-w-xs">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Pick a season</p>
            {seasons.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSeason(s.id)}
                className="w-full text-left bg-zinc-900 border border-zinc-800 rounded-xl p-3 hover:border-green-500/50 transition-colors"
              >
                <div className="font-semibold text-sm text-zinc-100">{s.name}</div>
                <div className="text-xs text-zinc-500">{s.teamName} · {s.ageGroup}</div>
              </button>
            ))}
          </div>
        ) : (
          <Link to="/seasons">
            <Button><Plus size={16} /> Create Season</Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
        <div className="text-xs text-green-500/70 uppercase tracking-wide font-medium mb-1">{season.ageGroup} · {season.year}</div>
        <div className="text-xl font-bold text-zinc-100">{season.teamName || season.name}</div>
        <div className="text-sm text-zinc-400">{season.name}</div>
      </div>

      {(wins > 0 || losses > 0) && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Wins', value: wins, color: 'text-green-400' },
            { label: 'Losses', value: losses, color: 'text-red-400' },
            { label: 'Games', value: seasonGames.filter((g) => g.result).length, color: 'text-zinc-300' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-zinc-900 rounded-xl border border-zinc-800 p-3 text-center">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-zinc-500">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-zinc-900 rounded-xl border border-zinc-800">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <CalendarDots size={16} className="text-green-400" /> Upcoming Games
          </div>
          <Link to="/schedule" className="text-xs text-green-400 font-medium hover:text-green-300">View all</Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-zinc-500">
            No upcoming games.{' '}
            <Link to="/schedule" className="text-green-400 font-medium hover:text-green-300">Add one</Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {upcoming.map((g) => (
              <div key={g.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-100">{g.isHome ? 'vs' : '@'} {g.opponent}</div>
                  <div className="text-xs text-zinc-500">{formatDate(g.date)}{g.location ? ` · ${g.location}` : ''}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${g.isHome ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                  {g.isHome ? 'Home' : 'Away'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <Users size={16} className="text-green-400" /> Roster
          </div>
          <Link to="/roster" className="text-xs text-green-400 font-medium hover:text-green-300">Manage</Link>
        </div>
        {roster.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-zinc-500">
            No players yet.{' '}
            <Link to="/roster" className="text-green-400 font-medium hover:text-green-300">Add players</Link>
          </div>
        ) : (
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="flex -space-x-2">
              {roster.slice(0, 5).map((p) => (
                <div key={p.id} className="w-8 h-8 rounded-full bg-green-500/20 border-2 border-zinc-900 flex items-center justify-center text-xs font-bold text-green-400">
                  {p.firstName[0]}{p.lastName[0]}
                </div>
              ))}
              {roster.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-xs font-medium text-zinc-400">
                  +{roster.length - 5}
                </div>
              )}
            </div>
            <span className="text-sm text-zinc-400">{roster.length} player{roster.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

<div className="flex items-center justify-between">
        <Link to="/seasons" className="text-xs text-zinc-500 flex items-center gap-1 hover:text-zinc-300">
          <List size={13} /> Switch season
        </Link>
      </div>
    </div>
  );
}
