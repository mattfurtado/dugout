import { type ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  size?: 'lg' | 'md';
  className?: string;
}

export function PageHeader({ title, subtitle, action, size = 'lg', className = '' }: Props) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div>
        <h1 className={`font-bold text-strong ${size === 'lg' ? 'text-lg' : 'text-base'}`}>{title}</h1>
        {subtitle && <p className="text-xs text-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
