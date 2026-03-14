import type { NavItemData } from '@/src/shared/types/shared';
import { ROUTES } from '@/src/shared/lib/routes';

export const reviewerNavItems: NavItemData[] = [
  { label: 'Dashboard', href: ROUTES.reviewer.root, icon: 'LayoutDashboard' },
  {
    label: 'Pool Invitations',
    href: ROUTES.reviewer.poolInvites,
    icon: 'Inbox',
  },
  { label: 'Incoming Invites', href: ROUTES.reviewer.invites, icon: 'Mail' },
  {
    label: 'Papers Under Review',
    href: ROUTES.reviewer.assigned,
    icon: 'FileText',
  },
  {
    label: 'Completed Papers',
    href: ROUTES.reviewer.completed,
    icon: 'CheckCircle',
  },
];
