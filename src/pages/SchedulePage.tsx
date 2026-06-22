import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDots, CircleNotch, Link as LinkIcon, MapPin, PencilSimple, Plus, Trash, UploadSimple, WarningCircle } from '@phosphor-icons/react';
import { format, parseISO } from 'date-fns';
import { useAuthStore } from '../store/authStore';
import { useStore } from '../store';
import { Button } from '../components/ui/Button';
import { Divider } from '../components/ui/Divider';
import { EmptyState } from '../components/ui/EmptyState';
import { IconButton } from '../components/ui/IconButton';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { parseCSV } from '../lib/parseSchedule';
import { fetchAndParseICS, parseICS } from '../lib/parseICS';
import type { Game } from '../types';

const RESULT_COLORS = {
  W: 'bg-green-500/15 text-green-400',
  L: 'bg-red-500/15 text-red-400',
  T: 'bg-yellow-500/15 text-yellow-400',
};

function GameForm({
  initial,
  onCancel,
  onSubmit,
  seasonId,
}: {
  initial?: Partial<Game>;
  onCancel: () => void;
  onSubmit: (data: Omit<Game, 'id'>) => void;
  seasonId: string;
}) {
  const [form, setForm] = useState<Omit<Game, 'id'>>({
    seasonId,
    date: initial?.date ?? '',
    time: initial?.time ?? '',
    opponent: initial?.opponent ?? '',
    location: initial?.location ?? '',
    isHome: initial?.isHome ?? true,
    result: initial?.result,
    myScore: initial?.myScore,
    opponentScore: initial?.opponentScore,
    notes: initial?.notes ?? '',
  });

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Date" onChange={(e) => set('date', e.target.value)} required type="date" value={form.date} />
        <Input label="Time" onChange={(e) => set('time', e.target.value)} type="time" value={form.time} />
      </div>
      <Input label="Opponent" onChange={(e) => set('opponent', e.target.value)} placeholder="Team name" required value={form.opponent} />
      <Input label="Location / Field" onChange={(e) => set('location', e.target.value)} placeholder="e.g. Memorial Park Field 1" value={form.location} />
      <div className="flex items-center gap-2">
        <input checked={form.isHome} className="accent-green-500" id="isHome" onChange={(e) => set('isHome', e.target.checked)} type="checkbox" />
        <label className="text-sm text-mid" htmlFor="isHome">Home game</label>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Select label="Result" onChange={(e) => set('result', e.target.value || undefined)} value={form.result ?? ''}>
          <option value="">—</option>
          <option value="W">W</option>
          <option value="L">L</option>
          <option value="T">T</option>
        </Select>
        <Input label="Us" min={0} onChange={(e) => set('myScore', e.target.value ? Number(e.target.value) : undefined)} type="number" value={form.myScore ?? ''} />
        <Input label="Them" min={0} onChange={(e) => set('opponentScore', e.target.value ? Number(e.target.value) : undefined)} type="number" value={form.opponentScore ?? ''} />
      </div>
      <Textarea label="Notes" onChange={(e) => set('notes', e.target.value)} value={form.notes} />
      <div className="flex gap-2 pt-1">
        <Button className="flex-1" onClick={onCancel} type="button" variant="secondary">Cancel</Button>
        <Button className="flex-1" type="submit">Save Game</Button>
      </div>
    </form>
  );
}

function WebCalImport({
  myTeam,
  onBack,
  onImport,
  seasonId,
}: {
  myTeam: string;
  onBack: () => void;
  onImport: (games: Omit<Game, 'id'>[]) => void;
  seasonId: string;
}) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');
  const icsFileRef = useRef<HTMLInputElement>(null);

  const handleFetch = async () => {
    if (!url.trim()) return;
    setStatus('loading');
    setError('');
    try {
      const games = await fetchAndParseICS(url.trim(), seasonId, myTeam);
      if (!games.length) throw new Error('No events found in the feed.');
      onImport(games);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      const isCors = msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('cors');
      setError(
        isCors
          ? 'Could not fetch the feed directly (CORS). Download the .ics file from your league site and use "Import .ics file" below instead.'
          : msg
      );
      setStatus('error');
    }
  };

  const handleICSFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const games = parseICS(text, seasonId, myTeam);
      if (games.length) { onImport(games); }
      else setError('No events found in the .ics file.');
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <button className="flex items-center gap-1.5 text-sm text-soft hover:text-mid transition-colors" onClick={onBack}>
        <ArrowLeft size={14} /> Back
      </button>

      <div>
        <label className="block text-xs font-medium text-soft mb-1">WebCal or HTTPS URL</label>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-well border border-firm rounded-lg px-3 py-2 text-sm text-strong placeholder-soft focus:outline-none focus:ring-2 focus:ring-green-500/50"
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
            placeholder="webcal:// or https://..."
            value={url}
          />
          <Button disabled={status === 'loading' || !url.trim()} onClick={handleFetch} size="sm">
            {status === 'loading' ? <CircleNotch className="animate-spin" size={15} /> : 'Import'}
          </Button>
        </div>
        <p className="text-xs text-soft mt-1">Paste the webcal link from your league's schedule page.</p>
      </div>

      {error && (
        <div className="flex gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400">
          <WarningCircle className="shrink-0 mt-0.5" size={14} />
          <span>{error}</span>
        </div>
      )}

      <Divider label="or" />

      <div>
        <input accept=".ics" className="hidden" onChange={handleICSFile} ref={icsFileRef} type="file" />
        <Button className="w-full" onClick={() => icsFileRef.current?.click()} variant="secondary">
          <UploadSimple size={15} /> Import .ics file
        </Button>
        <p className="mt-1 text-center text-xs text-soft">Download the .ics from your league site, then import it here.</p>
      </div>
    </div>
  );
}

