'use client';

import { useState } from 'react';
import type { Role } from '@/src/features/auth/types';

interface RoleSelectorProps {
  onSelect: (role: Role) => void;
}

const ROLES: { id: Role; label: string; description: string }[] = [
  {
    id: 'researcher',
    label: 'Researcher',
    description: 'Submit papers and manage authorship',
  },
  {
    id: 'editor',
    label: 'Journal Editor',
    description: 'Manage review process and criteria',
  },
  {
    id: 'reviewer',
    label: 'Peer Reviewer',
    description: 'Evaluate papers and build reputation',
  },
];

export function RoleSelector({ onSelect }: RoleSelectorProps) {
  const [selected, setSelected] = useState<Role | null>(null);
  const [hovered, setHovered] = useState<Role | null>(null);

  const handleClick = (roleId: Role) => {
    setSelected(roleId);
    onSelect(roleId);
  };

  const borderColor = (id: Role) =>
    selected === id
      ? '#c9a44a'
      : hovered === id
        ? 'rgba(201, 164, 74, 0.5)'
        : '#5a4a3a';

  const bgColor = (id: Role) =>
    selected === id
      ? 'rgba(201, 164, 74, 0.1)'
      : hovered === id
        ? 'rgba(201, 164, 74, 0.05)'
        : 'transparent';

  return (
    <div className="space-y-3">
      <p className="text-sm mb-4" style={{ color: '#b0a898' }}>
        Join as:
      </p>

      {ROLES.map((role) => (
        <button
          key={role.id}
          onClick={() => handleClick(role.id)}
          onMouseEnter={() => setHovered(role.id)}
          onMouseLeave={() => setHovered(null)}
          className="w-full p-4 rounded border-2 transition-all text-left cursor-pointer"
          style={{
            borderColor: borderColor(role.id),
            backgroundColor: bgColor(role.id),
          }}
        >
          <p className="font-semibold" style={{ color: '#d4ccc0' }}>
            {role.label}
          </p>
          <p className="text-xs mt-1" style={{ color: '#8a8070' }}>
            {role.description}
          </p>
        </button>
      ))}
    </div>
  );
}
