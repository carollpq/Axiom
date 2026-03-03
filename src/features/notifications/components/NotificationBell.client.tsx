"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Bell } from "lucide-react";
import { useClickOutside } from "@/src/shared/hooks/useClickOutside";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = (await res.json()) as { items: Notification[] };
      setNotifications(data.items);
    } catch {
      // Silently fail — notifications are non-critical
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchNotifications();
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useClickOutside(panelRef, isOpen, useCallback(() => setIsOpen(false), []));

  async function handleMarkAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  async function handleClick(n: Notification) {
    if (!n.isRead) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      });
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item)),
      );
    }
    if (n.link) {
      window.location.href = n.link;
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md cursor-pointer"
        style={{
          background: "transparent",
          border: "1px solid rgba(120,110,95,0.2)",
          color: "#b0a898",
        }}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full text-[10px] font-bold"
            style={{ background: "#d4645a", color: "#fff" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-[320px] max-h-[400px] overflow-y-auto rounded-lg z-50"
          style={{
            background: "rgba(35,32,28,0.98)",
            border: "1px solid rgba(120,110,95,0.25)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid rgba(120,110,95,0.15)" }}
          >
            <span className="text-[12px] text-[#8a8070] font-serif uppercase tracking-wider">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-[#c9a44a] cursor-pointer font-serif"
                style={{ background: "none", border: "none" }}
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-6 text-center text-[12px] text-[#6a6050] font-serif">
              No notifications
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className="w-full text-left px-4 py-3 cursor-pointer block"
                style={{
                  background: n.isRead ? "transparent" : "rgba(201,164,74,0.04)",
                  borderBottom: "1px solid rgba(120,110,95,0.08)",
                  border: "none",
                  borderBlockEnd: "1px solid rgba(120,110,95,0.08)",
                }}
              >
                <div className="flex items-start gap-2">
                  {!n.isRead && (
                    <span
                      className="mt-1.5 w-[6px] h-[6px] rounded-full shrink-0"
                      style={{ background: "#c9a44a" }}
                    />
                  )}
                  <div className={n.isRead ? "pl-[14px]" : ""}>
                    <div className="text-[13px] text-[#d4ccc0] font-serif">{n.title}</div>
                    <div className="text-[11px] text-[#6a6050] font-serif mt-0.5">{n.body}</div>
                    <div className="text-[10px] text-[#4a4030] font-serif mt-1">
                      {new Date(n.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
