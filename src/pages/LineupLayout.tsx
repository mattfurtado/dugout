import { NavLink, Outlet, useMatch } from 'react-router-dom';

const LINEUP_TABS = [
  { path: 'ranker', label: 'Ranker' },
];

export function LineupLayout() {
  const match = useMatch('/seasons/:id/lineup/*');
  const seasonId = match?.params?.id;

  return (
    <div>
      <div className="border-b border-subtle px-4">
        <nav className="flex">
          {LINEUP_TABS.map(({ path, label }) => (
            <NavLink
              key={path}
              to={`/seasons/${seasonId}/lineup/${path}`}
              className={({ isActive }) =>
                `px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-strong border-green-500'
                    : 'text-soft hover:text-mid border-transparent'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
