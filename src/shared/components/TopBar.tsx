"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";
import { ConnectButton } from "thirdweb/react";
import { ChevronDown } from "lucide-react";
import { client } from "@/src/shared/lib/thirdweb";
import {
  getLoginPayload,
  doLogin,
  doLogout,
  isLoggedIn,
} from "@/src/shared/lib/auth/actions";
import { NotificationBell } from "@/src/features/notifications/components/NotificationBell.client";
import { useClickOutside } from "@/src/shared/hooks/useClickOutside";
import { ROLES } from "@/src/features/auth/types";
import { ROLE_DASHBOARD_ROUTES } from "@/src/shared/lib/routes";
import { capitalize } from "@/src/shared/lib/format";
import type { NavItemData, UserProfile } from "@/src/shared/types/shared";

function NavItem({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className="text-[13px] font-serif cursor-pointer px-4 py-2 tracking-[1px] transition-all duration-300"
      style={{
        color: active ? "#c9b89e" : "#7a7a7a",
        borderBottom: active ? "1px solid #c9b89e" : "1px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = "#c9b89e";
          e.currentTarget.style.borderBottom = "1px solid rgba(201, 184, 158, 0.4)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = "#7a7a7a";
          e.currentTarget.style.borderBottom = "1px solid transparent";
        }
      }}
    >
      {label}
    </Link>
  );
}

function UserBadge({ user }: { user: UserProfile }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, isOpen, useCallback(() => setIsOpen(false), []));

  function handleSwitch(role: string) {
    setIsOpen(false);
    const route = ROLE_DASHBOARD_ROUTES[role];
    if (route) router.push(route);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3.5 py-1.5 rounded border cursor-pointer"
        style={{
          background: "rgba(120,110,95,0.1)",
          borderColor: "rgba(120,110,95,0.2)",
        }}
      >
        <div className="text-left">
          <div className="text-xs text-[#c9b89e]">
            {user.displayName ?? capitalize(user.role)}
          </div>
          <div className="text-[10px] text-[#6a6050]">{user.wallet}</div>
        </div>
        <ChevronDown
          size={12}
          className="ml-1 transition-transform duration-200"
          style={{
            color: "#6a6050",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1.5 w-full min-w-[180px] rounded-lg z-50 py-1"
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
                className="w-full text-left px-3 py-2 text-[12px] font-serif transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
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
        </div>
      )}
    </div>
  );
}

export function TopBar({ navItems, user }: { navItems: NavItemData[]; user: UserProfile }) {
  const pathname = usePathname();
  const account = useActiveAccount();

  return (
    <nav className="flex items-center justify-between px-10 h-14 border-b border-[rgba(120,110,95,0.2)] bg-[rgba(25,23,20,0.9)] backdrop-blur-[10px] sticky top-0 z-[100]">
      <div className="flex items-center gap-8">
        <span className="font-serif text-[22px] italic text-[#c9b89e] tracking-[2px]">
          Axiom
        </span>
        <div className="flex">
          {navItems.map((item) => (
            <NavItem
              key={item.label}
              label={item.label}
              href={item.href}
              active={pathname === item.href}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-5">
        {account && (
          <>
            <NotificationBell />
            <UserBadge user={user} />
          </>
        )}
        <ConnectButton
          client={client}
          auth={{ isLoggedIn, getLoginPayload, doLogin, doLogout }}
          theme="dark"
          connectButton={{
            label: "Connect Wallet",
            style: {
              backgroundColor: "rgba(201, 164, 74, 0.15)",
              color: "#c9a44a",
              border: "1px solid rgba(201, 164, 74, 0.3)",
              borderRadius: "6px",
              fontSize: "13px",
              fontFamily: "Georgia, serif",
              padding: "6px 16px",
              height: "34px",
            },
          }}
        />
      </div>
    </nav>
  );
}
