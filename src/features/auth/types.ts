export const ROLES = ['researcher', 'editor', 'reviewer'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_META: Record<Role, { label: string; description: string }> = {
  researcher: {
    label: 'Researcher',
    description: 'Submit papers and manage authorship',
  },
  editor: {
    label: 'Journal Editor',
    description: 'Manage review process and criteria',
  },
  reviewer: {
    label: 'Peer Reviewer',
    description: 'Evaluate papers and build reputation',
  },
};
