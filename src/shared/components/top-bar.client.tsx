'use client';

import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { ConnectButton } from 'thirdweb/react';
import { NotificationBell } from '@/src/features/notifications/components/notification-bell.client';
import { WalletModal } from './wallet-modal.client';
import { client } from '@/src/shared/lib/thirdweb';
import { CONNECT_AUTH } from '@/src/shared/lib/auth/connect-auth';
import { useSidebar } from '@/src/shared/context/sidebar-context.client';
import { useUser } from '@/src/shared/context/user-context.client';
import { buildUserProfile } from '@/src/features/users/lib';
import { capitalize } from '@/src/shared/lib/format';
import { type Role, ROLES } from '@/src/features/auth/types';

/** Derive current role from the URL pathname. */
function roleFromPath(pathname: string): Role {
  for (const role of ROLES) {
    if (pathname.startsWith(`/${role}`)) return role;
  }
  return 'researcher';
}

export function TopBar() {
  const { collapsed, toggle } = useSidebar();
  const { user, account } = useUser();
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);
  const handleCloseModal = useCallback(() => setModalOpen(false), []);

  const currentRole = roleFromPath(pathname);

  const userProfile =
    user && account
      ? buildUserProfile(account.address, user, currentRole)
      : null;

  return (
    <>
      <nav className="flex items-center justify-between px-4 h-12 border-b border-[rgba(120,110,95,0.2)] bg-[rgba(25,23,20,0.9)] backdrop-blur-[10px] sticky top-0 z-[100]">
        <button
          onClick={toggle}
          className="cursor-pointer transition-colors duration-150"
          style={{ color: '#7a7a7a' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#c9b89e')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#7a7a7a')}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
        </button>
        <div className="flex items-center gap-5">
          <NotificationBell />
          {userProfile ? (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 cursor-pointer transition-colors duration-150"
              style={{
                background: 'rgba(120,110,95,0.08)',
                border: '1px solid rgba(120,110,95,0.15)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(120,110,95,0.18)';
                e.currentTarget.style.borderColor = 'rgba(120,110,95,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(120,110,95,0.08)';
                e.currentTarget.style.borderColor = 'rgba(120,110,95,0.15)';
              }}
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-serif"
                style={{
                  background: 'rgba(201,164,74,0.15)',
                  color: '#c9a44a',
                  border: '1px solid rgba(201,164,74,0.2)',
                }}
              >
                {userProfile.initials}
              </div>
              <div className="text-left hidden sm:block">
                <div
                  className="text-[12px] font-serif leading-tight"
                  style={{ color: '#c9b89e' }}
                >
                  {userProfile.displayName ?? userProfile.wallet}
                </div>
                <div
                  className="text-[10px] leading-tight"
                  style={{ color: '#6a6050' }}
                >
                  {capitalize(userProfile.role)}
                </div>
              </div>
            </button>
          ) : (
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
          )}
        </div>
      </nav>

      {modalOpen && userProfile && account && (
        <WalletModal
          user={userProfile}
          fullWallet={account.address}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
