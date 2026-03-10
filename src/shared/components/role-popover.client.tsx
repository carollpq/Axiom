'use client';

import { useRouter } from 'next/navigation';
import { useActiveWallet, useDisconnect } from 'thirdweb/react';
import { LogOut } from 'lucide-react';
import { doLogout } from '@/src/shared/lib/auth/actions';
import { ROLES } from '@/src/features/auth/types';
import { ROLE_DASHBOARD_ROUTES } from '@/src/shared/lib/routes';
import { capitalize } from '@/src/shared/lib/format';
import type { UserProfile } from '@/src/shared/types/shared';

interface RolePopoverProps {
  user: UserProfile;
  onClose: () => void;
}

export function RolePopover({ user, onClose }: RolePopoverProps) {
  const router = useRouter();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();

  function handleSwitch(role: string) {
    onClose();
    const route = ROLE_DASHBOARD_ROUTES[role];
    if (route) router.push(route);
  }

  return (
    <div
      className="absolute bottom-full left-3 right-3 mb-1.5 rounded-lg z-50 py-1"
      style={{
        background: 'rgba(35,32,28,0.98)',
        border: '1px solid rgba(120,110,95,0.25)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}
    >
      <div
        className="px-3 py-2 text-[10px] uppercase tracking-wider"
        style={{
          color: '#6a6050',
          borderBottom: '1px solid rgba(120,110,95,0.15)',
        }}
      >
        Roles
      </div>
      {ROLES.map((role) => {
        const isActive = role === user.role;
        const hasRole = user.roles.includes(role);
        return (
          <button
            key={role}
            onClick={() => hasRole && handleSwitch(role)}
            disabled={!hasRole}
            className="w-full text-left px-3 py-2 text-[12px] font-serif transition-colors duration-150 disabled:opacity-40"
            style={{
              background: isActive ? 'rgba(201,164,74,0.08)' : 'transparent',
              color: isActive ? '#c9a44a' : hasRole ? '#b0a898' : '#4a4238',
              border: 'none',
              cursor: isActive
                ? 'default'
                : hasRole
                  ? 'pointer'
                  : 'not-allowed',
            }}
            onMouseEnter={(e) => {
              if (!isActive && hasRole)
                e.currentTarget.style.background = 'rgba(120,110,95,0.15)';
            }}
            onMouseLeave={(e) => {
              if (!isActive && hasRole)
                e.currentTarget.style.background = 'transparent';
            }}
          >
            {capitalize(role)}
            {isActive && (
              <span className="ml-2 text-[10px]" style={{ color: '#6a6050' }}>
                (current)
              </span>
            )}
          </button>
        );
      })}
      <div
        className="px-3 pt-1.5 pb-2"
        style={{ borderTop: '1px solid rgba(120,110,95,0.15)' }}
      >
        <button
          onClick={async () => {
            if (wallet) disconnect(wallet);
            await doLogout();
            window.location.href = '/login';
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-md cursor-pointer"
          style={{
            backgroundColor: 'transparent',
            color: '#d4645a',
            border: '1px solid rgba(212,100,90,0.3)',
            fontSize: '11px',
            fontFamily: 'Georgia, serif',
            padding: '4px 12px',
            height: '28px',
          }}
        >
          <LogOut size={12} />
          Log Out
        </button>
      </div>
    </div>
  );
}
