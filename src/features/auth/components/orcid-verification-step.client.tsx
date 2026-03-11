'use client';

import { useState } from 'react';
import { validateOrcidId } from '@/src/shared/lib/validation';
import {
  AUTH_COLORS,
  INPUT_STYLE,
  INPUT_STYLE_ERROR,
  SECONDARY_BTN_STYLE,
  secondaryBtnHover,
  PRIMARY_BTN_STYLE,
  primaryBtnHover,
} from './auth-styles';

interface OrcidVerificationStepProps {
  onVerified: (orcidId: string, displayName: string) => void;
  onBack: () => void;
  loading: boolean;
}

export function OrcidVerificationStep({
  onVerified,
  onBack,
  loading,
}: OrcidVerificationStepProps) {
  const [displayName, setDisplayName] = useState('');
  const [orcidId, setOrcidId] = useState('');
  const [nameError, setNameError] = useState<string>();
  const [orcidError, setOrcidError] = useState<string>();

  const validate = (): boolean => {
    setNameError(undefined);
    setOrcidError(undefined);
    if (!displayName.trim()) {
      setNameError('Display name is required');
      return false;
    }
    const orcidErr = validateOrcidId(orcidId);
    if (orcidErr) {
      setOrcidError(orcidErr);
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onVerified(orcidId, displayName.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        className="p-4 rounded space-y-4"
        style={{ backgroundColor: AUTH_COLORS.bg.card }}
      >
        <div>
          <p
            className="text-sm mb-2"
            style={{ color: AUTH_COLORS.text.secondary }}
          >
            Display name
          </p>
          <input
            type="text"
            placeholder="e.g. Dr. Jane Smith"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setNameError(undefined);
            }}
            disabled={loading}
            className="w-full px-3 py-2 rounded text-sm"
            style={nameError ? INPUT_STYLE_ERROR : INPUT_STYLE}
          />
          {nameError && (
            <p className="text-xs mt-1" style={{ color: AUTH_COLORS.error }}>
              {nameError}
            </p>
          )}
        </div>

        <div>
          <p
            className="text-sm mb-2"
            style={{ color: AUTH_COLORS.text.secondary }}
          >
            ORCID iD
          </p>
          <p className="text-xs mb-2" style={{ color: AUTH_COLORS.text.muted }}>
            A unique identifier for your research career. Create one at{' '}
            <a
              href="https://orcid.org/register"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: AUTH_COLORS.accent.gold }}
            >
              orcid.org/register
            </a>
          </p>
          <input
            type="text"
            placeholder="XXXX-XXXX-XXXX-XXXX"
            value={orcidId}
            onChange={(e) => {
              setOrcidId(e.target.value);
              setOrcidError(undefined);
            }}
            onBlur={() => {
              if (orcidId) {
                const err = validateOrcidId(orcidId, { allowEmpty: true });
                if (err) setOrcidError(err);
              }
            }}
            disabled={loading}
            className="w-full px-3 py-2 rounded text-sm font-mono"
            style={orcidError ? INPUT_STYLE_ERROR : INPUT_STYLE}
          />
          {orcidError && (
            <p className="text-xs mt-1" style={{ color: AUTH_COLORS.error }}>
              {orcidError}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-2 text-sm rounded transition-all cursor-pointer hover:brightness-110"
          style={SECONDARY_BTN_STYLE}
          {...secondaryBtnHover}
        >
          Back
        </button>

        <button
          type="submit"
          disabled={loading || !orcidId || !displayName.trim()}
          className="flex-1 py-2 text-sm rounded font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={PRIMARY_BTN_STYLE}
          {...primaryBtnHover}
        >
          {loading ? 'Verifying...' : 'Continue'}
        </button>
      </div>
    </form>
  );
}
