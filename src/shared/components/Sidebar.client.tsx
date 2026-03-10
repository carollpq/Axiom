'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileSignature,
  GitBranch,
  FilePlus,
  Eye,
  Inbox,
  BookOpen,
  CheckCircle,
  Settings,
  ClipboardList,
  Award,
  Mail,
  FileText,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  useSidebar,
  SIDEBAR_WIDTH_EXPANDED,
  SIDEBAR_WIDTH_COLLAPSED,
} from '@/src/shared/context/SidebarContext';
import type { NavItemData, UserProfile } from '@/src/shared/types/shared';

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  FileSignature,
  GitBranch,
  FilePlus,
  Eye,
  Inbox,
  BookOpen,
  CheckCircle,
  Settings,
  ClipboardList,
  Award,
  Mail,
  FileText,
};

function NavItem({
  item,
  active,
  collapsed,
}: {
  item: NavItemData;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon ? ICON_MAP[item.icon] : undefined;

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className="group relative flex items-center gap-3 px-4 py-2.5 text-[13px] font-serif tracking-wide transition-colors duration-150"
      style={{
        color: active ? '#c9b89e' : '#7a7a7a',
        background: active ? 'rgba(201,164,74,0.06)' : 'transparent',
        borderLeft: active ? '2px solid #c9a44a' : '2px solid transparent',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = 'rgba(120,110,95,0.1)';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }}
    >
      {Icon && (
        <Icon
          size={20}
          style={{ color: active ? '#c9a44a' : '#7a7a7a', flexShrink: 0 }}
        />
      )}
      {!collapsed && <span className="truncate">{item.label}</span>}

      {/* Tooltip — always in DOM, visible only when collapsed + hovered */}
      <span
        className={`pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded px-2 py-1 text-xs transition-opacity duration-150 ${collapsed ? 'opacity-0 group-hover:opacity-100' : 'invisible opacity-0'}`}
        style={{
          background: 'rgba(35,32,28,0.98)',
          color: '#c9b89e',
          border: '1px solid rgba(120,110,95,0.25)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        {item.label}
      </span>
    </Link>
  );
}

export function Sidebar({
  navItems,
  user,
}: {
  navItems: NavItemData[];
  user: UserProfile;
}) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  return (
    <aside
      className="fixed left-0 top-0 z-[90] flex h-screen flex-col overflow-x-hidden border-r"
      style={{
        width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
        background: 'rgba(25,23,20,0.95)',
        borderColor: 'rgba(120,110,95,0.2)',
        transition: 'width 200ms ease-in-out',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center border-b px-4 h-12 shrink-0 overflow-hidden"
        style={{ borderColor: 'rgba(120,110,95,0.2)' }}
      >
        <span className="font-serif text-[22px] italic text-[#c9b89e] tracking-[2px] whitespace-nowrap">
          {collapsed ? 'A' : 'Axiom'}
        </span>
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            active={pathname === item.href}
            collapsed={collapsed}
          />
        ))}
      </nav>
    </aside>
  );
}
