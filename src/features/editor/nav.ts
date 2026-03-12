import type { NavItemData } from '@/src/shared/types/shared';
import { ROUTES } from '@/src/shared/lib/routes';

export const journalNavItems: NavItemData[] = [
  { label: 'Dashboard', href: ROUTES.editor.root, icon: 'LayoutDashboard' },
  { label: 'Incoming Papers', href: ROUTES.editor.incoming, icon: 'Inbox' },
  {
    label: 'Papers Under Review',
    href: ROUTES.editor.underReview,
    icon: 'BookOpen',
  },
  {
    label: 'Accepted Papers',
    href: ROUTES.editor.accepted,
    icon: 'CheckCircle',
  },
  {
    label: 'Journal Management',
    href: ROUTES.editor.management,
    icon: 'Settings',
  },
];
