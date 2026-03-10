import { ROLE_META } from '@/src/features/auth/types';
import type { Role } from '@/src/features/auth/types';

const DASHBOARD_SUBTITLES: Record<Role, string> = {
  researcher: 'Manage your research, contracts, and submissions',
  editor: 'Manage submissions, review criteria, and publication decisions',
  reviewer: 'Track reviews, build reputation, view feedback',
};

export function DashboardHeader({ role }: { role: Role }) {
  const title = `${ROLE_META[role].label} Dashboard`;
  const subtitle = DASHBOARD_SUBTITLES[role];
  return (
    <div className="mb-8">
      <h1 className="text-[28px] font-normal text-[#e8e0d4] m-0 tracking-[0.5px]">
        {title}
      </h1>
      <p className="text-[13px] text-[#6a6050] mt-1.5 italic">{subtitle}</p>
    </div>
  );
}
