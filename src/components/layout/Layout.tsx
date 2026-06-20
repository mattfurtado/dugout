import { Link, Outlet } from 'react-router-dom';
import { Baseball, SignOut } from '@phosphor-icons/react';
import { useAuthStore } from '../../store/authStore';

export function Layout() {
  const { signOut } = useAuthStore();

  return (
    <div className="flex flex-col min-h-dvh bg-zinc-950">
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 shadow-sm flex items-center justify-between">
        <Link to="/seasons" className="flex items-center gap-2 py-3 hover:opacity-80 transition-opacity">
          <Baseball size={24} weight="fill" className="text-green-400" />
          <span className="font-bold text-lg tracking-tight text-zinc-100">Dugout</span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={signOut}
            className="p-1.5 rounded-lg text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400 transition-colors"
            title="Sign out"
          >
            <SignOut size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
