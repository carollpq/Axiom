import { NotificationBell } from "@/src/features/notifications/components/NotificationBell.client";

const ROLE_CONFIG = {
  researcher: {
    title: "Researcher Dashboard",
    subtitle: "Manage your research, contracts, and submissions",
  },
  journal: {
    title: "Journal Dashboard",
    subtitle: "Manage submissions, review criteria, and publication decisions",
  },
  reviewer: {
    title: "Reviewer Dashboard",
    subtitle: "Track reviews, build reputation, view feedback",
  },
} as const;

type Role = keyof typeof ROLE_CONFIG;

export function DashboardHeader({ role }: { role: Role }) {
  const { title, subtitle } = ROLE_CONFIG[role];
  return (
    <div className="mb-8 flex items-start justify-between">
      <div>
        <h1 className="text-[28px] font-normal text-[#e8e0d4] m-0 tracking-[0.5px]">
          {title}
        </h1>
        <p className="text-[13px] text-[#6a6050] mt-1.5 italic">{subtitle}</p>
      </div>
      <NotificationBell />
    </div>
  );
}
