import { type ReactNode } from 'react';
import { H1, H2 } from './Heading';

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
        {size === 'lg' ? <H1>{title}</H1> : <H2>{title}</H2>}
        {subtitle && <p className="text-xs text-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
