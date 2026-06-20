import { Outlet, useParams, Navigate } from 'react-router-dom';
import { useStore } from '../store';

export function SeasonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const season = useStore((s) => s.seasons.find((x) => x.id === id));

  if (!season) return <Navigate to="/seasons" replace />;

  return <Outlet />;
}
