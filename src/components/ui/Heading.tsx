import { type ReactNode } from 'react';

type SpacingScale =
  | '0' | '0.5' | '1' | '1.5' | '2' | '2.5' | '3' | '3.5' | '4' | '5'
  | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '14' | '16' | '20' | '24'
  | '28' | '32' | '36' | '40' | '44' | '48' | '52' | '56' | '60' | '64'
  | '72' | '80' | '96' | 'auto' | 'px';

type MarginClass        = `m${'' | 't' | 'b' | 'l' | 'r' | 'x' | 'y'}-${SpacingScale}`;
type PaddingClass       = `p${'' | 't' | 'b' | 'l' | 'r' | 'x' | 'y'}-${SpacingScale}`;
type PositionTypeClass   = 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
type PositionOffsetClass = `${'bottom' | 'inset' | 'left' | 'right' | 'top'}-${SpacingScale}`;

export type HeadingClassName = MarginClass | PaddingClass | PositionOffsetClass | PositionTypeClass;

interface Props {
  children: ReactNode;
  className?: HeadingClassName | HeadingClassName[];
}

function cx(base: string, extra?: HeadingClassName | HeadingClassName[]) {
  if (!extra) return base;
  return `${base} ${Array.isArray(extra) ? extra.join(' ') : extra}`;
}

export function H1({ children, className }: Props) {
  return <h1 className={cx('text-lg font-bold text-strong', className)}>{children}</h1>;
}

export function H2({ children, className }: Props) {
  return <h2 className={cx('text-base font-bold text-strong', className)}>{children}</h2>;
}

export function H3({ children, className }: Props) {
  return <h3 className={cx('text-sm font-semibold text-strong', className)}>{children}</h3>;
}
