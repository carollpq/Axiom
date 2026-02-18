"use client";

import { useContractBuilder } from "@/hooks/useContractBuilder";
import {
  PaperSelection,
  ContributorTable,
  SignatureProgress,
  ContractPreview,
  ModificationWarning,
  SubmissionGate,
  InviteModal,
} from "@/components/contract";

export default function ContractBuilder() {
  const {
    selectedDraft, newTitle, contributors, showAddRow, addWallet,
    showPreview, showInviteModal, inviteLink,
    totalPct, isValid, signedCount, allSigned, hasSigned, draft, drafts, currentUserWallet,
    setSelectedDraft, setNewTitle, setShowAddRow, setAddWallet, setShowPreview,
    updateContributor, removeContributor, addContributor, handleSign, handleInvite, closeInviteModal,
  } = useContractBuilder();

  return (
    <>
      <div className="max-w-[960px] mx-auto py-8 px-10">
        {/* Breadcrumb + Header */}
        <div className="mb-2">
          <div className="text-[11px] text-[#6a6050] mb-2">
            <span className="cursor-pointer">Dashboard</span>
            <span className="mx-2">/</span>
            <span className="text-[#8a8070]">Authorship Contract Builder</span>
          </div>
          <h1 className="text-[28px] font-normal italic text-[#e8e0d4] m-0">Authorship Contract Builder</h1>
          <p className="text-[13px] text-[#6a6050] mt-1.5 italic m-0">Define contributions, collect signatures, record on Hedera</p>
        </div>

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
          showPreview={showPreview}
          onToggle={() => setShowPreview(!showPreview)}
          title={newTitle}
          draft={draft}
          contributors={contributors}
        />

        <ModificationWarning visible={hasSigned} />

        <SubmissionGate
          allSigned={allSigned}
          isValid={isValid}
          signedCount={signedCount}
          totalContributors={contributors.length}
        />
      </div>

      <InviteModal
        isOpen={showInviteModal}
        inviteLink={inviteLink}
        onClose={closeInviteModal}
      />
    </>
  );
}
