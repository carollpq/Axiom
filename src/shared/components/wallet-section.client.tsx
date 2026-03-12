'use client';

import { useState, useRef, useCallback } from 'react';
import { useActiveAccount, ConnectButton } from 'thirdweb/react';
import { ChevronUp, Wallet } from 'lucide-react';
import { client } from '@/src/shared/lib/thirdweb';
import { CONNECT_AUTH } from '@/src/shared/lib/auth/connect-auth';
import { capitalize } from '@/src/shared/lib/format';
import { useClickOutside } from '@/src/shared/hooks/useClickOutside';
import { RolePopover } from './role-popover.client';
import type { UserProfile } from '@/src/shared/types/shared';

interface WalletSectionProps {
  user: UserProfile;
  collapsed: boolean;
  isTopBar?: boolean;
}

export function WalletSection({
  user,
  collapsed,
  isTopBar = false,
}: WalletSectionProps) {
  const account = useActiveAccount();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(
    ref,
    isOpen,
    useCallback(() => setIsOpen(false), []),
  );

  // In top bar, use inline styles for a compact button
  if (isTopBar) {
    if (!account) {
      return (
        <div>
          <ConnectButton
            client={client}
            auth={CONNECT_AUTH}
            theme="dark"
            connectButton={{
              label: 'Connect',
              style: {
                backgroundColor: 'rgba(201, 164, 74, 0.15)',
                color: '#c9a44a',
                border: '1px solid rgba(201, 164, 74, 0.3)',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'Georgia, serif',
                padding: '4px 10px',
                height: '32px',
              },
            }}
          />
        </div>
      );
    }

    return (
      <div className="relative" ref={ref}>
        <div className="flex items-center gap-2">
          <ConnectButton
            client={client}
            auth={CONNECT_AUTH}
            theme="dark"
            connectButton={{
              label: 'Wallet',
              style: {
                backgroundColor: 'transparent',
                color: '#c9b89e',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'Georgia, serif',
                padding: '0px 6px',
                height: '32px',
              },
            }}
            detailsButton={{
              style: {
                backgroundColor: 'transparent',
                color: '#c9b89e',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'Georgia, serif',
                padding: '0px 6px',
                height: '32px',
              },
            }}
          />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-[rgba(120,110,95,0.1)] rounded cursor-pointer transition-colors"
            title="Switch roles"
          >
            <ChevronUp
              size={14}
              className="transition-transform duration-200"
              style={{
                color: '#6a6050',
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>
        </div>
        {isOpen && <RolePopover user={user} onClose={() => setIsOpen(false)} />}
      </div>
    );
  }

  // Sidebar layout
  if (!account) {
    return (
      <div className="px-3 py-3">
        <ConnectButton
          client={client}
          auth={CONNECT_AUTH}
          theme="dark"
          connectButton={{
            label: collapsed ? '...' : 'Connect Wallet',
            style: {
              backgroundColor: 'rgba(201, 164, 74, 0.15)',
              color: '#c9a44a',
              border: '1px solid rgba(201, 164, 74, 0.3)',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: 'Georgia, serif',
              padding: '6px 12px',
              height: '34px',
              width: '100%',
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative px-3 py-3" ref={ref}>
      <div className="w-full">
        <ConnectButton
          client={client}
          auth={CONNECT_AUTH}
          theme="dark"
          connectButton={{
            label: collapsed ? '...' : 'View Wallet',
            style: {
              backgroundColor: 'rgba(120,110,95,0.1)',
              color: '#c9b89e',
              border: '1px solid rgba(120,110,95,0.2)',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: 'Georgia, serif',
              padding: '8px 10px',
              height: '44px',
              width: '100%',
            },
          }}
          detailsButton={{
            style: {
              backgroundColor: 'rgba(120,110,95,0.1)',
              color: '#c9b89e',
              border: '1px solid rgba(120,110,95,0.2)',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: 'Georgia, serif',
              padding: '8px 10px',
              height: '44px',
              width: '100%',
            },
          }}
        />
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 rounded border px-2.5 py-2 cursor-pointer mt-2"
        style={{
          background: 'rgba(120,110,95,0.1)',
          borderColor: 'rgba(120,110,95,0.2)',
        }}
      >
        {!collapsed && (
          <div className="min-w-0 flex-1 text-left">
            <div className="truncate text-xs text-[#c9b89e]">
              {user.displayName ?? capitalize(user.role)}
            </div>
            <div className="truncate text-[10px] text-[#6a6050]">Roles</div>
          </div>
        )}
        <ChevronUp
          size={12}
          className="shrink-0 transition-transform duration-200"
          style={{
            color: '#6a6050',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {isOpen && <RolePopover user={user} onClose={() => setIsOpen(false)} />}
    </div>
  );
}
