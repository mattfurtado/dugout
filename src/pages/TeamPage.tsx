import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Envelope, Link, PencilSimple, Phone, Plus, Trash, Users } from '@phosphor-icons/react';
import { useAuthStore } from '../store/authStore';
import { useStore } from '../store';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { IconButton } from '../components/ui/IconButton';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import type { Coach, CoachRole, Player, Position } from '../types';

const ALL_POSITIONS: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'Bench'];
const ALL_ROLES: CoachRole[] = ['Head Coach', 'Assistant Coach'];

// ── Coach Form ────────────────────────────────────────────────────────────────

function CoachForm({
  initial, onCancel, onSubmit, seasonId,
}: {
  initial?: Partial<Coach>;
  onCancel: () => void;
  onSubmit: (data: Omit<Coach, 'id'>) => void;
  seasonId: string;
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
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
      <Input label="Name" onChange={(e) => set('name', e.target.value)} placeholder="Full name" required value={form.name} />
      <Select label="Role" onChange={(e) => set('role', e.target.value)} value={form.role}>
        {ALL_ROLES.map((r) => <option key={r}>{r}</option>)}
      </Select>
      <Input label="Email" onChange={(e) => set('email', e.target.value)} placeholder="Optional" type="email" value={form.email ?? ''} />
      <Input label="Phone" onChange={(e) => set('phone', e.target.value)} placeholder="Optional" type="tel" value={form.phone ?? ''} />
      <div className="flex gap-2 pt-1">
        <Button className="flex-1" onClick={onCancel} type="button" variant="secondary">Cancel</Button>
        <Button className="flex-1" type="submit">Save</Button>
      </div>
    </form>
  );
}

// ── Player Form ───────────────────────────────────────────────────────────────

