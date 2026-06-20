import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, UploadSimple, Trash, CalendarDots, MapPin, PencilSimple, Link as LinkIcon, CircleNotch, WarningCircle } from '@phosphor-icons/react';
import { format, parseISO } from 'date-fns';
import { useStore } from '../store';
import { useAuthStore } from '../store/authStore';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { parseCSV } from '../lib/parseSchedule';
import { fetchAndParseICS, parseICS } from '../lib/parseICS';
import type { Game } from '../types';

const RESULT_COLORS = {
  W: 'bg-green-500/15 text-green-400',
  L: 'bg-red-500/15 text-red-400',
  T: 'bg-yellow-500/15 text-yellow-400',
};

const inputCls = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50';

function GameForm({
  initial,
  seasonId,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<Game>;
  seasonId: string;
  onSubmit: (data: Omit<Game, 'id'>) => void;
  onCancel: () => void;
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
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Date</label>
          <input type="date" required value={form.date} onChange={(e) => set('date', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Time</label>
          <input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Opponent</label>
        <input required value={form.opponent} onChange={(e) => set('opponent', e.target.value)} placeholder="Team name" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Location / Field</label>
        <input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Memorial Park Field 1" className={inputCls} />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="isHome" checked={form.isHome} onChange={(e) => set('isHome', e.target.checked)} className="accent-green-500" />
        <label htmlFor="isHome" className="text-sm text-zinc-300">Home game</label>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Result</label>
          <select value={form.result ?? ''} onChange={(e) => set('result', e.target.value || undefined)} className={`${inputCls} bg-zinc-800`}>
            <option value="">—</option>
            <option value="W">W</option>
            <option value="L">L</option>
            <option value="T">T</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Us</label>
          <input type="number" min={0} value={form.myScore ?? ''} onChange={(e) => set('myScore', e.target.value ? Number(e.target.value) : undefined)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Them</label>
          <input type="number" min={0} value={form.opponentScore ?? ''} onChange={(e) => set('opponentScore', e.target.value ? Number(e.target.value) : undefined)} className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Notes</label>
        <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="flex-1">Save Game</Button>
      </div>
    </form>
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

function WebCalModal({
  seasonId,
  myTeam,
  onImport,
  onClose,
}: {
  seasonId: string;
  myTeam: string;
  onImport: (games: Omit<Game, 'id'>[]) => void;
  onClose: () => void;
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
      onClose();
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
      if (games.length) { onImport(games); onClose(); }
      else setError('No events found in the .ics file.');
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">WebCal or HTTPS URL</label>
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="webcal:// or https://..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/50"
            onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
          />
          <Button size="sm" onClick={handleFetch} disabled={status === 'loading' || !url.trim()}>
            {status === 'loading' ? <CircleNotch size={15} className="animate-spin" /> : 'Import'}
          </Button>
        </div>
        <p className="text-xs text-zinc-600 mt-1">Paste the webcal link from your league's schedule page.</p>
      </div>

      {error && (
        <div className="flex gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400">
          <WarningCircle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="relative flex items-center gap-2">
        <div className="flex-1 border-t border-zinc-800" />
        <span className="text-xs text-zinc-600 px-1">or</span>
        <div className="flex-1 border-t border-zinc-800" />
      </div>

      <div>
        <input ref={icsFileRef} type="file" accept=".ics" className="hidden" onChange={handleICSFile} />
        <Button variant="secondary" className="w-full" onClick={() => icsFileRef.current?.click()}>
          <UploadSimple size={15} /> Import .ics file
        </Button>
        <p className="text-xs text-zinc-600 mt-1 text-center">Download the .ics from your league site, then import it here.</p>
      </div>

      <Button variant="ghost" className="w-full" onClick={onClose}>Cancel</Button>
    </div>
  );
}

export function SchedulePage() {
  const { id: seasonId } = useParams<{ id: string }>();
  const { games, seasons, addGame, addGames, updateGame, deleteGame } = useStore();
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Game | null>(null);
  const [showWebCal, setShowWebCal] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const season = seasons.find((s) => s.id === seasonId);
  const seasonGames = games
    .filter((g) => g.seasonId === seasonId)
    .sort((a, b) => a.date.localeCompare(b.date));

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !seasonId || !user) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const csv = ev.target?.result as string;
      const parsed = parseCSV(csv, seasonId);
      if (parsed.length) addGames(parsed, user.id);
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  if (!seasonId) {
    return (
      <EmptyState
        icon={<CalendarDots size={48} />}
        title="Season not found"
        description="Go to Seasons and create or select a season first."
      />
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-bold text-zinc-100">Schedule</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowWebCal(true)}>
            <LinkIcon size={15} /> WebCal
          </Button>
          <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
            <UploadSimple size={15} /> CSV
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Add
          </Button>
        </div>
      </div>

      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />

      {seasonGames.length === 0 ? (
        <EmptyState
          icon={<CalendarDots size={48} />}
          title="No games yet"
          description="Import a WebCal feed, upload a CSV or .ics file, or add games manually."
          action={
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="secondary" size="sm" onClick={() => setShowWebCal(true)}><LinkIcon size={15} /> WebCal / .ics</Button>
              <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}><UploadSimple size={15} /> CSV</Button>
              <Button size="sm" onClick={() => setShowForm(true)}><Plus size={15} /> Add Game</Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-2">
          {seasonGames.map((g) => (
            <div key={g.id} className="bg-zinc-900 rounded-xl border border-zinc-800 p-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-zinc-100 text-sm">
                    {g.isHome ? 'vs' : '@'} {g.opponent}
                  </span>
                  {g.result && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${RESULT_COLORS[g.result]}`}>
                      {g.result}{g.myScore != null ? ` ${g.myScore}–${g.opponentScore ?? '?'}` : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
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
                <button onClick={() => setEditing(g)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300">
                  <PencilSimple size={15} />
                </button>
                <button onClick={() => deleteGame(g.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400">
                  <Trash size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="Add Game" onClose={() => setShowForm(false)}>
          <GameForm
            seasonId={seasonId}
            onSubmit={(data) => { if (user) addGame(data, user.id); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Game" onClose={() => setEditing(null)}>
          <GameForm
            initial={editing}
            seasonId={seasonId}
            onSubmit={(data) => { updateGame(editing.id, data); setEditing(null); }}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
      {showWebCal && (
        <Modal title="Import WebCal / .ics" onClose={() => setShowWebCal(false)}>
          <WebCalModal
            seasonId={seasonId}
            myTeam={season?.teamName ?? ''}
            onImport={(games) => { if (user) addGames(games, user.id); }}
            onClose={() => setShowWebCal(false)}
          />
        </Modal>
      )}
    </div>
  );
}
