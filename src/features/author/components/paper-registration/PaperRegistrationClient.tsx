"use client";

import { usePaperRegistration } from "@/features/author/hooks/usePaperRegistration";
import { StepIndicator } from "./StepIndicator";
import { PaperDetailsStep } from "./PaperDetailsStep";
import { ProvenanceStep } from "./ProvenanceStep";
import { ContractLinkingStep } from "./ContractLinkingStep";
import { RegisterSubmitStep } from "./RegisterSubmitStep";
import { ConfirmationScreen } from "./ConfirmationScreen";
import { StepNavigation } from "./StepNavigation";
import type { ApiContract } from "@/src/shared/types/api";

interface PaperRegistrationClientProps {
  initialContracts: ApiContract[];
}

export function PaperRegistrationClient({ initialContracts }: PaperRegistrationClientProps) {
  const {
    step, steps, goBack, goNext,
    title, setTitle, abstract, setAbstract,
    fileName, fileHash, visibility, setVisibility,
    keywords, keywordInput, setKeywordInput,
    handleFileUpload, removeFile, isHashing, addKeyword, removeKeyword,
    datasetHash, setDatasetHash, datasetUrl, setDatasetUrl,
    codeRepo, setCodeRepo, codeCommit, setCodeCommit,
    envHash, setEnvHash, githubConnected,
    handleDatasetUpload, handleEnvUpload, simulateGithub,
    selectedContract, setSelectedContract, contracts, contract,
    registered, submitted,
    selectedJournal, setSelectedJournal, journals,
    txHash, txTimestamp,
    handleRegister, handleSubmit,
    canProceedStep1,
  } = usePaperRegistration(initialContracts);

  const canProceed = step === 0 ? canProceedStep1 : true;
  const showConfirmation = (registered || submitted) && step === 3;

  return (
    <div className="max-w-[800px] mx-auto py-8 px-10">
      {/* Breadcrumb + Header */}
      <div className="mb-2">
        <div className="text-[11px] text-[#6a6050] mb-2">
          <span className="cursor-pointer">Dashboard</span>
          <span className="mx-2">/</span>
          <span className="text-[#8a8070]">Paper Registration & Submission</span>
        </div>
        <h1 className="text-[28px] font-normal italic text-[#e8e0d4] m-0">Paper Registration & Submission</h1>
        <p className="text-[13px] text-[#6a6050] mt-1.5 italic m-0">Timestamp your research on-chain and submit for peer review</p>
      </div>

      {/* Step Indicator */}
      <div className="mt-7">
        <StepIndicator steps={steps} current={step} />
      </div>

      {/* Step 1: Paper Details */}
      {step === 0 && (
        <PaperDetailsStep
          title={title} abstract={abstract}
          fileName={fileName} fileHash={fileHash} isHashing={isHashing}
          visibility={visibility} keywords={keywords} keywordInput={keywordInput}
          onTitleChange={setTitle} onAbstractChange={setAbstract}
          onVisibilityChange={setVisibility}
          onKeywordInputChange={setKeywordInput}
          onAddKeyword={addKeyword} onRemoveKeyword={removeKeyword}
          onFileUpload={handleFileUpload} onFileRemove={removeFile}
        />
      )}

      {/* Step 2: Provenance */}
      {step === 1 && (
        <ProvenanceStep
          fileHash={fileHash}
          datasetHash={datasetHash} datasetUrl={datasetUrl}
          codeRepo={codeRepo} codeCommit={codeCommit}
          envHash={envHash} githubConnected={githubConnected}
          onDatasetHashChange={setDatasetHash} onDatasetUrlChange={setDatasetUrl}
          onCodeRepoChange={setCodeRepo} onCodeCommitChange={setCodeCommit}
          onEnvHashChange={setEnvHash}
          onDatasetUpload={handleDatasetUpload}
          onEnvUpload={handleEnvUpload}
          onGithubConnect={simulateGithub}
        />
      )}

      {/* Step 3: Contract Linking */}
      {step === 2 && (
        <ContractLinkingStep
          selectedContract={selectedContract}
          contracts={contracts}
          contract={contract}
          onSelectContract={setSelectedContract}
        />
      )}

      {/* Step 4: Register / Submit */}
      {step === 3 && !showConfirmation && (
        <RegisterSubmitStep
          title={title} fileHash={fileHash}
          datasetHash={datasetHash} codeCommit={codeCommit}
          envHash={envHash} visibility={visibility}
          contract={contract} journals={journals}
          selectedJournal={selectedJournal}
          onSelectJournal={setSelectedJournal}
          onRegister={handleRegister} onSubmit={handleSubmit}
        />
      )}

      {/* Confirmation Screen */}
      {showConfirmation && (
        <ConfirmationScreen
          submitted={submitted}
          txHash={txHash} txTimestamp={txTimestamp}
          fileHash={fileHash} datasetHash={datasetHash}
          codeCommit={codeCommit} envHash={envHash}
          contract={contract}
        />
      )}

      {/* Navigation */}
      {!showConfirmation && (
        <StepNavigation
          step={step}
          canProceed={canProceed}
          onBack={goBack}
          onNext={goNext}
        />
      )}
    </div>
  );
}
