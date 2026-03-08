'use client';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { NotificationBell } from '@/src/features/notifications/components/NotificationBell.client';
import { WalletSection } from './WalletSection';
import { useSidebar } from '@/src/shared/context/SidebarContext';
import { useUser } from '@/src/shared/context/UserContext';
import { buildUserProfile } from '@/src/shared/lib/format';
import { type Role } from '@/src/features/auth/types';

export function TopBar() {
  const { collapsed, toggle } = useSidebar();
  const { user, account } = useUser();

  const userProfile =
    user && account
      ? buildUserProfile(
          account.address,
          user,
          (user.roles[0] || 'researcher') as Role,
        )
      : null;

  return (
    <nav className="flex items-center justify-between px-4 h-12 border-b border-[rgba(120,110,95,0.2)] bg-[rgba(25,23,20,0.9)] backdrop-blur-[10px] sticky top-0 z-[100]">
      <button
        onClick={toggle}
        className="cursor-pointer transition-colors duration-150"
        style={{ color: '#7a7a7a' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#c9b89e')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#7a7a7a')}
      >
        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </button>
      <div className="flex items-center gap-5">
        <NotificationBell />
        {userProfile && (
          <WalletSection user={userProfile} collapsed={false} isTopBar={true} />
        )}
      </div>
    </nav>
  );
}
