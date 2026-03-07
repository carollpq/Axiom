import { DashboardHeader } from './DashboardHeader';
import type { Role } from '@/src/features/auth/types';

interface DashboardGridLayoutProps {
  role: Role;
  left: React.ReactNode;
  right: React.ReactNode;
}

export function DashboardGridLayout({
  role,
  left,
  right,
}: DashboardGridLayoutProps) {
  return (
    <>
      <DashboardHeader role={role} />
      <div className="mt-8 grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-8">{left}</div>
        <div>{right}</div>
      </div>
    </>
  );
}
