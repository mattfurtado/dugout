import { useState } from 'react';
import { Button } from '../ui/Button';
import type { Season } from '../../types';

const AGE_GROUPS = ['6U', '7U', '8U', '9U', '10U', '11U', '12U', '13U', '14U', '15U', '16U', '18U', 'Other'];

const inputCls = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50';

interface Props {
  initial?: Partial<Season>;
  onSubmit: (data: Omit<Season, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function SeasonForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    year: initial?.year ?? new Date().getFullYear(),
    teamName: initial?.teamName ?? '',
    ageGroup: initial?.ageGroup ?? '10U',
  });

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...form, year: Number(form.year) });
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Season Name</label>
        <input
          required
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Spring 2025"
          className={inputCls}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Year</label>
          <input
            type="number"
            required
            value={form.year}
            onChange={(e) => set('year', e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Age Group</label>
          <select
            value={form.ageGroup}
            onChange={(e) => set('ageGroup', e.target.value)}
            className={`${inputCls} bg-zinc-800`}
          >
            {AGE_GROUPS.map((g) => <option key={g}>{g}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Team Name</label>
        <input
          value={form.teamName}
          onChange={(e) => set('teamName', e.target.value)}
          placeholder="e.g. Red Sox"
          className={inputCls}
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="flex-1">Save Season</Button>
      </div>
    </form>
  );
}
