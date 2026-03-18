import type { ReactNode } from 'react';

interface ProfileCardProps {
  name: string;
  subtitle: string;
  secondarySubtitle?: string;
  initials?: string;
  children?: ReactNode;
}

export function ProfileCard({
  name,
  subtitle,
  secondarySubtitle,
  initials,
  children,
}: ProfileCardProps) {
  return (
    <div className="dashboard-card text-center space-y-6">
      <div className="flex justify-center">
        <div className="profile-avatar">{initials}</div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-1 text-[var(--text-secondary)]">
          {name}
        </h3>
        <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>
        {secondarySubtitle && (
          <p className="text-xs mt-1 text-[var(--text-faint)]">
            {secondarySubtitle}
          </p>
        )}
      </div>

      {children}
    </div>
  );
}
