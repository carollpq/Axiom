"use client";

import { useState, useRef, useCallback } from "react";
import { useActiveAccount, ConnectButton } from "thirdweb/react";
import { ChevronUp } from "lucide-react";
import { client } from "@/src/shared/lib/thirdweb";
import { CONNECT_AUTH } from "@/src/shared/lib/auth/connect-auth";
import { capitalize } from "@/src/shared/lib/format";
import { useClickOutside } from "@/src/shared/hooks/useClickOutside";
import { RolePopover } from "./RolePopover";
import type { UserProfile } from "@/src/shared/types/shared";

interface WalletSectionProps {
  user: UserProfile;
  collapsed: boolean;
}

export function WalletSection({ user, collapsed }: WalletSectionProps) {
  const account = useActiveAccount();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, isOpen, useCallback(() => setIsOpen(false), []));

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

      {isOpen && <RolePopover user={user} onClose={() => setIsOpen(false)} />}
    </div>
  );
}
