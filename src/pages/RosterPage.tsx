import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash, Users, PencilSimple, Phone, Envelope } from '@phosphor-icons/react';
import { useStore } from '../store';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import type { Player, Position } from '../types';

const ALL_POSITIONS: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'Bench'];

const inputCls = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50';

function PlayerForm({
  initial,
  seasonId,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<Player>;
  seasonId: string;
  onSubmit: (data: Omit<Player, 'id'>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Omit<Player, 'id'>>({
    seasonId,
    firstName: initial?.firstName ?? '',
    lastName: initial?.lastName ?? '',
    number: initial?.number,
    positions: initial?.positions ?? [],
    parentName: initial?.parentName ?? '',
    parentPhone: initial?.parentPhone ?? '',
    parentEmail: initial?.parentEmail ?? '',
    notes: initial?.notes ?? '',
  });

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const togglePos = (pos: Position) =>
    setForm((f) => ({
      ...f,
      positions: f.positions.includes(pos)
        ? f.positions.filter((p) => p !== pos)
        : [...f.positions, pos],
    }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">First Name</label>
          <input required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Last Name</label>
          <input required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Jersey #</label>
        <input type="number" min={0} max={99} value={form.number ?? ''} onChange={(e) => set('number', e.target.value ? Number(e.target.value) : undefined)} className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-2">Positions</label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_POSITIONS.map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => togglePos(pos)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                form.positions.includes(pos)
                  ? 'bg-green-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600 hover:text-zinc-200'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-zinc-800 pt-3">
        <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">Parent / Guardian</p>
        <div className="space-y-2">
          <input value={form.parentName} onChange={(e) => set('parentName', e.target.value)} placeholder="Name" className={inputCls} />
          <input type="tel" value={form.parentPhone} onChange={(e) => set('parentPhone', e.target.value)} placeholder="Phone" className={inputCls} />
          <input type="email" value={form.parentEmail} onChange={(e) => set('parentEmail', e.target.value)} placeholder="Email" className={inputCls} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="flex-1">Save Player</Button>
      </div>
    </form>
  );
}

export function RosterPage() {
  const { id: seasonId } = useParams<{ id: string }>();
  const { players, addPlayer, updatePlayer, deletePlayer } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Player | null>(null);

  const roster = players
    .filter((p) => p.seasonId === seasonId)
    .sort((a, b) => a.lastName.localeCompare(b.lastName));

  if (!seasonId) {
    return (
      <EmptyState
        icon={<Users size={48} />}
        title="Season not found"
        description="Return to seasons and try again."
      />
    );
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-bold text-zinc-100">Roster</h1>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Add Player
        </Button>
      </div>
      <p className="text-xs text-zinc-500 mb-4">{roster.length} player{roster.length !== 1 ? 's' : ''}</p>

      {roster.length === 0 ? (
        <EmptyState
          icon={<Users size={48} />}
          title="No players yet"
          description="Add players to build your roster for this season."
          action={<Button onClick={() => setShowForm(true)}><Plus size={15} /> Add Player</Button>}
        />
      ) : (
        <div className="space-y-2">
          {roster.map((p) => (
            <div key={p.id} className="bg-zinc-900 rounded-xl border border-zinc-800 p-3 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/15 border border-green-500/20 flex items-center justify-center font-bold text-sm text-green-400 shrink-0">
                {p.number != null ? `#${p.number}` : (p.firstName[0] + p.lastName[0]).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-zinc-100">{p.firstName} {p.lastName}</div>
                {p.positions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.positions.map((pos) => (
                      <span key={pos} className="text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 px-1.5 py-0.5 rounded">{pos}</span>
                    ))}
                  </div>
                )}
                {(p.parentPhone || p.parentEmail) && (
                  <div className="flex gap-3 mt-1">
                    {p.parentPhone && (
                      <a href={`tel:${p.parentPhone}`} className="text-xs text-zinc-600 flex items-center gap-1 hover:text-green-400">
                        <Phone size={11} /> {p.parentPhone}
                      </a>
                    )}
                    {p.parentEmail && (
                      <a href={`mailto:${p.parentEmail}`} className="text-xs text-zinc-600 flex items-center gap-1 hover:text-green-400">
                        <Envelope size={11} /> {p.parentEmail}
                      </a>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setEditing(p)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300">
                  <PencilSimple size={15} />
                </button>
                <button onClick={() => deletePlayer(p.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400">
                  <Trash size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="Add Player" onClose={() => setShowForm(false)}>
          <PlayerForm
            seasonId={seasonId}
            onSubmit={(data) => { addPlayer(data); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Player" onClose={() => setEditing(null)}>
          <PlayerForm
            initial={editing}
            seasonId={seasonId}
            onSubmit={(data) => { updatePlayer(editing.id, data); setEditing(null); }}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  );
}
