import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash, List, ArrowRight, PencilSimple } from '@phosphor-icons/react';
import { useStore } from '../store';
import { useAuthStore } from '../store/authStore';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { SeasonForm } from '../components/seasons/SeasonForm';
import type { Season } from '../types';

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tip">
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-zinc-700 text-zinc-100 text-xs rounded whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity">
        {label}
      </div>
    </div>
  );
}

export function SeasonsPage() {
  const { seasons, addSeason, updateSeason, deleteSeason, addCoach } = useStore();
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Season | null>(null);
  const navigate = useNavigate();

  const handleAdd = async (data: Omit<Season, 'id' | 'createdAt'>) => {
    if (!user) return;
    const s = await addSeason(data, user.id);
    setShowForm(false);
    if (s) {
      const name =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        user.email ??
        'Head Coach';
      await addCoach({ seasonId: s.id, name, role: 'Head Coach' }, user.id);
      navigate(`/seasons/${s.id}`);
    }
  };

  const handleEdit = async (data: Omit<Season, 'id' | 'createdAt'>) => {
    if (!editing) return;
    await updateSeason(editing.id, data);
    setEditing(null);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
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
                {s.ownerId === user?.id && (
                  <>
                    <Tooltip label="Edit">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditing(s); }}
                        className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
                      >
                        <PencilSimple size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip label="Delete">
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSeason(s.id); }}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash size={16} />
                      </button>
                    </Tooltip>
                  </>
                )}
              </div>
            ))}
        </div>
      )}

      {showForm && (
        <Modal title="New Season" onClose={() => setShowForm(false)}>
          <SeasonForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Season" onClose={() => setEditing(null)}>
          <SeasonForm initial={editing} onSubmit={handleEdit} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}