function PlayerForm({
  initial, onCancel, onSubmit, seasonId,
}: {
  initial?: Partial<Player>;
  onCancel: () => void;
  onSubmit: (data: Omit<Player, 'id'>) => void;
  seasonId: string;
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
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
      <div className="grid grid-cols-2 gap-3">
        <Input label="First Name" onChange={(e) => set('firstName', e.target.value)} required value={form.firstName} />
        <Input label="Last Name" onChange={(e) => set('lastName', e.target.value)} required value={form.lastName} />
      </div>
      <Input label="Jersey #" max={99} min={0} onChange={(e) => set('number', e.target.value ? Number(e.target.value) : undefined)} type="number" value={form.number ?? ''} />
      <div>
        <label className="block text-xs font-medium text-soft mb-2">Positions</label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_POSITIONS.map((pos) => (
            <button
              key={pos}
              onClick={() => togglePos(pos)}
              type="button"
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                form.positions.includes(pos)
                  ? 'bg-green-500 text-white'
                  : 'bg-well text-soft border border-firm hover:border-firm hover:text-mid'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-subtle pt-3">
        <p className="mb-2 text-xs font-medium text-ghost uppercase tracking-wide">Parent / Guardian</p>
        <div className="space-y-2">
          <Input onChange={(e) => set('parentName', e.target.value)} placeholder="Name" value={form.parentName} />
          <Input onChange={(e) => set('parentPhone', e.target.value)} placeholder="Phone" type="tel" value={form.parentPhone} />
          <Input onChange={(e) => set('parentEmail', e.target.value)} placeholder="Email" type="email" value={form.parentEmail} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button className="flex-1" onClick={onCancel} type="button" variant="secondary">Cancel</Button>
        <Button className="flex-1" type="submit">Save Player</Button>
      </div>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function TeamPage() {
  const { id: seasonId } = useParams<{ id: string }>();
  const { players, coaches, addPlayer, updatePlayer, deletePlayer, addCoach, updateCoach, deleteCoach, createInvite } = useStore();
  const { user } = useAuthStore();

  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showCoachForm, setShowCoachForm] = useState(false);
  const [showPlayerForm, setShowPlayerForm] = useState(false);
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

  const isHeadCoach = !isOwner && staff.some(
    (c) => c.role === 'Head Coach' && c.email && c.email.toLowerCase() === user?.email?.toLowerCase()
  );
  const canManageRoles = isOwner || isHeadCoach;

  if (!seasonId) {
    return <EmptyState description="Return to seasons and try again." icon={<Users size={48} />} title="Season not found" />;
  }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-8">

      {/* Coaches */}
      <div>
        <PageHeader
          action={isOwner && (
            <div className="flex gap-2">
              <button
                onClick={handleCopyInvite}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  copied
                    ? 'bg-green-500/15 text-green-400'
                    : 'bg-well text-soft hover:text-mid border border-firm hover:border-firm'
                }`}
              >
                {copied ? <Check size={13} /> : <Link size={13} />}
                {copied ? 'Copied!' : 'Invite Link'}
              </button>
              <Button onClick={() => setShowCoachForm(true)} size="sm">
                <Plus size={15} /> Add Coach
              </Button>
            </div>
          )}
          className="mb-3 pt-2"
          size="md"
          subtitle={`${staff.length} staff member${staff.length !== 1 ? 's' : ''}`}
          title="Coaches"
        />

        {staff.length === 0 ? (
          <div className="bg-panel border border-subtle border-dashed rounded-xl p-6 text-center">
            <p className="text-sm text-ghost">No coaches added yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {staff.map((c) => (
              <div className="bg-panel rounded-xl border border-subtle p-3 flex items-center gap-3" key={c.id}>
                <div className="w-10 h-10 rounded-full bg-well border border-firm flex items-center justify-center font-bold text-sm text-soft shrink-0">
                  {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-strong">{c.name}</div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-soft">{c.role}</span>
                    {c.phone && (
                      <a className="text-xs text-ghost flex items-center gap-1 hover:text-green-400" href={`tel:${c.phone}`}>
                        <Phone size={11} /> {c.phone}
                      </a>
                    )}
                  </div>
                </div>
                {canManageRoles && (
                  <div className="flex gap-1 shrink-0">
                    <IconButton onClick={() => setEditingCoach(c)}><PencilSimple size={15} /></IconButton>
                    {isOwner && (
                      <IconButton onClick={() => deleteCoach(c.id)} variant="danger"><Trash size={15} /></IconButton>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Players */}
      <div>
        <PageHeader
          action={canManageRoles && (
            <Button onClick={() => setShowPlayerForm(true)} size="sm">
              <Plus size={15} /> Add Player
            </Button>
          )}
          className="mb-3"
          size="md"
          subtitle={`${roster.length} player${roster.length !== 1 ? 's' : ''}`}
          title="Players"
        />

        {roster.length === 0 ? (
          <EmptyState
            action={canManageRoles ? <Button onClick={() => setShowPlayerForm(true)}><Plus size={15} /> Add Player</Button> : undefined}
            description="Add players to build your roster for this season."
            icon={<Users size={48} />}
            title="No players yet"
          />
        ) : (
          <div className="space-y-2">
            {roster.map((p) => (
              <div className="bg-panel rounded-xl border border-subtle p-3 flex items-start gap-3" key={p.id}>
                <div className="w-10 h-10 rounded-full bg-green-500/15 border border-green-500/20 flex items-center justify-center font-bold text-sm text-green-400 shrink-0">
                  {p.number != null ? `#${p.number}` : (p.firstName[0] + p.lastName[0]).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-strong">{p.firstName} {p.lastName}</div>
                  {p.positions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.positions.map((pos) => (
                        <span className="text-xs bg-well text-soft border border-firm px-1.5 py-0.5 rounded" key={pos}>{pos}</span>
                      ))}
                    </div>
                  )}
                  {(p.parentPhone || p.parentEmail) && (
                    <div className="flex gap-3 mt-1">
                      {p.parentPhone && (
                        <a className="text-xs text-ghost flex items-center gap-1 hover:text-green-400" href={`tel:${p.parentPhone}`}>
                          <Phone size={11} /> {p.parentPhone}
                        </a>
                      )}
                      {p.parentEmail && (
                        <a className="text-xs text-ghost flex items-center gap-1 hover:text-green-400" href={`mailto:${p.parentEmail}`}>
                          <Envelope size={11} /> {p.parentEmail}
                        </a>
                      )}
                    </div>
                  )}
                </div>
                {canManageRoles && (
                  <div className="flex gap-1 shrink-0">
                    <IconButton onClick={() => setEditingPlayer(p)}><PencilSimple size={15} /></IconButton>
                    <IconButton onClick={() => deletePlayer(p.id)} variant="danger"><Trash size={15} /></IconButton>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCoachForm && (
        <Modal onClose={() => setShowCoachForm(false)} title="Add Coach">
          <CoachForm
            onCancel={() => setShowCoachForm(false)}
            onSubmit={(data) => { if (user) addCoach(data, user.id); setShowCoachForm(false); }}
            seasonId={seasonId}
          />
        </Modal>
      )}
      {editingCoach && (
        <Modal onClose={() => setEditingCoach(null)} title="Edit Coach">
          <CoachForm
            initial={editingCoach}
            onCancel={() => setEditingCoach(null)}
            onSubmit={(data) => { updateCoach(editingCoach.id, data); setEditingCoach(null); }}
            seasonId={seasonId}
          />
        </Modal>
      )}
      {showPlayerForm && (
        <Modal onClose={() => setShowPlayerForm(false)} title="Add Player">
          <PlayerForm
            onCancel={() => setShowPlayerForm(false)}
            onSubmit={(data) => { if (user) addPlayer(data, user.id); setShowPlayerForm(false); }}
            seasonId={seasonId}
          />
        </Modal>
      )}
      {editingPlayer && (
        <Modal onClose={() => setEditingPlayer(null)} title="Edit Player">
          <PlayerForm
            initial={editingPlayer}
            onCancel={() => setEditingPlayer(null)}
            onSubmit={(data) => { updatePlayer(editingPlayer.id, data); setEditingPlayer(null); }}
            seasonId={seasonId}
          />
        </Modal>
      )}
    </div>
  );
}
