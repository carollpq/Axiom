interface Props {
  className?: string;
}

const style = {
  background: 'rgba(143,188,143,0.1)',
  border: '1px solid rgba(143,188,143,0.2)',
  color: '#8fbc8f',
} as const;

export function RatedBadge({ className = '' }: Props) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md px-4 py-3 text-[12px] ${className}`}
      style={style}
    >
      <span>&#10003;</span>
      <span>Reviewer rated</span>
    </div>
  );
}
