import { Link, NavLink, Outlet } from 'react-router-dom';
import { Baseball, List } from '@phosphor-icons/react';

export function Layout() {
  return (
    <div className="flex flex-col min-h-dvh bg-zinc-950">
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 shadow-sm flex items-center justify-between">
        <Link to="/seasons" className="flex items-center gap-2 py-3 hover:opacity-80 transition-opacity">
          <Baseball size={24} weight="fill" className="text-green-400" />
          <span className="font-bold text-lg tracking-tight text-zinc-100">Dugout</span>
        </Link>
        <NavLink
          to="/seasons"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
        >
          <List size={16} /> Seasons
        </NavLink>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
