import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, List, Plus } from '@phosphor-icons/react';
import { useStore } from '../store';
import { useAuthStore } from '../store/authStore';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { IconButton } from '../components/ui/IconButton';
import { PageHeader } from '../components/ui/PageHeader';
import { SeasonForm } from '../components/seasons/SeasonForm';
import type { Season } from '../types';

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tip">
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-wash text-strong text-xs rounded whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity">
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
      <PageHeader
        title="Seasons"
        action={<Button size="sm" onClick={() => setShowForm(true)}><Plus size={16} /> New Season</Button>}
        className="mb-4 pt-2"
      />

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
                className="bg-panel rounded-xl border border-subtle p-4 flex items-center gap-3 hover:border-firm transition-colors cursor-pointer group"
                onClick={() => navigate(`/seasons/${s.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-strong truncate">{s.name}</span>
                    {s.teamName && (
                      <span className="text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full truncate">
                        {s.teamName}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-soft mt-0.5">{s.ageGroup} · {s.year}</div>
                </div>
                <ArrowRight size={16} className="text-ghost group-hover:text-soft transition-colors shrink-0" />
                {s.ownerId === user?.id && (
                  <>
                    <Tooltip label="Edit">
                      <IconButton onClick={(e) => { e.stopPropagation(); setEditing(s); }}>
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"/></svg>
                      </IconButton>
                    </Tooltip>
                    <Tooltip label="Delete">
                      <IconButton variant="danger" onClick={(e) => { e.stopPropagation(); deleteSeason(s.id); }}>
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM104,40h48v8H104Zm88,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"/></svg>
                      </IconButton>
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
