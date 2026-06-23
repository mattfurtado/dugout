import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Switch } from '@headlessui/react';
import { ArrowDown, ArrowUp, ChartBar, CheckCircle, DotsSixVertical, Plus, Question, Users, WarningCircle, X } from '@phosphor-icons/react';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  KeyboardSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuthStore } from '../store/authStore';
import { useStore } from '../store';
import { EmptyState } from '../components/ui/EmptyState';
import { H1, H2, H3 } from '../components/ui/Heading';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import type { LineupPosition, LineupRankings, Player } from '../types';

const OUTFIELD: LineupPosition[] = ['LF', 'CF', 'RF'];
const INFIELD: LineupPosition[] = ['C', '1B', '2B', '3B', 'SS'];

const POSITION_GROUPS: { label: string; positions: LineupPosition[] }[] = [
  { label: 'Pitching', positions: ['P'] },
  { label: 'Infield', positions: ['C', '1B', '2B', '3B', 'SS'] },
  { label: 'Outfield', positions: ['LF', 'CF', 'RF'] },
];

const MAX_RANKED = 8;

const stableStringify = (r: LineupRankings) =>
  JSON.stringify(Object.fromEntries(
    Object.entries(r).sort().map(([k, v]) => [k, [...(v ?? [])]])
  ));

const RANK_LABEL = (i: number) =>
  ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'][i] ?? `${i + 1}th`;

// ── Validation ────────────────────────────────────────────────────────────────

interface Warning { playerId: string; name: string; message: string }

function getWarnings(rankings: LineupRankings, players: Player[]): Warning[] {
  const byPlayer: Record<string, LineupPosition[]> = {};
  for (const [pos, ids] of Object.entries(rankings) as [LineupPosition, string[]][]) {
    for (const id of ids ?? []) byPlayer[id] = [...(byPlayer[id] ?? []), pos];
  }
  return players.flatMap((p) => {
    const assigned = byPlayer[p.id] ?? [];
    if (!assigned.length) return [];
    const name = `${p.firstName} ${p.lastName}`;
    const warnings: Warning[] = [];
    if (!assigned.some((pos) => OUTFIELD.includes(pos)))
      warnings.push({ playerId: p.id, name, message: 'needs at least one outfield ranking (LF, CF, or RF)' });
    if (!assigned.some((pos) => INFIELD.includes(pos)))
      warnings.push({ playerId: p.id, name, message: 'needs at least one infield ranking (C, 1B, 2B, 3B, or SS)' });
    return warnings;
  });
}

function getAssignmentCounts(rankings: LineupRankings): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const ids of Object.values(rankings))
    for (const id of ids ?? []) counts[id] = (counts[id] ?? 0) + 1;
  return counts;
}

// ── Sortable player row ───────────────────────────────────────────────────────

