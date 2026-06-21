import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import RequireAuth from './components/auth/RequireAuth';
import { useAuthStore } from './store/authStore';
import { useStore } from './store';
import { SeasonsPage } from './pages/SeasonsPage';
import { SeasonDetailPage } from './pages/SeasonDetailPage';
import { SeasonOverviewPage } from './pages/SeasonOverviewPage';
import { SchedulePage } from './pages/SchedulePage';
import { RosterPage } from './pages/RosterPage';
import { LineupLayout } from './pages/LineupLayout';
import { LineupPage } from './pages/LineupPage';
import AuthPage from './pages/AuthPage';
import { InvitePage } from './pages/InvitePage';

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

  // Don't block the invite page — it handles its own loading state
  if (user && !initialized && !pathname.startsWith('/invite')) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-zinc-700 border-t-green-500 rounded-full animate-spin" />
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
              <Route path="roster" element={<RosterPage />} />
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
