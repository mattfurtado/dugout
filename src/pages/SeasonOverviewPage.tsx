import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDots, PencilSimple, Users } from '@phosphor-icons/react';
import { format, isAfter, parseISO, startOfToday } from 'date-fns';
import { useAuthStore } from '../store/authStore';
import { useStore } from '../store';
import { IconButton } from '../components/ui/IconButton';
import { Modal } from '../components/ui/Modal';
import { SeasonForm } from '../components/seasons/SeasonForm';
import type { Season } from '../types';

function formatDate(date: string) {
  try { return format(parseISO(date), 'EEE, MMM d'); } catch { return date; }
}

export function SeasonOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const { seasons, games, players, coaches, updateSeason } = useStore();
  const { user } = useAuthStore();
  const [editing, setEditing] = useState(false);

  const season = seasons.find((s) => s.id === id);
  if (!season) return null;

  const today = startOfToday();
  const seasonGames = games.filter((g) => g.seasonId === id);
  const upcoming = seasonGames
    .filter((g) => !g.result && isAfter(parseISO(g.date + 'T00:00:00'), today))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const roster = players.filter((p) => p.seasonId === id);
  const staff = coaches.filter((c) => c.seasonId === id);
  const wins = seasonGames.filter((g) => g.result === 'W').length;
  const losses = seasonGames.filter((g) => g.result === 'L').length;
  const played = seasonGames.filter((g) => g.result).length;

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      {/* Season info */}
      <div className="bg-panel rounded-xl border border-subtle px-4 py-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <div className="text-base font-bold text-strong">{season.teamName}</div>
            <div className="text-sm text-soft">{season.name}</div>
            <div className="flex items-center gap-2 text-xs text-ghost pt-0.5">
              <span>{season.ageGroup}</span>
              <span>·</span>
              <span>{season.year}</span>
            </div>
          </div>
          {season.ownerId === user?.id && (
            <IconButton className="shrink-0" onClick={() => setEditing(true)}>
              <PencilSimple size={15} />
            </IconButton>
          )}
        </div>
      </div>

      {/* Record */}
      {played > 0 && (
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { label: 'Wins', value: wins, color: 'text-green-400' },
            { label: 'Losses', value: losses, color: 'text-red-400' },
            { label: 'Played', value: played, color: 'text-mid' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-panel rounded-xl border border-subtle p-3 text-center">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-soft">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming games */}
      <div className="bg-panel rounded-xl border border-subtle">
        <div className="flex items-center justify-between px-4 py-3 border-b border-subtle">
          <div className="flex items-center gap-2 text-sm font-semibold text-strong">
            <CalendarDots size={16} className="text-green-400" /> Upcoming Games
          </div>
          <Link to="schedule" relative="path" className="text-xs text-green-400 font-medium hover:text-green-300">
            View all
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-soft">
            No upcoming games.{' '}
            <Link to="schedule" relative="path" className="text-green-400 font-medium hover:text-green-300">
              Add one
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-subtle">
            {upcoming.map((g) => (
              <div key={g.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-strong">{g.isHome ? 'vs' : '@'} {g.opponent}</div>
                  <div className="text-xs text-soft">
                    {formatDate(g.date)}{g.location ? ` · ${g.location}` : ''}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${g.isHome ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                  {g.isHome ? 'Home' : 'Away'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team summary */}
      <div className="bg-panel rounded-xl border border-subtle">
        <div className="flex items-center justify-between px-4 py-3 border-b border-subtle">
          <div className="flex items-center gap-2 text-sm font-semibold text-strong">
            <Users size={16} className="text-green-400" /> Team
          </div>
          <Link className="text-xs text-green-400 font-medium hover:text-green-300" relative="path" to="team">
            Manage
          </Link>
        </div>

        {staff.length === 0 && roster.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-soft">
            No players or coaches yet.{' '}
            <Link className="text-green-400 font-medium hover:text-green-300" relative="path" to="team">
              Add players
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-subtle">
            {staff.length > 0 && (
              <div className="px-4 py-3">
                <div className="text-xs font-medium text-ghost uppercase tracking-wide mb-2">Coaches</div>
                <div className="space-y-1.5">
                  {staff.map((c) => (
                    <div className="flex items-center gap-2" key={c.id}>
                      <div className="w-6 h-6 rounded-full bg-well border border-firm flex items-center justify-center text-xs font-bold text-soft shrink-0">
                        {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm text-strong">{c.name}</span>
                      <span className="text-xs text-ghost">{c.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {roster.length > 0 && (
              <div className="px-4 py-3">
                <div className="text-xs font-medium text-ghost uppercase tracking-wide mb-2">Players</div>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {roster.slice(0, 6).map((p) => (
                      <div className="w-8 h-8 rounded-full bg-green-500/20 border-2 border-panel flex items-center justify-center text-xs font-bold text-green-400" key={p.id}>
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                    ))}
                    {roster.length > 6 && (
                      <div className="w-8 h-8 rounded-full bg-well border-2 border-panel flex items-center justify-center text-xs font-medium text-soft">
                        +{roster.length - 6}
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-soft">{roster.length} player{roster.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {editing && (
        <Modal title="Edit Season" onClose={() => setEditing(false)}>
          <SeasonForm
            initial={season}
            onSubmit={(data: Omit<Season, 'id' | 'createdAt'>) => {
              updateSeason(season.id, data);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </Modal>
      )}
    </div>
  );
}