function SortablePlayerRow({
  editing, player, rank, isFirst, isLast, onRemove, onMoveUp, onMoveDown,
}: {
  editing: boolean; player: Player; rank: number; isFirst: boolean; isLast: boolean;
  onRemove: () => void; onMoveUp: () => void; onMoveDown: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: player.id });

  const stopProp = (fn: () => void) => (e: React.PointerEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...(editing ? listeners : {})}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className={`flex items-center gap-2 group touch-none ${editing ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {editing && <DotsSixVertical size={18} className="text-soft shrink-0" />}
      <span className="text-xs text-soft w-6 shrink-0">{RANK_LABEL(rank)}</span>
      <span className="flex-1 text-sm text-strong truncate">
        {player.firstName} {player.lastName}
        {player.number != null && <span className="text-soft text-xs ml-1.5">#{player.number}</span>}
      </span>
      <div className={`flex items-center gap-0.5 shrink-0 ${editing ? 'sm:opacity-0 sm:group-hover:opacity-100 transition-all' : 'invisible'}`}>
        <button
          title="Move up"
          onPointerDown={stopProp(onMoveUp)}
          className={`p-1 rounded cursor-pointer hover:text-mid transition-colors ${isFirst ? 'invisible' : 'text-soft'}`}
        >
          <ArrowUp size={16} />
        </button>
        <button
          title="Move down"
          onPointerDown={stopProp(onMoveDown)}
          className={`p-1 rounded cursor-pointer hover:text-mid transition-colors ${isLast ? 'invisible' : 'text-soft'}`}
        >
          <ArrowDown size={16} />
        </button>
        <button
          title="Remove"
          onPointerDown={stopProp(onRemove)}
          className="p-1 rounded cursor-pointer text-soft hover:text-red-400 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Sortable position list ────────────────────────────────────────────────────

function PositionList({
  editing, position, ranked, onReorder, onRemove, onAdd,
}: {
  editing: boolean;
  position: LineupPosition;
  ranked: Player[];
  onReorder: (position: LineupPosition, ids: string[]) => void;
  onRemove: (position: LineupPosition, playerId: string) => void;
  onAdd: (position: LineupPosition) => void;
}) {
  const isMobile = window.matchMedia('(pointer: coarse)').matches;
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: isMobile ? 1000 : 500, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = ranked.map((p) => p.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    onReorder(position, arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <div>
      <H3 className={['mb-1.5', 'px-1']}>{position}</H3>
      <div className="bg-panel border border-subtle rounded-xl px-3 sm:px-4 py-3 space-y-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ranked.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            {ranked.map((player, i) => (
              <SortablePlayerRow
                key={player.id}
                editing={editing}
                player={player}
                rank={i}
                isFirst={i === 0}
                isLast={i === ranked.length - 1}
                onRemove={() => onRemove(position, player.id)}
                onMoveUp={() => onReorder(position, arrayMove(ranked.map(p => p.id), i, i - 1))}
                onMoveDown={() => onReorder(position, arrayMove(ranked.map(p => p.id), i, i + 1))}
              />
            ))}
          </SortableContext>
        </DndContext>
        {editing && ranked.length < 8 && (
          <button
            onClick={() => onAdd(position)}
            className="flex items-center gap-1.5 text-xs font-medium text-soft bg-well border border-firm hover:border-red-600/50 hover:text-red-500 rounded-lg px-2.5 py-1 transition-colors"
          >
            <Plus size={11} />
            Add player
          </button>
        )}
      </div>
    </div>
  );
}

// ── Player Picker ─────────────────────────────────────────────────────────────

function PlayerPicker({
  position, available, counts, onPick, onClose,
}: {
  position: LineupPosition;
  available: Player[];
  counts: Record<string, number>;
  onPick: (playerIds: string[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? available.filter((p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(query.toLowerCase())
      )
    : available;

  const sorted = [...filtered].sort((a, b) => {
    const aPlays = a.positions.includes(position as never) ? 0 : 1;
    const bPlays = b.positions.includes(position as never) ? 0 : 1;
    if (aPlays !== bPlays) return aPlays - bPlays;
    return a.lastName.localeCompare(b.lastName);
  });

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <Modal title={`Add to ${position}`} onClose={onClose}>
      {available.length === 0 ? (
        <p className="text-soft text-sm text-center py-4">All players already assigned to this position.</p>
      ) : (
        <>
          <input
            type="text"
            placeholder="Search players…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-well border border-firm rounded-lg px-3 py-2 text-sm text-strong placeholder-soft focus:outline-none focus:border-red-600/50 mb-3"
          />
          <div className="space-y-0.5 max-h-64 overflow-y-auto -mx-1 mb-3">
            {sorted.length === 0 && (
              <p className="text-soft text-sm text-center py-4">No players match "{query}"</p>
            )}
            {sorted.map((player) => {
              const count = counts[player.id] ?? 0;
              const playsPos = player.positions.includes(position as never);
              const isSelected = selected.has(player.id);
              return (
                <button
                  key={player.id}
                  onClick={() => toggle(player.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                    isSelected ? 'bg-red-600/10 border border-red-600/20' : 'hover:bg-well border border-transparent'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-red-600 border-red-600' : 'border-firm'
                  }`}>
                    {isSelected && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-red-600/15 border border-red-600/20 flex items-center justify-center text-xs font-bold text-red-500 shrink-0">
                    {player.number != null ? player.number : (player.firstName[0] + player.lastName[0]).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-strong">{player.firstName} {player.lastName}</div>
                    <div className="text-xs text-ghost">
                      {count === 0 ? 'No positions assigned yet' : `${count} position${count !== 1 ? 's' : ''} assigned`}
                    </div>
                  </div>
                  {playsPos && (
                    <span className="text-xs bg-red-600/15 text-red-500 px-2 py-0.5 rounded-full shrink-0">
                      plays {position}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => selected.size > 0 && onPick([...selected])}
            disabled={selected.size === 0}
            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
          >
            {selected.size === 0 ? 'Select players' : `Add ${selected.size} player${selected.size !== 1 ? 's' : ''}`}
          </button>
        </>
      )}
    </Modal>
  );
}

