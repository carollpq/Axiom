"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";
import { ConnectButton } from "thirdweb/react";
import { client } from "@/src/shared/lib/thirdweb";
import {
  getLoginPayload,
  doLogin,
  doLogout,
  isLoggedIn,
} from "@/src/shared/lib/auth/actions";
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
    >
      {label}
    </Link>
  );
}

function NotificationBell({ count }: { count: number }) {
  return (
    <div className="relative cursor-pointer">
      <span className="text-[18px] text-[#8a8070]">{"\uD83D\uDD14"}</span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1.5 bg-[#c4956a] text-[#1a1816] text-[9px] font-sans font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {count}
        </span>
      )}
    </div>
  );
}

function UserBadge({ user }: { user: UserProfile }) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-[rgba(120,110,95,0.1)] border border-[rgba(120,110,95,0.2)] rounded">
      <div className="w-7 h-7 rounded-full bg-[linear-gradient(135deg,#3a3530,#5a5345)] flex items-center justify-center text-xs text-[#c9b89e]">
        {user.initials}
      </div>
      <div>
        <div className="text-xs text-[#c9b89e]">{user.name}</div>
        <div className="text-[10px] text-[#6a6050]">
          {user.wallet} - {user.role}
        </div>
      </div>
      <span className="text-[10px] text-[#6a6050] ml-1">{"\u25BC"}</span>
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
            <NotificationBell count={user.notificationCount} />
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
