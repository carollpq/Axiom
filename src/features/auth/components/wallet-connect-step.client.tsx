'use client';

import { ConnectButton } from 'thirdweb/react';
import { client } from '@/src/shared/lib/thirdweb';
import { CONNECT_AUTH } from '@/src/shared/lib/auth/connect-auth';
import { ROLE_META } from '@/src/features/auth/types';
import type { Role } from '@/src/features/auth/types';
import { CONNECT_BUTTON_STYLE } from './connect-button-style';

interface WalletConnectStepProps {
  selectedRole: Role;
  hasAccount: boolean;
  onBack: () => void;
  onContinue: () => void;
}

export function WalletConnectStep({
  selectedRole,
  hasAccount,
  onBack,
  onContinue,
}: WalletConnectStepProps) {
  return (
    <div className="space-y-4">
      <div
        className="p-4 rounded"
        style={{ backgroundColor: 'rgba(45, 42, 38, 0.6)' }}
      >
        <p className="text-sm mb-3" style={{ color: '#b0a898' }}>
          Connect your Web3 wallet to sign in as a{' '}
          {ROLE_META[selectedRole].label}:
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

      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="flex-1 py-2 text-sm rounded transition-all cursor-pointer"
          style={{
            backgroundColor: 'transparent',
            color: '#b0a898',
            border: '1px solid #5a4a3a',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(201, 164, 74, 0.5)';
            e.currentTarget.style.color = '#d4ccc0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#5a4a3a';
            e.currentTarget.style.color = '#b0a898';
          }}
        >
          Back
        </button>
        {hasAccount && (
          <button
            onClick={onContinue}
            className="flex-1 py-2 text-sm rounded font-semibold transition-all cursor-pointer"
            style={{
              backgroundColor: '#c9a44a',
              color: '#1a1816',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#d4b45a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#c9a44a';
            }}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
