'use client';

export function getUrgencyColor(daysLeft: number): string {
  if (daysLeft < 0) return '#d4645a';
  if (daysLeft <= 3) return '#c9a44a';
  return '#8fbc8f';
}

export function formatDaysLeft(daysLeft: number): string {
  return daysLeft < 0
    ? `${Math.abs(daysLeft)} days overdue`
    : `${daysLeft} days`;
}

export function SidebarField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="sidebar-field-label">{label}</div>
      {children}
    </div>
  );
}

export function TimelineRow({
  label,
  value,
  style,
}: {
  label: string;
  value: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className="flex justify-between text-[12px]">
      <span className="sidebar-timeline-label">{label}</span>
      <span className={style ? undefined : 'sidebar-field-value'} style={style}>
        {value}
      </span>
    </div>
  );
}
