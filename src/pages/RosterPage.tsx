import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash, Users, PencilSimple, Phone, Envelope, Link, Check } from '@phosphor-icons/react';
import { useStore } from '../store';
import { useAuthStore } from '../store/authStore';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import type { Player, Position, Coach, CoachRole } from '../types';

const ALL_POSITIONS: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'Bench'];
const ALL_ROLES: CoachRole[] = ['Head Coach', 'Assistant Coach'];

const inputCls = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50';

// ── Coach Form ────────────────────────────────────────────────────────────────

function CoachForm({
  initial, seasonId, onSubmit, onCancel,
}: {
  initial?: Partial<Coach>;
  seasonId: string;
  onSubmit: (data: Omit<Coach, 'id'>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Omit<Coach, 'id'>>({
    seasonId,
    name: initial?.name ?? '',
    role: initial?.role ?? 'Assistant Coach',
    phone: initial?.phone ?? '',
    email: initial?.email ?? '',
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Name</label>
        <input required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Full name" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Role</label>
        <select value={form.role} onChange={(e) => set('role', e.target.value)} className={`${inputCls} bg-zinc-800`}>
          {ALL_ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Phone</label>
        <input type="tel" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} placeholder="Optional" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Email</label>
        <input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} placeholder="Optional" className={inputCls} />
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="flex-1">Save</Button>
      </div>
    </form>
  );
}

// ── Player Form ───────────────────────────────────────────────────────────────

function PlayerForm({
  initial, seasonId, onSubmit, onCancel,
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
            <button key={pos} type="button" onClick={() => togglePos(pos)}
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

// ── Page ──────────────────────────────────────────────────────────────────────

export function RosterPage() {
  const { id: seasonId } = useParams<{ id: string }>();
  const { players, coaches, addPlayer, updatePlayer, deletePlayer, addCoach, updateCoach, deleteCoach, createInvite } = useStore();
  const { user } = useAuthStore();

  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showCoachForm, setShowCoachForm] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyInvite = async () => {
    if (!user || !seasonId) return;
    const id = await createInvite(seasonId, user.id);
    if (!id) return;
    await navigator.clipboard.writeText(`${window.location.origin}/invite/${id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const season = useStore((s) => s.seasons.find((x) => x.id === seasonId));
  const isOwner = season?.ownerId === user?.id;

  const roster = players.filter((p) => p.seasonId === seasonId).sort((a, b) => a.lastName.localeCompare(b.lastName));
  const seenCoaches = new Set<string>();
  const staff = coaches
    .filter((c) => c.seasonId === seasonId)
    .sort((a, b) => {
      const roleOrder = ALL_ROLES.indexOf(a.role) - ALL_ROLES.indexOf(b.role);
      return roleOrder !== 0 ? roleOrder : a.name.localeCompare(b.name);
    })
    .filter((c) => {
      const key = (c.email?.toLowerCase() || c.name.toLowerCase());
      if (seenCoaches.has(key)) return false;
      seenCoaches.add(key);
      return true;
    });

  if (!seasonId) {
    return <EmptyState icon={<Users size={48} />} title="Season not found" description="Return to seasons and try again." />;
  }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-8">

      {/* Coaches */}
      <div>
        <div className="flex items-center justify-between mb-3 pt-2">
          <div>
            <h2 className="text-base font-bold text-zinc-100">Coaches</h2>
            <p className="text-xs text-zinc-500">{staff.length} staff member{staff.length !== 1 ? 's' : ''}</p>
          </div>
          {isOwner && (
            <div className="flex gap-2">
              <button
                onClick={handleCopyInvite}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  copied
                    ? 'bg-green-500/15 text-green-400'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600'
                }`}
              >
                {copied ? <Check size={13} /> : <Link size={13} />}
                {copied ? 'Copied!' : 'Invite Link'}
              </button>
              <Button size="sm" onClick={() => setShowCoachForm(true)}>
                <Plus size={15} /> Add Coach
              </Button>
            </div>
          )}
        </div>

        {staff.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 border-dashed rounded-xl p-6 text-center">
            <p className="text-sm text-zinc-600">No coaches added yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {staff.map((c) => (
              <div key={c.id} className="bg-zinc-900 rounded-xl border border-zinc-800 p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-sm text-zinc-400 shrink-0">
                  {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-zinc-100">{c.name}</div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-zinc-500">{c.role}</span>
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="text-xs text-zinc-600 flex items-center gap-1 hover:text-green-400">
                        <Phone size={11} /> {c.phone}
                      </a>
                    )}
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="text-xs text-zinc-600 flex items-center gap-1 hover:text-green-400">
                        <Envelope size={11} /> {c.email}
                      </a>
                    )}
                  </div>
                </div>
                {isOwner && (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditingCoach(c)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300">
                      <PencilSimple size={15} />
                    </button>
                    <button onClick={() => deleteCoach(c.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400">
                      <Trash size={15} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Players */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-zinc-100">Players</h2>
            <p className="text-xs text-zinc-500">{roster.length} player{roster.length !== 1 ? 's' : ''}</p>
          </div>
          {isOwner && (
            <Button size="sm" onClick={() => setShowPlayerForm(true)}>
              <Plus size={15} /> Add Player
            </Button>
          )}
        </div>

        {roster.length === 0 ? (
          <EmptyState
            icon={<Users size={48} />}
            title="No players yet"
            description="Add players to build your roster for this season."
            action={<Button onClick={() => setShowPlayerForm(true)}><Plus size={15} /> Add Player</Button>}
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
                {isOwner && (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditingPlayer(p)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300">
                      <PencilSimple size={15} />
                    </button>
                    <button onClick={() => deletePlayer(p.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400">
                      <Trash size={15} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCoachForm && (
        <Modal title="Add Coach" onClose={() => setShowCoachForm(false)}>
          <CoachForm
            seasonId={seasonId}
            onSubmit={(data) => { if (user) addCoach(data, user.id); setShowCoachForm(false); }}
            onCancel={() => setShowCoachForm(false)}
          />
        </Modal>
      )}
      {editingCoach && (
        <Modal title="Edit Coach" onClose={() => setEditingCoach(null)}>
          <CoachForm
            initial={editingCoach}
            seasonId={seasonId}
            onSubmit={(data) => { updateCoach(editingCoach.id, data); setEditingCoach(null); }}
            onCancel={() => setEditingCoach(null)}
          />
        </Modal>
      )}
      {showPlayerForm && (
        <Modal title="Add Player" onClose={() => setShowPlayerForm(false)}>
          <PlayerForm
            seasonId={seasonId}
            onSubmit={(data) => { if (user) addPlayer(data, user.id); setShowPlayerForm(false); }}
            onCancel={() => setShowPlayerForm(false)}
          />
        </Modal>
      )}
      {editingPlayer && (
        <Modal title="Edit Player" onClose={() => setEditingPlayer(null)}>
          <PlayerForm
            initial={editingPlayer}
            seasonId={seasonId}
            onSubmit={(data) => { updatePlayer(editingPlayer.id, data); setEditingPlayer(null); }}
            onCancel={() => setEditingPlayer(null)}
          />
        </Modal>
      )}
    </div>
  );
}
