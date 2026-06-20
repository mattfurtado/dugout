import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, Outlet, useMatch, useNavigate } from 'react-router-dom';
import { Baseball, SignOut, CaretDown, Check } from '@phosphor-icons/react';
import { useAuthStore } from '../../store/authStore';
import { useStore } from '../../store';

const SEASON_TABS = [
  { path: '', label: 'Overview', end: true },
  { path: 'schedule', label: 'Schedule', end: false },
  { path: 'roster', label: 'Roster', end: false },
  { path: 'lineup', label: 'Lineup', end: false },
];

export function Layout() {
  const { signOut } = useAuthStore();
  const seasons = useStore((s) => s.seasons);
  const navigate = useNavigate();
  const seasonMatch = useMatch('/seasons/:id/*');
  const seasonId = seasonMatch?.params?.id;
  const currentSeason = seasons.find((s) => s.id === seasonId);

  const [showSwitcher, setShowSwitcher] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSwitcher) return;
    const handler = (e: MouseEvent) => {
      if (!switcherRef.current?.contains(e.target as Node)) setShowSwitcher(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSwitcher]);

  return (
    <div className="flex flex-col min-h-dvh bg-zinc-950">
      <header className="sticky top-0 z-30 bg-zinc-900 border-b border-zinc-800 px-4 shadow-sm flex items-center gap-3 min-w-0">
        <Link to="/seasons" className="flex items-center gap-2 py-3 hover:opacity-80 transition-opacity shrink-0">
          <Baseball size={24} weight="fill" className="text-green-400" />
          <span className="font-bold text-lg tracking-tight text-zinc-100">Dugout</span>
        </Link>

        {seasonId && currentSeason && (
          <>
            <div className="w-px h-4 bg-zinc-700 shrink-0" />

            {/* Season switcher */}
            <div ref={switcherRef} className="relative shrink-0">
              <button
                onClick={() => setShowSwitcher((v) => !v)}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity py-1 text-left"
              >
                <div>
                  <div className="text-sm font-medium text-zinc-200 leading-tight">
                    {currentSeason.teamName || currentSeason.name}
                  </div>
                  <div className="text-xs text-zinc-500 leading-tight">
                    {[currentSeason.teamName ? currentSeason.name : null, currentSeason.ageGroup, currentSeason.year].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <CaretDown size={12} className={`text-zinc-500 shrink-0 transition-transform ${showSwitcher ? 'rotate-180' : ''}`} />
              </button>

              {showSwitcher && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl py-1 z-50">
                  {seasons.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { navigate(`/seasons/${s.id}`); setShowSwitcher(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-700 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm truncate ${s.id === seasonId ? 'text-zinc-100 font-medium' : 'text-zinc-300'}`}>
                          {s.teamName || s.name}
                        </div>
                        <div className="text-xs text-zinc-500 truncate">
                          {[s.teamName ? s.name : null, s.ageGroup, s.year].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      {s.id === seasonId && <Check size={13} className="text-green-400 shrink-0" />}
                    </button>
                  ))}
                  <div className="border-t border-zinc-700 mt-1 pt-1">
                    <button
                      onClick={() => { navigate('/seasons'); setShowSwitcher(false); }}
                      className="w-full px-3 py-2 text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 transition-colors text-left"
                    >
                      Manage seasons
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-4 bg-zinc-700 shrink-0" />

            {/* Season nav */}
            <nav className="flex items-center gap-0.5 min-w-0 overflow-x-auto">
              {SEASON_TABS.map(({ path, label, end }) => (
                <NavLink
                  key={label}
                  to={path ? `/seasons/${seasonId}/${path}` : `/seasons/${seasonId}`}
                  end={end}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </>
        )}

        <div className="flex-1" />

        <button
          onClick={signOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400 transition-colors shrink-0"
        >
          <SignOut size={16} /> Sign out
        </button>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
