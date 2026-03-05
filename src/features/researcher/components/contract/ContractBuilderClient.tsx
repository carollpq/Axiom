"use client";

import { useContractBuilder } from "@/src/features/researcher/hooks/useContractBuilder";
import { AlertBanner } from "@/src/shared/components/AlertBanner";
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

        <ContributorTable
          contributors={contributors}
          totalPct={totalPct}
          isValid={isValid}
          hasSigned={hasSigned}
          signedCount={signedCount}
          currentUserWallet={currentUserWallet}
          showAddRow={showAddRow}
          disabled={generating}
          onAddFromSearch={addContributorFromSearch}
          onUpdate={updateContributor}
          onRemove={removeContributor}
          onSign={handleSign}
          onInvite={handleInvite}
          onSetShowAddRow={setShowAddRow}
        />

        <ContractPreview
          title={newTitle}
          draft={draft}
          contributors={contributors}
          allSigned={allSigned}
          isValid={isValid}
          signedCount={signedCount}
          paperId={draft?.dbId}
          contractId={selectedContractId}
          onGenerateContract={generateContract}
        />

        <ModificationWarning visible={hasSigned} />
      </div>

      <InviteModal
        isOpen={showInviteModal}
        inviteLink={inviteLink}
        onClose={closeInviteModal}
      />
    </>
  );
}
