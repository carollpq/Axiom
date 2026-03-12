'use client';

import { createContext, use } from 'react';
import type {
  Contributor,
  ExistingDraft,
} from '@/src/features/researcher/types/contract';
import type { UserSearchResult } from '@/src/shared/types/domain';

interface ContractContextState {
  contributors: Contributor[];
  totalPct: number;
  isValid: boolean;
  hasSigned: boolean;
  hasCurrentUserSigned: boolean;
  signedCount: number;
  currentUserWallet: string;
  showAddRow: boolean;
  disabled: boolean;
}

interface ContractContextActions {
  onUpdate: (id: number, field: string, value: string | number) => void;
  onRemove: (id: number) => void | Promise<void>;
  onSign: (id: number) => void | Promise<void>;
  onInvite: (dbId?: string) => void | Promise<void>;
  onAddFromSearch: (result: UserSearchResult) => void | Promise<void>;
  onSetShowAddRow: (show: boolean) => void;
  onGenerateContract: () => Promise<void>;
}

interface ContractContextMeta {
  draft: ExistingDraft | undefined;
  newTitle: string;
  allSigned: boolean;
  selectedContractId: string | null;
  paperId: string | undefined;
}

export interface ContractContextValue {
  state: ContractContextState;
  actions: ContractContextActions;
  meta: ContractContextMeta;
}

export const ContractContext = createContext<ContractContextValue | null>(null);

/** Throws if used outside ContractContext.Provider. */
export function useContractContext(): ContractContextValue {
  const ctx = use(ContractContext);
  if (!ctx)
    throw new Error(
      'useContractContext must be used within ContractContext.Provider',
    );
  return ctx;
}
