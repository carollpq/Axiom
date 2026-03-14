interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardCard({
  children,
  className = '',
}: DashboardCardProps) {
  return <div className={`dashboard-card ${className}`}>{children}</div>;
}