function AddGameModal({
  myTeam,
  onAddGame,
  onAddGames,
  onClose,
  seasonId,
}: {
  myTeam: string;
  onAddGame: (data: Omit<Game, 'id'>) => void;
  onAddGames: (games: Omit<Game, 'id'>[]) => void;
  onClose: () => void;
  seasonId: string;
}) {
  const [view, setView] = useState<'main' | 'webcal'>('main');
  const csvRef = useRef<HTMLInputElement>(null);

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const csv = ev.target?.result as string;
      const parsed = parseCSV(csv, seasonId);
      if (parsed.length) { onAddGames(parsed); onClose(); }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  if (view === 'webcal') {
    return (
      <Modal onClose={onClose} title="Import WebCal / .ics">
        <WebCalImport
          myTeam={myTeam}
          onBack={() => setView('main')}
          onImport={(games) => { onAddGames(games); onClose(); }}
          seasonId={seasonId}
        />
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} title="Add Game">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => setView('webcal')} variant="secondary">
            <LinkIcon size={15} /> WebCal / .ics
          </Button>
          <Button className="flex-1" onClick={() => csvRef.current?.click()} variant="secondary">
            <UploadSimple size={15} /> CSV
          </Button>
        </div>
        <input accept=".csv" className="hidden" onChange={handleCSV} ref={csvRef} type="file" />

        <Divider label="or add manually" />

        <GameForm
          onCancel={onClose}
          onSubmit={(data) => { onAddGame(data); onClose(); }}
          seasonId={seasonId}
        />
      </div>
    </Modal>
  );
}

function formatDate(date: string) {
  try { return format(parseISO(date), 'EEE, MMM d'); } catch { return date; }
}

function formatTime(time: string) {
  if (!time) return '';
  try {
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'pm' : 'am';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
  } catch { return time; }
}

export function SchedulePage() {
  const { id: seasonId } = useParams<{ id: string }>();
  const { games, seasons, addGame, addGames, updateGame, deleteGame } = useStore();
  const { user } = useAuthStore();
  const [editing, setEditing] = useState<Game | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const season = seasons.find((s) => s.id === seasonId);
  const seasonGames = games
    .filter((g) => g.seasonId === seasonId)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (!seasonId) {
    return (
      <EmptyState
        description="Go to Seasons and create or select a season first."
        icon={<CalendarDots size={48} />}
        title="Season not found"
      />
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <PageHeader
        action={<Button onClick={() => setShowAdd(true)} size="sm"><Plus size={15} /> Add Game</Button>}
        className="mb-1 pt-2"
        title="Schedule"
      />

      {seasonGames.length === 0 ? (
        <EmptyState
          action={<Button onClick={() => setShowAdd(true)} size="sm"><Plus size={15} /> Add Game</Button>}
          description="Import a WebCal feed, upload a CSV or .ics file, or add games manually."
          icon={<CalendarDots size={48} />}
          title="No games yet"
        />
      ) : (
        <div className="space-y-2">
          {seasonGames.map((g) => (
            <div className="bg-panel rounded-xl border border-subtle p-3 flex items-start gap-3" key={g.id}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-strong text-sm">
                    {g.isHome ? 'vs' : '@'} {g.opponent}
                  </span>
                  {g.result && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${RESULT_COLORS[g.result]}`}>
                      {g.result}{g.myScore != null ? ` ${g.myScore}–${g.opponentScore ?? '?'}` : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-soft">
                  <span className="flex items-center gap-1">
                    <CalendarDots size={11} /> {formatDate(g.date)}{g.time ? ` · ${formatTime(g.time)}` : ''}
                  </span>
                  {g.location && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin size={11} /> {g.location}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <IconButton onClick={() => setEditing(g)}><PencilSimple size={15} /></IconButton>
                <IconButton onClick={() => deleteGame(g.id)} variant="danger"><Trash size={15} /></IconButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddGameModal
          myTeam={season?.teamName ?? ''}
          onAddGame={(data) => { if (user) addGame(data, user.id); }}
          onAddGames={(gs) => { if (user) addGames(gs, user.id); }}
          onClose={() => setShowAdd(false)}
          seasonId={seasonId}
        />
      )}
      {editing && (
        <Modal onClose={() => setEditing(null)} title="Edit Game">
          <GameForm
            initial={editing}
            onCancel={() => setEditing(null)}
            onSubmit={(data) => { updateGame(editing.id, data); setEditing(null); }}
            seasonId={seasonId}
          />
        </Modal>
      )}
    </div>
  );
}
