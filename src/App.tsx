import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { SeasonsPage } from './pages/SeasonsPage';
import { SeasonDetailPage } from './pages/SeasonDetailPage';
import { SeasonOverviewPage } from './pages/SeasonOverviewPage';
import { SchedulePage } from './pages/SchedulePage';
import { RosterPage } from './pages/RosterPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/seasons" replace />} />
          <Route path="seasons" element={<SeasonsPage />} />
          <Route path="seasons/:id" element={<SeasonDetailPage />}>
            <Route index element={<SeasonOverviewPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="roster" element={<RosterPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
