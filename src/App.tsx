import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import RequireAuth from './components/auth/RequireAuth';
import { useAuthStore } from './store/authStore';
import { useStore } from './store';
import { Spinner } from './components/ui/Spinner';
import { SeasonsPage } from './pages/SeasonsPage';
import { SeasonDetailPage } from './pages/SeasonDetailPage';
import { SeasonOverviewPage } from './pages/SeasonOverviewPage';
import { SchedulePage } from './pages/SchedulePage';
import { TeamPage } from './pages/TeamPage';
import { LineupLayout } from './pages/LineupLayout';
import { LineupPage } from './pages/LineupPage';
import AuthPage from './pages/AuthPage';
import { InvitePage } from './pages/InvitePage';

const PAGE_LABELS: Record<string, string> = {
  schedule: 'Schedule',
  team: 'Team',
  ranker: 'Lineup Ranker',
};

function TitleManager() {
  const { pathname } = useLocation();
  const seasons = useStore((s) => s.seasons);

  useEffect(() => {
    const parts = pathname.split('/').filter(Boolean);
    const seasonIndex = parts.indexOf('seasons');
    const seasonId = seasonIndex !== -1 ? parts[seasonIndex + 1] : null;
    const season = seasonId ? seasons.find((s) => s.id === seasonId) : null;
    const lastSegment = parts[parts.length - 1];
    const pageLabel = PAGE_LABELS[lastSegment];

    const segments = [
      pageLabel,
      season ? season.teamName : null,
      'Dugout',
    ].filter(Boolean);

    document.title = segments.join(' · ');
  }, [pathname, seasons]);

  return null;
}

function DataLoader({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const loadUserData = useStore((s) => s.loadUserData);
  const clearData = useStore((s) => s.clearData);
  const initialized = useStore((s) => s.initialized);
  const { pathname } = useLocation();

  useEffect(() => {
    if (user) {
      loadUserData(user.id);
    } else {
      clearData();
    }
  }, [user?.id]);

  if (user && !initialized && !pathname.startsWith('/invite')) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  const { initialize } = useAuthStore();

  useEffect(() => { initialize(); }, []);

  return (
    <BrowserRouter>
      <TitleManager />
      <DataLoader>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/invite/:token" element={<InvitePage />} />
          <Route path="/" element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }>
            <Route index element={<Navigate to="/seasons" replace />} />
            <Route path="seasons" element={<SeasonsPage />} />
            <Route path="seasons/:id" element={<SeasonDetailPage />}>
              <Route index element={<SeasonOverviewPage />} />
              <Route path="schedule" element={<SchedulePage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="lineup" element={<LineupLayout />}>
                <Route index element={<Navigate to="ranker" replace />} />
                <Route path="ranker" element={<LineupPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </DataLoader>
    </BrowserRouter>
  );
}
