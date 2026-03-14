'use client';

import { ConnectButton } from 'thirdweb/react';
import { client } from '@/src/shared/lib/thirdweb';
import { CONNECT_AUTH } from '@/src/shared/lib/auth/connect-auth';
import { ROLE_META } from '@/src/features/auth/types';
import type { Role } from '@/src/features/auth/types';
import { CONNECT_BUTTON_STYLE } from './connect-button-style';
import {
  AUTH_COLORS,
  SECONDARY_BTN_STYLE,
  secondaryBtnHover,
  PRIMARY_BTN_STYLE,
  primaryBtnHover,
} from './auth-styles';

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
        style={{ backgroundColor: AUTH_COLORS.bg.card }}
      >
        <p
          className="text-sm mb-3"
          style={{ color: AUTH_COLORS.text.secondary }}
        >
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
          style={SECONDARY_BTN_STYLE}
          {...secondaryBtnHover}
        >
          Back
        </button>
        {hasAccount && (
          <button
            onClick={onContinue}
            className="flex-1 py-2 text-sm rounded font-semibold transition-all cursor-pointer"
            style={PRIMARY_BTN_STYLE}
            {...primaryBtnHover}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
