"use client";

import { useMemo } from "react";
import { useContractBuilder } from "@/src/features/researcher/hooks/useContractBuilder";
import { AlertBanner } from "@/src/shared/components/AlertBanner";
import { ContractContext } from "@/src/features/researcher/context/ContractContext";
import type { ContractContextValue } from "@/src/features/researcher/context/ContractContext";
import { PaperSelection } from "./PaperSelection";
import { ContributorTable } from "./ContributorTable";
import { ContractPreview } from "./ContractPreview";
import { ModificationWarning } from "./ModificationWarning";
import { InviteModal } from "./InviteModal";
import type { ExistingDraft } from "@/src/features/researcher/types/contract";

interface ContractBuilderClientProps {
  initialDrafts: ExistingDraft[];
}

export function ContractBuilderClient({ initialDrafts }: ContractBuilderClientProps) {
  const {
    selectedDraft, newTitle, contributors, showAddRow,
    showInviteModal, inviteLink, selectedContractId, error,
    totalPct, isValid, signedCount, allSigned, hasSigned, draft, drafts, currentUserWallet,
    setSelectedDraft, setNewTitle, setShowAddRow,
    generating,
    updateContributor, removeContributor, addContributorFromSearch, generateContract, handleSign, handleInvite, closeInviteModal,
  } = useContractBuilder(initialDrafts);

  const contextValue = useMemo<ContractContextValue>(() => ({
    state: {
      contributors,
      totalPct,
      isValid,
      hasSigned,
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
      newTitle,
      allSigned,
      selectedContractId: selectedContractId ?? null,
      paperId: draft?.dbId,
    },
  }), [
    contributors, totalPct, isValid, hasSigned, signedCount, currentUserWallet,
    showAddRow, generating, updateContributor, removeContributor, handleSign,
    handleInvite, addContributorFromSearch, setShowAddRow, generateContract,
    draft, newTitle, allSigned, selectedContractId,
  ]);

  return (
    <>
      <div>
        {error && (
          <AlertBanner variant="error" className="mb-4">{error}</AlertBanner>
        )}

        <PaperSelection
          selectedDraft={selectedDraft}
          newTitle={newTitle}
          drafts={drafts}
          draft={draft}
          disabled={generating}
          onSelectDraft={setSelectedDraft}
          onNewTitle={setNewTitle}
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