// ── Aggregate helpers ─────────────────────────────────────────────────────────

type AggregateEntry = { playerId: string; score: number; coachCount: number };

function computeAggregate(allRankings: LineupRankings[]): Record<string, AggregateEntry[]> {
  const positions = [...new Set(allRankings.flatMap((r) => Object.keys(r)))] as LineupPosition[];
  const result: Record<string, AggregateEntry[]> = {};
  for (const pos of positions) {
    const allPlayers = [...new Set(allRankings.flatMap((r) => r[pos] ?? []))];
    const scores: Record<string, number> = {};
    const counts: Record<string, number> = {};
    for (const id of allPlayers) { scores[id] = 0; counts[id] = 0; }
    for (const r of allRankings) {
      const ranked = r[pos] ?? [];
      ranked.forEach((id, i) => { scores[id] += MAX_RANKED - i; counts[id]++; });
    }
    result[pos] = allPlayers
      .map((id) => ({ playerId: id, score: scores[id], coachCount: counts[id] }))
      .sort((a, b) => b.score - a.score);
  }
  return result;
}

function AggregateView({ preview, seasonId, roster }: { preview: boolean; seasonId: string; roster: Player[] }) {
  const { coachRankings, loadCoachRankings } = useStore();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const toggleExpanded = (pos: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(pos) ? next.delete(pos) : next.add(pos);
      return next;
    });

  useEffect(() => {
    setLoading(true);
    loadCoachRankings(seasonId).then(() => setLoading(false));
  }, [seasonId]);

  const byCoach = coachRankings[seasonId] ?? {};
  const allRankings = Object.values(byCoach);
  const numCoaches = allRankings.length;

  if (loading) {
    return (
      <div className="flex justify-center pt-12">
        <Spinner />
      </div>
    );
  }

  if (numCoaches < 2 && !preview) {
    return (
      <div className="pt-8 text-center">
        <ChartBar size={40} className="text-ghost mx-auto mb-3" />
        <p className="text-sm text-soft">Not enough rankings yet.</p>
        <p className="text-xs text-ghost mt-1">At least 2 coaches need to submit rankings to see the aggregate.</p>
      </div>
    );
  }

  const aggregate = computeAggregate(allRankings);
  const playerById = Object.fromEntries(roster.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <p className="text-xs text-soft">
        Based on rankings from <span className="text-mid font-medium">{numCoaches} coach{numCoaches !== 1 ? 'es' : ''}</span> · Borda count
      </p>
      {POSITION_GROUPS.map((group) => {
        const hasAny = group.positions.some((pos) => aggregate[pos]?.length);
        if (!hasAny) return null;
        return (
          <div key={group.label}>
            <H2 className="mb-2">{group.label}</H2>
            <div className="space-y-2">
              {group.positions.map((pos) => {
                const entries = aggregate[pos];
                if (!entries?.length) return null;
                return (
                  <div key={pos} className="bg-panel border border-subtle rounded-xl px-4 py-3">
                    <div className="flex items-start gap-4">
                      <span className="text-xs font-bold text-soft w-6 pt-0.5 shrink-0 text-right">{pos}</span>
                      <div className="flex-1 space-y-2">
                        {(expanded.has(pos) ? entries : entries.slice(0, 3)).map((entry, i) => {
                          const player = playerById[entry.playerId];
                          if (!player) return null;
                          return (
                            <div key={entry.playerId} className="flex items-center gap-2">
                              <span className="text-xs text-ghost w-6 shrink-0">{RANK_LABEL(i)}</span>
                              <span className="flex-1 text-sm text-strong truncate">
                                {player.firstName} {player.lastName}
                                {player.number != null && <span className="text-ghost text-xs ml-1.5">#{player.number}</span>}
                              </span>
                              <span className="text-xs px-1.5 py-0.5 rounded-full shrink-0 bg-well text-soft">
                                {entry.score} pt{entry.score !== 1 ? 's' : ''}
                              </span>
                            </div>
                          );
                        })}
                        {entries.length > 3 && (
                          <button
                            className="text-xs text-ghost hover:text-soft transition-colors"
                            onClick={() => toggleExpanded(pos)}
                          >
                            {expanded.has(pos) ? 'Show less' : `Show all ${entries.length}`}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function LineupPage() {
  const { id: seasonId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const preview = searchParams.get('preview') === 'true';
  const { players, loadLineupRankings, saveLineupRankings } = useStore();
  const { user } = useAuthStore();

  const isMobile = window.matchMedia('(pointer: coarse)').matches;
  const [showHelp, setShowHelp] = useState(false);
  const [editing, setEditing] = useState(!isMobile);
  const [tab, setTab] = useState<'my' | 'aggregate'>('my');
  const [local, setLocal] = useState<LineupRankings>({});
  const [picking, setPicking] = useState<LineupPosition | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'pending' | 'saving' | 'saved'>('idle');

  const initialized = useRef(false);
  const initialRankings = useRef<LineupRankings>({});
  const lastSaved = useRef('{}');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const roster = players.filter((p) => p.seasonId === seasonId);

  useEffect(() => {
    if (!seasonId || !user) return;
    loadLineupRankings(seasonId, user.id).then(() => {
      const loaded = useStore.getState().lineupRankings[seasonId] ?? {};
      setLocal(loaded);
      initialRankings.current = loaded;
      lastSaved.current = stableStringify(loaded);
      initialized.current = true;
    });
  }, [seasonId, user?.id]);

  useEffect(() => {
    if (!initialized.current || !user || !seasonId) return;
    const serialized = stableStringify(local);
    if (serialized === lastSaved.current) return;
    setSaveStatus('pending');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveStatus('saving');
      await saveLineupRankings(seasonId, local, user.id);
      lastSaved.current = serialized;
      setSaveStatus('saved');
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [local]);

  const addPlayers = (position: LineupPosition, playerIds: string[]) => {
    setLocal((prev) => {
      const current = prev[position] ?? [];
      const slots = 8 - current.length;
      const toAdd = playerIds.filter((id) => !current.includes(id)).slice(0, slots);
      return { ...prev, [position]: [...current, ...toAdd] };
    });
    setPicking(null);
  };

  const removePlayer = (position: LineupPosition, playerId: string) => {
    setLocal((prev) => ({
      ...prev,
      [position]: (prev[position] ?? []).filter((id) => id !== playerId),
    }));
  };

  const reorderPosition = (position: LineupPosition, ids: string[]) => {
    setLocal((prev) => ({ ...prev, [position]: ids }));
  };

  const availableFor = (position: LineupPosition) => {
    const assigned = new Set(local[position] ?? []);
    return roster.filter((p) => !assigned.has(p.id));
  };

  const warnings = getWarnings(local, roster);
  const counts = getAssignmentCounts(local);
  const hasAnyRankings = Object.values(local).some((ids) => ids && ids.length > 0);

  if (roster.length === 0) {
    return (
      <div className="p-4 max-w-3xl mx-auto pt-6">
        <EmptyState
          icon={<Users size={48} />}
          title="No players on roster"
          description="Add players to your roster before building a lineup."
        />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="mb-5 pt-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <H1>Lineup Ranker</H1>
            <button
              aria-label="How it works"
              className="text-ghost hover:text-soft transition-colors"
              onClick={() => setShowHelp(true)}
            >
              <Question size={16} weight="bold" />
            </button>
          </div>
          {tab === 'my' && (
            <div className="flex items-center gap-3">
              {!editing && stableStringify(local) !== stableStringify(initialRankings.current) && (
                <button
                  className="text-xs text-ghost hover:text-soft transition-colors"
                  onClick={() => setLocal(initialRankings.current)}
                >
                  Restore
                </button>
              )}
              <span className="text-xs text-ghost">
                {saveStatus === 'saving' && 'Saving…'}
                {saveStatus === 'saved' && '✓ Saved'}
              </span>
              {isMobile && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-soft">Edit</span>
                  <Switch
                    checked={editing}
                    onChange={setEditing}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                      editing ? 'bg-red-600' : 'bg-firm'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        editing ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </Switch>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex sm:inline-flex bg-well rounded-lg p-0.5">
          <button
            onClick={() => setTab('my')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'my' ? 'bg-wash text-strong' : 'text-soft hover:text-mid'}`}
          >
            My Rankings
          </button>
          <button
            onClick={() => setTab('aggregate')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'aggregate' ? 'bg-wash text-strong' : 'text-soft hover:text-mid'}`}
          >
            Coach Rankings
          </button>
        </div>
      </div>

      {tab === 'aggregate' ? (
        <AggregateView preview={preview} roster={roster} seasonId={seasonId!} />
      ) : (
        <>
          <div className="space-y-6">
            {POSITION_GROUPS.map((group) => (
              <div key={group.label}>
                <H2 className="mb-2">{group.label}</H2>
                <div className="space-y-2">
                  {group.positions.map((position) => {
                    const ranked = (local[position] ?? [])
                      .map((id) => roster.find((p) => p.id === id))
                      .filter(Boolean) as Player[];
                    return (
                      <PositionList
                        key={position}
                        editing={editing}
                        position={position}
                        ranked={ranked}
                        onReorder={reorderPosition}
                        onRemove={removePlayer}
                        onAdd={setPicking}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            {hasAnyRankings && (
              <div>
                {warnings.length > 0 ? (
                  <div className="space-y-1.5">
                    <H2 className="mb-2">Warnings</H2>
                    {warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                        <WarningCircle size={13} className="shrink-0 mt-0.5" />
                        <span><span className="font-semibold">{w.name}</span> — {w.message}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-green-500 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                    <CheckCircle size={13} />
                    All assignments look good
                  </div>
                )}
              </div>
            )}
          </div>

          {picking && (
            <PlayerPicker
              position={picking}
              available={availableFor(picking)}
              counts={counts}
              onPick={(ids) => addPlayers(picking, ids)}
              onClose={() => setPicking(null)}
            />
          )}
        </>
      )}

      {showHelp && (
        <Modal onClose={() => setShowHelp(false)} title="How it works">
          <div className="space-y-5 text-sm">
            <div>
              <H3 className="mb-2">Assignment requirements</H3>
              <p className="text-soft leading-relaxed">
                Each player you rank must appear in at least one <span className="text-mid font-medium">infield position</span> (C, 1B, 2B, 3B, or SS) and at least one <span className="text-mid font-medium">outfield position</span> (LF, CF, or RF). Players missing either will show a warning until the gap is filled.
              </p>
              <p className="text-soft leading-relaxed mt-2">
                You can rank up to <span className="text-mid font-medium">8 players per position</span>.
              </p>
            </div>
            <div className="border-t border-subtle pt-5">
              <H3 className="mb-2">Coach Rankings (aggregate)</H3>
              <p className="text-soft leading-relaxed mb-3">
                The aggregate uses <a className="text-mid font-medium underline hover:text-strong transition-colors" href="https://en.wikipedia.org/wiki/Borda_count" rel="noopener noreferrer" target="_blank">Borda count</a> with a fixed scale: 1st place always earns 8 points, 2nd always earns 7, and so on — regardless of how many players a coach ranked. This keeps scores comparable across coaches.
              </p>
              <div className="bg-well rounded-lg px-4 py-3 space-y-1 text-xs font-mono text-soft">
                <div>1st place → <span className="text-mid">8 pts</span></div>
                <div>2nd place → <span className="text-mid">7 pts</span></div>
                <div>3rd place → <span className="text-mid">6 pts</span></div>
                <div>4th place → <span className="text-mid">5 pts</span></div>
                <div className="text-ghost">…and so on</div>
              </div>
              <p className="text-soft leading-relaxed mt-3">
                Each player's points are summed across all coaches who ranked them. The top 3 players per position are shown by default.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
