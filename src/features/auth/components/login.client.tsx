'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ConnectButton, useActiveAccount } from 'thirdweb/react';
import { client } from '@/src/shared/lib/thirdweb';
import { CONNECT_AUTH } from '@/src/shared/lib/auth/connect-auth';
import { useUser } from '@/src/shared/context/user-context.client';
import { ROUTES, ROLE_DASHBOARD_ROUTES } from '@/src/shared/lib/routes';
import type { Role } from '@/src/features/auth/types';
import { AuthHeader } from './auth-header';
import { CONNECT_BUTTON_STYLE } from './connect-button-style';
import { RoleSelector } from './role-selector.client';
import { AUTH_COLORS } from './auth-styles';

export function Login() {
  const router = useRouter();
  const account = useActiveAccount();
  const { user, loading, isConnected } = useUser();

  const userRoles = useMemo(() => (user?.roles ?? []) as Role[], [user?.roles]);
  const showRolePicker =
    isConnected && !!account?.address && userRoles.length > 1;

  // Redirect only if user has no roles yet (new user).
  // Users with 1-2 roles stay on login to select/add roles.
  // Users with 3 roles must use the role picker.
  useEffect(() => {
    if (loading || !isConnected || !account?.address || !user) return;

    if (userRoles.length === 0) {
      router.push(ROUTES.register);
    }
  }, [loading, isConnected, account?.address, user, router, userRoles]);

  return (
    <div className="w-full max-w-md mx-auto">
      <AuthHeader subtitle="Blockchain-backed peer review" />

      <div
        className="p-4 rounded space-y-4"
        style={{ backgroundColor: AUTH_COLORS.bg.card }}
      >
        {showRolePicker ? (
          <RoleSelector
            roles={userRoles}
            label="Sign in as:"
            onSelect={(role) => router.push(ROLE_DASHBOARD_ROUTES[role])}
          />
        ) : (
          <>
            <p
              className="text-sm text-center"
              style={{ color: AUTH_COLORS.text.secondary }}
            >
              Connect your wallet to sign in:
            </p>
            <div className="flex justify-center">
              <ConnectButton
                client={client}
                auth={CONNECT_AUTH}
                theme="dark"
                connectButton={{
                  label: 'Connect Wallet',
                  style: CONNECT_BUTTON_STYLE,
                }}
              />
            </div>
          </>
        )}
      </div>

      {userRoles.length < 3 && (
        <p
          className="text-center text-sm mt-6"
          style={{ color: AUTH_COLORS.text.muted }}
        >
          {userRoles.length === 0 ? 'New here? ' : 'Want to add another role? '}
          <a
            href={ROUTES.register}
            className="underline"
            style={{ color: AUTH_COLORS.accent.gold }}
          >
            Register
          </a>
        </p>
      )}
    </div>
  );
}
