import { type ReactNode } from 'react';
import { H3 } from './Heading';

interface Props {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-ghost mb-4">{icon}</div>
      <H3 className="mb-1">{title}</H3>
      {description && <p className="text-sm text-soft mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}
