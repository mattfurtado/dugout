interface Props {
  label?: string;
}

export function Divider({ label }: Props) {
  return (
    <div className="relative flex items-center gap-2">
      <div className="flex-1 border-t border-subtle" />
      {label && <span className="text-xs text-ghost px-1">{label}</span>}
      <div className="flex-1 border-t border-subtle" />
    </div>
  );
}
