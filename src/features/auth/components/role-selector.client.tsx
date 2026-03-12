'use client';

import { useState } from 'react';
import { ROLES, ROLE_META } from '@/src/features/auth/types';
import type { Role } from '@/src/features/auth/types';
import { AUTH_COLORS } from './auth-styles';

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
      ? AUTH_COLORS.accent.gold
      : hovered === id
        ? AUTH_COLORS.border.hoverGold
        : AUTH_COLORS.border.base;

  const bgColor = (id: Role) =>
    selected === id
      ? AUTH_COLORS.accent.goldSubtle
      : hovered === id
        ? AUTH_COLORS.accent.goldFaint
        : 'transparent';

  return (
    <div className="space-y-3">
      <p className="text-sm mb-4" style={{ color: AUTH_COLORS.text.secondary }}>
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
          <p
            className="font-semibold"
            style={{ color: AUTH_COLORS.text.primary }}
          >
            {ROLE_META[id].label}
          </p>
          <p className="text-xs mt-1" style={{ color: AUTH_COLORS.text.muted }}>
            {ROLE_META[id].description}
          </p>
        </button>
      ))}
    </div>
  );
}
