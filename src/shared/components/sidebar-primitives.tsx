import {
  URGENCY_LATE,
  URGENCY_WARNING,
  URGENCY_OK,
} from '@/src/shared/lib/status-colors';

export function getUrgencyColor(daysLeft: number): string {
  if (daysLeft < 0) return URGENCY_LATE;
  if (daysLeft <= 3) return URGENCY_WARNING;
  return URGENCY_OK;
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
