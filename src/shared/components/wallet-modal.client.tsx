'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveWallet, useDisconnect } from 'thirdweb/react';
import {
  LogOut,
  ArrowRightLeft,
  Wallet,
  X,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { doLogout } from '@/src/shared/lib/auth/actions';
import { ROLES, ROLE_META } from '@/src/features/auth/types';
import { ROUTES, ROLE_DASHBOARD_ROUTES } from '@/src/shared/lib/routes';
import { capitalize } from '@/src/shared/lib/format';
import type { UserProfile } from '@/src/shared/types/shared';

interface WalletModalProps {
  user: UserProfile;
  fullWallet: string;
  onClose: () => void;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  backdropFilter: 'blur(4px)',
  zIndex: 200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const panelStyle: React.CSSProperties = {
  background: '#23201c',
  border: '1px solid rgba(120,110,95,0.3)',
  borderRadius: '12px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
  width: '100%',
  maxWidth: '360px',
  overflow: 'hidden',
};

const sectionBorderStyle: React.CSSProperties = {
  borderBottom: '1px solid rgba(120,110,95,0.2)',
};

const sectionTopBorderStyle: React.CSSProperties = {
  borderTop: '1px solid rgba(120,110,95,0.2)',
};

const avatarStyle: React.CSSProperties = {
  background: 'rgba(201,164,74,0.15)',
  color: '#c9a44a',
  border: '1px solid rgba(201,164,74,0.25)',
};

const sectionLabelStyle: React.CSSProperties = { color: '#6a6050' };

const walletBoxStyle: React.CSSProperties = {
  background: 'rgba(120,110,95,0.08)',
  border: '1px solid rgba(120,110,95,0.15)',
};

export function WalletModal({ user, fullWallet, onClose }: WalletModalProps) {
  const router = useRouter();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  function handleSwitch(role: string) {
    onClose();
    const route = ROLE_DASHBOARD_ROUTES[role];
    if (route) router.push(route);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(fullWallet);
    setCopied(true);
  }

  async function handleLogout() {
    if (wallet) disconnect(wallet);
    await doLogout();
    window.location.href = ROUTES.login;
  }

  const explorerUrl = `https://hashscan.io/testnet/account/${fullWallet}`;

  return (
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={panelStyle}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={sectionBorderStyle}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-serif"
              style={avatarStyle}
            >
              {user.initials}
            </div>
            <div>
              <div className="text-sm font-serif" style={{ color: '#d4ccc0' }}>
                {user.displayName ?? 'Anonymous'}
              </div>
              <div className="text-[11px]" style={sectionLabelStyle}>
                {capitalize(user.role)}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded p-1 transition-colors hover:bg-[rgba(120,110,95,0.15)]"
            style={sectionLabelStyle}
          >
            <X size={16} />
          </button>
        </div>

        {/* Wallet Info */}
        <div className="px-5 py-3" style={sectionBorderStyle}>
          <div
            className="flex items-center gap-1.5 pb-2 text-[10px] uppercase tracking-wider"
            style={sectionLabelStyle}
          >
            <Wallet size={10} />
            Wallet
          </div>
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2.5"
            style={walletBoxStyle}
          >
            <code
              className="flex-1 truncate text-[12px]"
              style={{ color: '#c9b89e' }}
            >
              {fullWallet}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 cursor-pointer rounded p-1 transition-colors hover:bg-[rgba(120,110,95,0.2)]"
              style={{ color: copied ? '#8fbc8f' : '#6a6050' }}
              title="Copy address"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded p-1 transition-colors hover:bg-[rgba(120,110,95,0.2)]"
              style={sectionLabelStyle}
              title="View on HashScan"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="px-5 py-3">
          <div
            className="flex items-center gap-1.5 pb-2 text-[10px] uppercase tracking-wider"
            style={sectionLabelStyle}
          >
            <ArrowRightLeft size={10} />
            Switch Dashboard
          </div>
          <div className="flex flex-col gap-1">
            {ROLES.map((role) => {
              const isActive = role === user.role;
              const hasRole = user.roles.includes(role);
              return (
                <button
                  key={role}
                  onClick={() => hasRole && !isActive && handleSwitch(role)}
                  disabled={!hasRole}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left font-serif transition-colors duration-150 disabled:opacity-30"
                  style={{
                    background: isActive
                      ? 'rgba(201,164,74,0.1)'
                      : 'transparent',
                    border: isActive
                      ? '1px solid rgba(201,164,74,0.2)'
                      : '1px solid transparent',
                    cursor: isActive
                      ? 'default'
                      : hasRole
                        ? 'pointer'
                        : 'not-allowed',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive && hasRole)
                      e.currentTarget.style.background =
                        'rgba(120,110,95,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive && hasRole)
                      e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div>
                    <div
                      className="text-[13px]"
                      style={{
                        color: isActive
                          ? '#c9a44a'
                          : hasRole
                            ? '#c9b89e'
                            : '#4a4238',
                      }}
                    >
                      {ROLE_META[role].label}
                    </div>
                    <div className="text-[11px]" style={sectionLabelStyle}>
                      {ROLE_META[role].description}
                    </div>
                  </div>
                  {isActive && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px]"
                      style={{
                        background: 'rgba(201,164,74,0.15)',
                        color: '#c9a44a',
                      }}
                    >
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Logout */}
        <div className="px-5 py-3" style={sectionTopBorderStyle}>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 font-serif text-[13px] transition-colors duration-150 cursor-pointer"
            style={{
              background: 'rgba(212,100,90,0.08)',
              color: '#d4645a',
              border: '1px solid rgba(212,100,90,0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(212,100,90,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(212,100,90,0.08)';
            }}
          >
            <LogOut size={14} />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
