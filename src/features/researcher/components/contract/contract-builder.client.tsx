'use client';

import { useMemo } from 'react';
import { useContractBuilder } from '@/src/features/researcher/hooks/useContractBuilder';
import { AlertBanner } from '@/src/shared/components/alert-banner';
import { ContractContext } from '@/src/features/researcher/context/contract-context.client';
import type { ContractContextValue } from '@/src/features/researcher/context/contract-context.client';
import { PaperSelection } from './paper-selection';
import { ContributorTable } from './contributor-table.client';
import { ContractPreview } from './contract-preview.client';
import { ModificationWarning } from './modification-warning';
import { InviteModal } from './invite-modal.client';
import type { ExistingDraft } from '@/src/features/researcher/types/contract';

interface ContractBuilderClientProps {
  initialDrafts: ExistingDraft[];
}

export function ContractBuilderClient({
  initialDrafts,
}: ContractBuilderClientProps) {
  const {
    selectedDraft,
    contributors,
    showAddRow,
    showInviteModal,
    inviteLink,
    selectedContractId,
    error,
    totalPct,
    isValid,
    signedCount,
    allSigned,
    hasSigned,
    hasCurrentUserSigned,
    draft,
    drafts,
    currentUserWallet,
    setSelectedDraft,
    setShowAddRow,
    generating,
    updateContributor,
    removeContributor,
    addContributorFromSearch,
    generateContract,
    handleSign,
    handleInvite,
    closeInviteModal,
  } = useContractBuilder(initialDrafts);

  const contextValue = useMemo<ContractContextValue>(
    () => ({
      state: {
        contributors,
        totalPct,
        isValid,
        hasSigned,
        hasCurrentUserSigned,
        signedCount,
        currentUserWallet,
        showAddRow,
        disabled: generating,
      },
      actions: {
        onUpdate: updateContributor,
        onRemove: removeContributor,
        onSign: handleSign,
        onInvite: handleInvite,
        onAddFromSearch: addContributorFromSearch,
        onSetShowAddRow: setShowAddRow,
        onGenerateContract: generateContract,
      },
      meta: {
        draft,
        allSigned,
        selectedContractId: selectedContractId ?? null,
        paperId: draft?.dbId,
        hederaTxId: draft?.hederaTxId ?? null,
      },
    }),
    [
      contributors,
      totalPct,
      isValid,
      hasSigned,
      hasCurrentUserSigned,
      signedCount,
      currentUserWallet,
      showAddRow,
      generating,
      updateContributor,
      removeContributor,
      handleSign,
      handleInvite,
      addContributorFromSearch,
      setShowAddRow,
      generateContract,
      draft,
      allSigned,
      selectedContractId,
    ],
  );

  return (
    <>
      <div>
        {error && (
          <AlertBanner variant="error" className="mb-4">
            {error}
          </AlertBanner>
        )}

        <PaperSelection
          selectedDraft={selectedDraft}
          drafts={drafts}
          draft={draft}
          disabled={generating}
          onSelectDraft={setSelectedDraft}
        />

        <ContractContext value={contextValue}>
          <ContributorTable />
          <ContractPreview />
          <ModificationWarning visible={hasSigned} />
        </ContractContext>
      </div>

      <InviteModal
        isOpen={showInviteModal}
        inviteLink={inviteLink}
        onClose={closeInviteModal}
      />
    </>
  );
}

export default ContractBuilderClient;
