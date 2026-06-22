interface Props {
  className?: string;
}

export function Spinner({ className = '' }: Props) {
  return (
    <div className={`w-5 h-5 border-2 border-firm border-t-green-500 rounded-full animate-spin ${className}`} />
  );
}
