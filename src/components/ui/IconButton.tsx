import { type ButtonHTMLAttributes } from 'react';

type Variant = 'default' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  default: 'text-ghost hover:text-mid hover:bg-well',
  danger:  'text-ghost hover:text-red-400 hover:bg-red-500/10',
};

export function IconButton({ variant = 'default', className = '', ...props }: Props) {
  return (
    <button
      className={`p-1.5 rounded-lg transition-colors ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
