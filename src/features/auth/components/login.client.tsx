'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConnectButton, useActiveAccount } from 'thirdweb/react';
import { client } from '@/src/shared/lib/thirdweb';
import { CONNECT_AUTH } from '@/src/shared/lib/auth/connect-auth';
import { useUser } from '@/src/shared/context/user-context.client';
import { AuthHeader } from './auth-header';
import { CONNECT_BUTTON_STYLE } from './connect-button-style';

export function Login() {
  const router = useRouter();
  const account = useActiveAccount();
  const { user, isConnected } = useUser();

  // Connected user with no roles → send to registration
  useEffect(() => {
    if (isConnected && account?.address && user && user.roles?.length === 0) {
      router.push('/register');
    }
  }, [isConnected, account?.address, user, router]);

  return (
    <div className="w-full max-w-md mx-auto">
      <AuthHeader subtitle="Blockchain-backed peer review" />

      <div
        className="p-4 rounded space-y-4"
        style={{ backgroundColor: 'rgba(45, 42, 38, 0.6)' }}
      >
        <p className="text-sm text-center" style={{ color: '#b0a898' }}>
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
      </div>

      <p className="text-center text-sm mt-6" style={{ color: '#8a8070' }}>
        New here?{' '}
        <a href="/register" className="underline" style={{ color: '#c9a44a' }}>
          Register
        </a>
      </p>
    </div>
  );
}
