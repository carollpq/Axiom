"use client";

import { useContractBuilder } from "@/src/features/researcher/hooks/useContractBuilder";
import { AlertBanner } from "@/src/shared/components/AlertBanner";
import { PaperSelection } from "./PaperSelection";
import { ContributorTable } from "./ContributorTable";
import { SignatureProgress } from "./SignatureProgress";
import { ContractPreview } from "./ContractPreview";
import { ModificationWarning } from "./ModificationWarning";
import { InviteModal } from "./InviteModal";
import type { ExistingDraft } from "@/src/features/researcher/types/contract";

interface ContractBuilderClientProps {
  initialDrafts: ExistingDraft[];
}

export function ContractBuilderClient({ initialDrafts }: ContractBuilderClientProps) {
  const {
    selectedDraft, newTitle, contributors, showAddRow, addWallet,
    showInviteModal, inviteLink, selectedContractId, error,
    totalPct, isValid, signedCount, allSigned, hasSigned, draft, drafts, currentUserWallet,
    setSelectedDraft, setNewTitle, setShowAddRow, setAddWallet,
    updateContributor, removeContributor, addContributor, handleSign, handleInvite, closeInviteModal,
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
          onSelectDraft={setSelectedDraft}
          onNewTitle={setNewTitle}
        />

        <ContributorTable
          contributors={contributors}
          totalPct={totalPct}
          isValid={isValid}
          hasSigned={hasSigned}
          currentUserWallet={currentUserWallet}
          showAddRow={showAddRow}
          addWallet={addWallet}
          onUpdate={updateContributor}
          onRemove={removeContributor}
          onSign={handleSign}
          onAdd={addContributor}
          onInvite={handleInvite}
          onSetShowAddRow={setShowAddRow}
          onSetAddWallet={setAddWallet}
        />

        <SignatureProgress
          contributors={contributors}
          signedCount={signedCount}
          allSigned={allSigned}
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
