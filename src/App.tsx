import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import RequireAuth from './components/auth/RequireAuth';
import { useAuthStore } from './store/authStore';
import { useStore } from './store';
import { SeasonsPage } from './pages/SeasonsPage';
import { SeasonDetailPage } from './pages/SeasonDetailPage';
import { SeasonOverviewPage } from './pages/SeasonOverviewPage';
import { SchedulePage } from './pages/SchedulePage';
import { RosterPage } from './pages/RosterPage';
import AuthPage from './pages/AuthPage';

function DataLoader({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const loadUserData = useStore((s) => s.loadUserData);
  const clearData = useStore((s) => s.clearData);

  useEffect(() => {
    if (user) {
      loadUserData(user.id);
    } else {
      clearData();
    }
  }, [user?.id]);

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
            </Route>
          </Route>
        </Routes>
      </DataLoader>
    </BrowserRouter>
  );
}
