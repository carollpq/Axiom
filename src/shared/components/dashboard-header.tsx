import type { Role } from '@/src/features/auth/types';

const ROLE_CONFIG: Record<Role, { title: string; subtitle: string }> = {
  researcher: {
    title: 'Researcher Dashboard',
    subtitle: 'Manage your research, contracts, and submissions',
  },
  editor: {
    title: 'Editor Dashboard',
    subtitle: 'Manage submissions, review criteria, and publication decisions',
  },
  reviewer: {
    title: 'Reviewer Dashboard',
    subtitle: 'Track reviews, build reputation, view feedback',
  },
};

export function DashboardHeader({ role }: { role: Role }) {
  const { title, subtitle } = ROLE_CONFIG[role];
  return (
    <div className="mb-8">
      <h1 className="text-[28px] font-normal text-[#e8e0d4] m-0 tracking-[0.5px]">
        {title}
      </h1>
      <p className="text-[13px] text-[#6a6050] mt-1.5 italic">{subtitle}</p>
    </div>
  );
}
