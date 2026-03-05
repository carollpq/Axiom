"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useActiveAccount, ConnectButton } from "thirdweb/react";
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
  ChevronUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { client } from "@/src/shared/lib/thirdweb";
import {
  getLoginPayload,
  doLogin,
  doLogout,
  isLoggedIn,
} from "@/src/shared/lib/auth/actions";
import { ROLES } from "@/src/features/auth/types";
import { ROLE_DASHBOARD_ROUTES } from "@/src/shared/lib/routes";
import { capitalize } from "@/src/shared/lib/format";
import { useClickOutside } from "@/src/shared/hooks/useClickOutside";
import { useSidebar, SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED } from "@/src/shared/context/SidebarContext";
import type { NavItemData, UserProfile } from "@/src/shared/types/shared";

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
        color: active ? "#c9b89e" : "#7a7a7a",
        background: active ? "rgba(201,164,74,0.06)" : "transparent",
        borderLeft: active ? "2px solid #c9a44a" : "2px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "rgba(120,110,95,0.1)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      {Icon && (
        <Icon
          size={20}
          style={{ color: active ? "#c9a44a" : "#7a7a7a", flexShrink: 0 }}
        />
      )}
      {!collapsed && <span className="truncate">{item.label}</span>}

      {/* Tooltip — always in DOM, visible only when collapsed + hovered */}
      <span
        className={`pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded px-2 py-1 text-xs transition-opacity duration-150 ${collapsed ? "opacity-0 group-hover:opacity-100" : "invisible opacity-0"}`}
        style={{
          background: "rgba(35,32,28,0.98)",
          color: "#c9b89e",
          border: "1px solid rgba(120,110,95,0.25)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        {item.label}
      </span>
    </Link>
  );
}

const CONNECT_AUTH = { isLoggedIn, getLoginPayload, doLogin, doLogout } as const;

function WalletSection({ user, collapsed }: { user: UserProfile; collapsed: boolean }) {
  const router = useRouter();
  const account = useActiveAccount();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, isOpen, useCallback(() => setIsOpen(false), []));

  function handleSwitch(role: string) {
    setIsOpen(false);
    const route = ROLE_DASHBOARD_ROUTES[role];
    if (route) router.push(route);
  }

  if (!account) {
    return (
      <div className="px-3 py-3">
        <ConnectButton
          client={client}
          auth={CONNECT_AUTH}
          theme="dark"
          connectButton={{
            label: collapsed ? "..." : "Connect Wallet",
            style: {
              backgroundColor: "rgba(201, 164, 74, 0.15)",
              color: "#c9a44a",
              border: "1px solid rgba(201, 164, 74, 0.3)",
              borderRadius: "6px",
              fontSize: "12px",
              fontFamily: "Georgia, serif",
              padding: "6px 12px",
              height: "34px",
              width: "100%",
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative px-3 py-3" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 rounded border px-2.5 py-2 cursor-pointer"
        style={{
          background: "rgba(120,110,95,0.1)",
          borderColor: "rgba(120,110,95,0.2)",
        }}
      >
        {!collapsed && (
          <div className="min-w-0 flex-1 text-left">
            <div className="truncate text-xs text-[#c9b89e]">
              {user.displayName ?? capitalize(user.role)}
            </div>
            <div className="truncate text-[10px] text-[#6a6050]">{user.wallet}</div>
          </div>
        )}
        <ChevronUp
          size={12}
          className="shrink-0 transition-transform duration-200"
          style={{
            color: "#6a6050",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute bottom-full left-3 right-3 mb-1.5 rounded-lg z-50 py-1"
          style={{
            background: "rgba(35,32,28,0.98)",
            border: "1px solid rgba(120,110,95,0.25)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          <div
            className="px-3 py-2 text-[10px] uppercase tracking-wider"
            style={{ color: "#6a6050", borderBottom: "1px solid rgba(120,110,95,0.15)" }}
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
                  background: isActive ? "rgba(201,164,74,0.08)" : "transparent",
                  color: isActive ? "#c9a44a" : hasRole ? "#b0a898" : "#4a4238",
                  border: "none",
                  cursor: isActive ? "default" : hasRole ? "pointer" : "not-allowed",
                }}
                onMouseEnter={(e) => {
                  if (!isActive && hasRole) e.currentTarget.style.background = "rgba(120,110,95,0.15)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive && hasRole) e.currentTarget.style.background = "transparent";
                }}
              >
                {capitalize(role)}
                {isActive && (
                  <span className="ml-2 text-[10px]" style={{ color: "#6a6050" }}>
                    (current)
                  </span>
                )}
              </button>
            );
          })}
          <div
            className="px-3 pt-1.5 pb-2"
            style={{ borderTop: "1px solid rgba(120,110,95,0.15)" }}
          >
            <ConnectButton
              client={client}
              auth={CONNECT_AUTH}
              theme="dark"
              connectButton={{
                label: "Disconnect",
                style: {
                  backgroundColor: "transparent",
                  color: "#d4645a",
                  border: "1px solid rgba(212,100,90,0.3)",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontFamily: "Georgia, serif",
                  padding: "4px 12px",
                  height: "28px",
                  width: "100%",
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ navItems, user }: { navItems: NavItemData[]; user: UserProfile }) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  return (
    <aside
      className="fixed left-0 top-0 z-[90] flex h-screen flex-col border-r"
      style={{
        width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
        background: "rgba(25,23,20,0.95)",
        borderColor: "rgba(120,110,95,0.2)",
        transition: "width 200ms ease-in-out",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center border-b px-4 h-12 shrink-0 overflow-hidden"
        style={{ borderColor: "rgba(120,110,95,0.2)" }}
      >
        <span className="font-serif text-[22px] italic text-[#c9b89e] tracking-[2px] whitespace-nowrap">
          {collapsed ? "A" : "Axiom"}
        </span>
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            active={pathname === item.href}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Wallet address at bottom */}
      <div
        className="shrink-0 border-t"
        style={{ borderColor: "rgba(120,110,95,0.2)" }}
      >
        <WalletSection user={user} collapsed={collapsed} />
      </div>
    </aside>
  );
}
