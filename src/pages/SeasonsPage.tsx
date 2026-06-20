import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash, List, ArrowRight } from '@phosphor-icons/react';
import { useStore } from '../store';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { SeasonForm } from '../components/seasons/SeasonForm';
import type { Season } from '../types';

export function SeasonsPage() {
  const { seasons, addSeason, deleteSeason } = useStore();
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const handleAdd = (data: Omit<Season, 'id' | 'createdAt'>) => {
    const s = addSeason(data);
    setShowForm(false);
    navigate(`/seasons/${s.id}`);
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4 pt-2">
        <h1 className="text-lg font-bold text-zinc-100">Seasons</h1>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus size={16} /> New Season
        </Button>
      </div>

      {seasons.length === 0 ? (
        <EmptyState
          icon={<List size={48} />}
          title="No seasons yet"
          description="Create your first season to start tracking games and players."
          action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> Create Season</Button>}
        />
      ) : (
        <div className="space-y-2">
          {seasons
            .slice()
            .sort((a, b) => b.year - a.year || b.createdAt.localeCompare(a.createdAt))
            .map((s) => (
              <div
                key={s.id}
                className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 flex items-center gap-3 hover:border-zinc-700 transition-colors cursor-pointer group"
                onClick={() => navigate(`/seasons/${s.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-100 truncate">{s.name}</span>
                    {s.teamName && (
                      <span className="text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full truncate">
                        {s.teamName}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">{s.ageGroup} · {s.year}</div>
                </div>
                <ArrowRight size={16} className="text-zinc-700 group-hover:text-zinc-400 transition-colors shrink-0" />
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSeason(s.id); }}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash size={16} />
                </button>
              </div>
            ))}
        </div>
      )}

      {showForm && (
        <Modal title="New Season" onClose={() => setShowForm(false)}>
          <SeasonForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  );
}
