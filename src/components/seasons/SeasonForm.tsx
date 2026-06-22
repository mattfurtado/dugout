import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import type { Season } from '../../types';

const AGE_GROUPS = ['6U', '7U', '8U', '9U', '10U', '11U', '12U', '13U', '14U', '15U', '16U', '18U', 'Other'];

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
      <Input
        label="Season Name"
        required
        value={form.name}
        onChange={(e) => set('name', e.target.value)}
        placeholder="e.g. Spring 2025"
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Year"
          type="number"
          required
          value={form.year}
          onChange={(e) => set('year', e.target.value)}
        />
        <Select
          label="Age Group"
          value={form.ageGroup}
          onChange={(e) => set('ageGroup', e.target.value)}
        >
          {AGE_GROUPS.map((g) => <option key={g}>{g}</option>)}
        </Select>
      </div>
      <Input
        label="Team Name"
        value={form.teamName}
        onChange={(e) => set('teamName', e.target.value)}
        placeholder="e.g. Red Sox"
      />
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="flex-1">Save Season</Button>
      </div>
    </form>
  );
}
