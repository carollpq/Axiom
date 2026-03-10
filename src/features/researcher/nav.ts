import type { NavItemData } from '@/src/shared/types/shared';
import { ROUTES } from '@/src/shared/lib/routes';

export const navItems: NavItemData[] = [
  { label: 'Dashboard', href: ROUTES.researcher.root, icon: 'LayoutDashboard' },
  {
    label: 'Authorship Contracts',
    href: ROUTES.researcher.contracts,
    icon: 'FileSignature',
  },
  {
    label: 'Paper Version Control',
    href: ROUTES.researcher.paperVersions,
    icon: 'GitBranch',
  },
  {
    label: 'Create a Submission',
    href: ROUTES.researcher.createSubmission,
    icon: 'FilePlus',
  },
  {
    label: 'View Submissions',
    href: ROUTES.researcher.viewSubmissions,
    icon: 'Eye',
  },
];
