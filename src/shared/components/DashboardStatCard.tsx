interface DashboardStatCardProps {
  value: number | string;
  label: string;
  alert?: boolean;
}

export function DashboardStatCard({
  value,
  label,
  alert,
}: DashboardStatCardProps) {
  return (
    <div className="dashboard-stat-card">
      <div
        className={`dashboard-stat-value ${alert ? 'dashboard-stat-value--alert' : ''}`}
      >
        {value}
      </div>
      <div className="dashboard-stat-label">{label}</div>
    </div>
  );
}
