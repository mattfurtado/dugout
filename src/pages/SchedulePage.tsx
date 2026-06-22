import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDots, CircleNotch, Link as LinkIcon, MapPin, Plus, UploadSimple, WarningCircle } from '@phosphor-icons/react';
import { format, isBefore, parseISO, startOfToday } from 'date-fns';
import { useAuthStore } from '../store/authStore';
import { useStore } from '../store';
import { Button } from '../components/ui/Button';
import { Divider } from '../components/ui/Divider';
import { EmptyState } from '../components/ui/EmptyState';
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
        <Input label="Time (ET)" onChange={(e) => set('time', e.target.value)} type="time" value={form.time} />
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
  onReplaceGames,
  seasonId,
}: {
  myTeam: string;
  onAddGame: (data: Omit<Game, 'id'>) => void;
  onAddGames: (games: Omit<Game, 'id'>[]) => void;
  onClose: () => void;
  onReplaceGames: (games: Omit<Game, 'id'>[]) => void;
  seasonId: string;
}) {
  const [replace, setReplace] = useState(true);
  const [view, setView] = useState<'main' | 'webcal'>('main');
  const csvRef = useRef<HTMLInputElement>(null);

  const handleImport = replace ? onReplaceGames : onAddGames;

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const csv = ev.target?.result as string;
      const parsed = parseCSV(csv, seasonId);
      if (parsed.length) { handleImport(parsed); onClose(); }
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
          onImport={(games) => { handleImport(games); onClose(); }}
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
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            checked={replace}
            className="accent-green-500"
            onChange={(e) => setReplace(e.target.checked)}
            type="checkbox"
          />
          <span className="text-sm text-soft">Replace existing games</span>
        </label>

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

function formatTime(time: string) {
  if (!time) return '';
  try {
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'pm' : 'am';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix} ET`;
  } catch { return time; }
}

function GameCard({ g }: { g: Game }) {
  const date = parseISO(g.date);
  return (
    <div className="bg-panel rounded-xl border border-subtle p-4 flex items-start gap-4">
      <div className="shrink-0 w-11 text-center">
        <div className="text-xs font-medium text-soft uppercase leading-none">{format(date, 'MMM')}</div>
        <div className="text-2xl font-bold text-strong leading-tight">{format(date, 'd')}</div>
        <div className="text-xs text-ghost leading-none">{format(date, 'EEE')}</div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-strong">
            {g.isHome ? 'vs' : '@'} {g.opponent}
          </span>
          {g.result && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${RESULT_COLORS[g.result]}`}>
              {g.result}{g.myScore != null ? ` ${g.myScore}–${g.opponentScore ?? '?'}` : ''}
            </span>
          )}
        </div>
        {g.time && (
          <div className="text-xs text-soft mt-0.5">{formatTime(g.time)}</div>
        )}
        {g.location && (
          <a
            className="flex items-center gap-1 text-xs text-ghost hover:text-green-400 transition-colors mt-0.5 w-fit"
            href={`https://maps.google.com/?q=${encodeURIComponent(g.location)}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <MapPin size={11} /> {g.location}
          </a>
        )}
      </div>

      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${g.isHome ? 'bg-green-500/15 text-green-400' : 'bg-well text-ghost'}`}>
        {g.isHome ? 'Home' : 'Away'}
      </span>
    </div>
  );
}

export function SchedulePage() {
  const { id: seasonId } = useParams<{ id: string }>();
  const { games, seasons, addGame, addGames, replaceSeasonGames } = useStore();
  const { user } = useAuthStore();
  const [showAdd, setShowAdd] = useState(false);

  const season = seasons.find((s) => s.id === seasonId);
  const today = startOfToday();

  const seasonGames = games
    .filter((g) => g.seasonId === seasonId)
    .sort((a, b) => a.date.localeCompare(b.date));

  const upcoming = seasonGames.filter((g) => !isBefore(parseISO(g.date), today));
  const past = seasonGames.filter((g) => isBefore(parseISO(g.date), today));

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
        className="mb-4 pt-2"
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
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-soft uppercase tracking-widest mb-2">Upcoming</h2>
              <div className="space-y-2">
                {upcoming.map((g) => <GameCard g={g} key={g.id} />)}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-soft uppercase tracking-widest mb-2">Past Games</h2>
              <div className="space-y-2">
                {[...past].reverse().map((g) => <GameCard g={g} key={g.id} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {showAdd && (
        <AddGameModal
          myTeam={season?.teamName ?? ''}
          onAddGame={(data) => { if (user) addGame(data, user.id); }}
          onAddGames={(gs) => { if (user) addGames(gs, user.id); }}
          onClose={() => setShowAdd(false)}
          onReplaceGames={(gs) => { if (user) replaceSeasonGames(seasonId, gs, user.id); }}
          seasonId={seasonId}
        />
      )}
    </div>
  );
}
