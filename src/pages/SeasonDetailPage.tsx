import { NavLink, Outlet, useParams, Navigate } from 'react-router-dom';
import { ChartBar, CalendarDots, Users, ListNumbers } from '@phosphor-icons/react';
import { useStore } from '../store';

const tabs = [
  { to: '', label: 'Overview', icon: ChartBar, end: true },
  { to: 'schedule', label: 'Schedule', icon: CalendarDots, end: false },
  { to: 'roster', label: 'Roster', icon: Users, end: false },
  { to: 'lineup', label: 'Lineup', icon: ListNumbers, end: false },
];

export function SeasonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const season = useStore((s) => s.seasons.find((x) => x.id === id));

  if (!season) return <Navigate to="/seasons" replace />;

  const base = `/seasons/${id}`;

  return (
    <div className="flex flex-col min-h-[calc(100dvh-57px)]">
      {/* Season header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 pt-4 pb-0">
        <div className="max-w-xl mx-auto">
          <div className="text-xs text-zinc-500 uppercase tracking-wide font-medium mb-0.5">
            {season.ageGroup} · {season.year}
          </div>
          <div className="text-xl font-bold text-zinc-100">
            {season.teamName || season.name}
          </div>
          {season.teamName && (
            <div className="text-sm text-zinc-500">{season.name}</div>
          )}

          {/* Tab bar */}
          <div className="flex gap-1 mt-4 -mb-px">
            {tabs.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={label}
                to={to === '' ? base : `${base}/${to}`}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-green-400 text-green-400'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
