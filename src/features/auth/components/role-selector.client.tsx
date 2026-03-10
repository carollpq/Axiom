'use client';

import { useState } from 'react';
import { ROLES, ROLE_META } from '@/src/features/auth/types';
import type { Role } from '@/src/features/auth/types';

interface RoleSelectorProps {
  onSelect: (role: Role) => void;
  roles?: readonly Role[];
  label?: string;
}

export function RoleSelector({
  onSelect,
  roles = ROLES,
  label = 'Join as:',
}: RoleSelectorProps) {
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
        {label}
      </p>

      {roles.map((id) => (
        <button
          key={id}
          onClick={() => handleClick(id)}
          onMouseEnter={() => setHovered(id)}
          onMouseLeave={() => setHovered(null)}
          className="w-full p-4 rounded border-2 transition-all text-left cursor-pointer"
          style={{
            borderColor: borderColor(id),
            backgroundColor: bgColor(id),
          }}
        >
          <p className="font-semibold" style={{ color: '#d4ccc0' }}>
            {ROLE_META[id].label}
          </p>
          <p className="text-xs mt-1" style={{ color: '#8a8070' }}>
            {ROLE_META[id].description}
          </p>
        </button>
      ))}
    </div>
  );
}
