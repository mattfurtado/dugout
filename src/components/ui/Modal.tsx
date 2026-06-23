import { type ReactNode, useEffect } from 'react';
import { X } from '@phosphor-icons/react';
import { H2 } from './Heading';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, onClose, children }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-panel border-0 sm:border border-subtle rounded-none sm:rounded-2xl w-full sm:max-w-lg h-dvh sm:h-auto sm:max-h-[90dvh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-subtle">
          <H2>{title}</H2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-well text-soft hover:text-mid">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 flex-1">{children}</div>
      </div>
    </div>
  );
}
