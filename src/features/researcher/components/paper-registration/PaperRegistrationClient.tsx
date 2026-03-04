"use client";

import { usePaperRegistration } from "@/src/features/researcher/hooks/usePaperRegistration";
import { StepIndicator } from "./StepIndicator";
import { PaperDetailsStep } from "./PaperDetailsStep";
import { ProvenanceStep } from "./ProvenanceStep";
import { ContractLinkingStep } from "./ContractLinkingStep";
import { RegisterSubmitStep } from "./RegisterSubmitStep";
import { ConfirmationScreen } from "./ConfirmationScreen";
import { StepNavigation } from "./StepNavigation";
import type { ApiContract } from "@/src/shared/types/api";
import type { RegisteredJournal } from "@/src/features/researcher/types/paper-registration";

interface PaperRegistrationClientProps {
  initialContracts: ApiContract[];
  initialJournals: RegisteredJournal[];
}

export function PaperRegistrationClient({ initialContracts, initialJournals }: PaperRegistrationClientProps) {
  const { navigation, paperDetails, provenance, contractLinking, registration, validation } =
    usePaperRegistration(initialContracts, initialJournals);

  const canProceed = navigation.step === 0 ? validation.canProceedStep1 : true;
  const showConfirmation = (registration.registered || registration.submitted) && navigation.step === 3;

  return (
    <div className="max-w-[1200px] mx-auto py-8 px-10">
      {/* Breadcrumb + Header */}
      <div className="mb-2">
        <div className="text-[11px] text-[#6a6050] mb-2">
          <span className="cursor-pointer">Dashboard</span>
          <span className="mx-2">/</span>
          <span className="text-[#8a8070]">Paper Registration & Submission</span>
        </div>
        <h1 className="text-[28px] font-normal text-[#e8e0d4] m-0">Paper Registration & Submission</h1>
        <p className="text-[13px] text-[#6a6050] mt-1.5 italic m-0">Timestamp your research on-chain and submit for peer review</p>
      </div>

      {/* Step Indicator */}
      <div className="mt-7">
        <StepIndicator steps={navigation.steps} current={navigation.step} />
      </div>

      {/* Step 1: Paper Details */}
      {navigation.step === 0 && (
        <PaperDetailsStep
          title={paperDetails.title} abstract={paperDetails.abstract}
          fileName={paperDetails.fileName} fileHash={paperDetails.fileHash} isHashing={paperDetails.isHashing}
          visibility={paperDetails.visibility} studyType={paperDetails.studyType}
          keywords={paperDetails.keywords} keywordInput={paperDetails.keywordInput}
          onTitleChange={paperDetails.setTitle} onAbstractChange={paperDetails.setAbstract}
          onVisibilityChange={paperDetails.setVisibility} onStudyTypeChange={paperDetails.setStudyType}
          onKeywordInputChange={paperDetails.setKeywordInput}
          onAddKeyword={paperDetails.addKeyword} onRemoveKeyword={paperDetails.removeKeyword}
          onFileUpload={paperDetails.handleFileUpload} onFileRemove={paperDetails.removeFile}
        />
      )}

      {/* Step 2: Provenance */}
      {navigation.step === 1 && (
        <ProvenanceStep
          fileHash={paperDetails.fileHash}
          datasetHash={provenance.datasetHash} datasetUrl={provenance.datasetUrl}
          codeRepo={provenance.codeRepo} codeCommit={provenance.codeCommit}
          envHash={provenance.envHash} githubConnected={provenance.githubConnected}
          onDatasetHashChange={provenance.setDatasetHash} onDatasetUrlChange={provenance.setDatasetUrl}
          onCodeRepoChange={provenance.setCodeRepo} onCodeCommitChange={provenance.setCodeCommit}
          onEnvHashChange={provenance.setEnvHash}
          onDatasetUpload={provenance.handleDatasetUpload}
          onEnvUpload={provenance.handleEnvUpload}
          onGithubConnect={provenance.simulateGithub}
        />
      )}

      {/* Step 3: Contract Linking */}
      {navigation.step === 2 && (
        <ContractLinkingStep
          selectedContract={contractLinking.selectedContract}
          contracts={contractLinking.contracts}
          contract={contractLinking.contract}
          onSelectContract={contractLinking.setSelectedContract}
        />
      )}

      {/* Step 4: Register / Submit */}
      {navigation.step === 3 && !showConfirmation && (
        <RegisterSubmitStep
          title={paperDetails.title} fileHash={paperDetails.fileHash}
          datasetHash={provenance.datasetHash} codeCommit={provenance.codeCommit}
          envHash={provenance.envHash} visibility={paperDetails.visibility}
          contract={contractLinking.contract} journals={registration.journals}
          selectedJournal={registration.selectedJournal}
          registering={registration.registering}
          onSelectJournal={registration.setSelectedJournal}
          onRegister={registration.handleRegister} onSubmit={registration.handleSubmit}
        />
      )}

      {/* Confirmation Screen */}
      {showConfirmation && (
        <ConfirmationScreen
          submitted={registration.submitted}
          txHash={registration.txHash} txTimestamp={registration.txTimestamp}
          fileHash={paperDetails.fileHash} datasetHash={provenance.datasetHash}
          codeCommit={provenance.codeCommit} envHash={provenance.envHash}
          contract={contractLinking.contract}
        />
      )}

      {/* Navigation */}
      {!showConfirmation && (
        <StepNavigation
          step={navigation.step}
          canProceed={canProceed}
          onBack={navigation.goBack}
          onNext={navigation.goNext}
        />
      )}
    </div>
  );
}
