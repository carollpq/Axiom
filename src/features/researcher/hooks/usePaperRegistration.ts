"use client";

import { useReducer, useCallback, useRef, useMemo, useState } from "react";
import type { SignedContract, RegisteredJournal } from "@/src/features/researcher/types/paper-registration";
import { useCurrentUser } from "@/src/shared/hooks/useCurrentUser";
import { fetchApi } from "@/src/shared/lib/api";
import { mockTxHash, formatTimestampUtc } from "@/src/shared/lib/format";
import { hashFile } from "@/src/shared/lib/hashing";
import { isLitConfigured, getLitClient } from "@/src/shared/lib/lit/client";
import { buildWalletListConditions } from "@/src/shared/lib/lit/access-control";
import { encryptFileWithLit } from "@/src/shared/lib/lit/encrypt";
import { mapDbContractToSigned } from "@/src/features/researcher/mappers/contract";
import type { ApiContract, ApiPaperVersion } from "@/src/shared/types/api";
import {
  paperRegistrationReducer,
  initialState,
  validateStep1,
} from "@/src/features/researcher/reducers/paper-registration";
import { STEP_LABELS } from "@/src/features/researcher/config/paper-registration";

export function usePaperRegistration(initialContracts: ApiContract[], initialJournals: RegisteredJournal[]) {
  const { user, isConnected, account } = useCurrentUser();
  const [state, dispatch] = useReducer(paperRegistrationReducer, initialState);

  const uploadedFileRef = useRef<File | null>(null);
  const uploadedDatasetFileRef = useRef<File | null>(null);
  const uploadedEnvFileRef = useRef<File | null>(null);

  // Contracts from server — filter to fully signed only
  const contracts = useMemo<SignedContract[]>(
    () => initialContracts.filter((c) => c.status === "fully_signed").map(mapDbContractToSigned),
    [initialContracts],
  );

  // Derived
  const contract = useMemo(
    () => contracts.find(c => c.id === state.selectedContract),
    [contracts, state.selectedContract],
  );

  // Handlers
  const handleFileUpload = useCallback(async (file: File) => {
    dispatch({ type: "FILE_UPLOAD_START", fileName: file.name });
    uploadedFileRef.current = file;
    try {
      const hash = await hashFile(file);
      dispatch({ type: "FILE_UPLOAD_COMPLETE", fileHash: hash });
    } catch {
      dispatch({ type: "FILE_UPLOAD_ERROR" });
    }
  }, []);

  const removeFile = () => {
    dispatch({ type: "REMOVE_FILE" });
    uploadedFileRef.current = null;
  };

  const handleDatasetUpload = useCallback(async (file: File) => {
    uploadedDatasetFileRef.current = file;
    dispatch({ type: "DATASET_UPLOAD_START" });
    try {
      const hash = await hashFile(file);
      dispatch({ type: "DATASET_UPLOAD_COMPLETE", datasetHash: hash });
    } catch {
      dispatch({ type: "DATASET_UPLOAD_ERROR" });
    }
  }, []);

  const handleEnvUpload = useCallback(async (file: File) => {
    uploadedEnvFileRef.current = file;
    dispatch({ type: "ENV_UPLOAD_START" });
    try {
      const hash = await hashFile(file);
      dispatch({ type: "ENV_UPLOAD_COMPLETE", envHash: hash });
    } catch {
      dispatch({ type: "ENV_UPLOAD_ERROR" });
    }
  }, []);

  const simulateGithub = () => dispatch({ type: "SIMULATE_GITHUB" });

  const addKeyword = () => dispatch({ type: "ADD_KEYWORD" });

  const removeKeyword = (index: number) => dispatch({ type: "REMOVE_KEYWORD", index });

  const uploadToR2 = async (
    file: File,
    hash: string,
    folder: "papers" | "datasets" | "environments",
  ): Promise<string | null> => {
    try {
      const { uploadUrl, objectKey } = await fetchApi<{
        uploadUrl: string;
        objectKey: string;
      }>("/api/upload/presigned", {
        method: "POST",
        body: JSON.stringify({
          hash,
          contentType: file.type || "application/octet-stream",
          folder,
        }),
      });

      const r2Response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });

      if (!r2Response.ok) throw new Error(`R2 PUT failed: ${r2Response.status}`);
      return objectKey;
    } catch (err) {
      console.warn("[R2] Upload skipped:", err);
      return null;
    }
  };

  const handleRegister = async () => {
    if (!isConnected || !user) {
      dispatch({
        type: "REGISTER_DEMO",
        txHash: mockTxHash(),
        txTimestamp: formatTimestampUtc(new Date().toISOString()),
      });
      return;
    }

    dispatch({ type: "REGISTER_START" });
    try {
      const uploadedFile = uploadedFileRef.current;
      let fileToUpload = uploadedFile;
      let litDataToEncryptHash: string | null = null;
      let litAccessConditionsJson: string | null = null;

      if (uploadedFile && state.fileHash && isLitConfigured() && account?.address) {
        try {
          await getLitClient();
          const conditions = buildWalletListConditions([account.address]);
          const encrypted = await encryptFileWithLit(uploadedFile, conditions);
          fileToUpload = new File(
            [encrypted.ciphertext],
            uploadedFile.name + ".enc",
            { type: "application/octet-stream" },
          );
          litDataToEncryptHash = encrypted.dataToEncryptHash;
          litAccessConditionsJson = encrypted.accessConditionsJson;
        } catch (litErr) {
          console.warn("[Lit] Encryption skipped:", litErr);
          fileToUpload = uploadedFile;
        }
      }

      const fileStorageKey = fileToUpload
        ? await uploadToR2(fileToUpload, state.fileHash, "papers")
        : null;
      if (uploadedDatasetFileRef.current && state.datasetHash) {
        await uploadToR2(uploadedDatasetFileRef.current, state.datasetHash, "datasets");
      }
      if (uploadedEnvFileRef.current && state.envHash) {
        await uploadToR2(uploadedEnvFileRef.current, state.envHash, "environments");
      }

      const paper = await fetchApi<{ id: string }>("/api/papers", {
        method: "POST",
        body: JSON.stringify({
          title: state.title,
          abstract: state.abstract,
          studyType: state.studyType,
          litDataToEncryptHash,
          litAccessConditionsJson,
        }),
      });

      const version = await fetchApi<ApiPaperVersion>(
        `/api/papers/${paper.id}/versions`,
        {
          method: "POST",
          body: JSON.stringify({
            paperHash: state.fileHash,
            fileStorageKey,
            datasetHash: state.datasetHash || null,
            codeRepoUrl: state.codeRepo || null,
            codeCommitHash: state.codeCommit || null,
            envSpecHash: state.envHash || null,
          }),
        },
      );

      await fetchApi(`/api/papers/${paper.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "registered", visibility: state.visibility }),
      });

      dispatch({
        type: "REGISTER_SUCCESS",
        paperId: paper.id,
        txHash: version.hederaTxId ?? "pending — configure HEDERA_OPERATOR_ID/KEY to anchor on-chain",
        txTimestamp: formatTimestampUtc(version.hederaTimestamp ?? new Date().toISOString()),
      });
    } catch (err) {
      console.error("Registration failed:", err);
      dispatch({ type: "REGISTER_ERROR" });
    }
  };

  const handleSubmit = async () => {
    if (!state.paperId || !state.selectedJournal) return;

    try {
      const result = await fetchApi<{ submissionId?: string; hederaTxId?: string; hederaTimestamp?: string }>(
        `/api/papers/${state.paperId}/submit`,
        { method: "POST", body: JSON.stringify({ journalId: state.selectedJournal }) },
      );
      dispatch({
        type: "SUBMIT_SUCCESS",
        txHash: result.hederaTxId ?? "pending — configure HEDERA_OPERATOR_ID/KEY to anchor on-chain",
        txTimestamp: formatTimestampUtc(result.hederaTimestamp ?? new Date().toISOString()),
      });
    } catch (err) {
      console.error("Submission failed:", err);
    }
  };

  const [showErrors, setShowErrors] = useState(false);

  const step1Errors = validateStep1(state);
  const canProceedStep1 = Object.keys(step1Errors).length === 0;

  const goBack = () => dispatch({ type: "GO_BACK" });
  const goNext = () => {
    if (state.step === 0 && !canProceedStep1) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    dispatch({ type: "GO_NEXT" });
  };

  return {
    navigation: { step: state.step, steps: STEP_LABELS as unknown as string[], goBack, goNext },
    paperDetails: {
      title: state.title,
      setTitle: (title: string) => dispatch({ type: "SET_TITLE", title }),
      abstract: state.abstract,
      setAbstract: (abstract: string) => dispatch({ type: "SET_ABSTRACT", abstract }),
      fileName: state.fileName,
      fileHash: state.fileHash,
      isHashing: state.isHashing,
      visibility: state.visibility,
      setVisibility: (visibility: "private" | "public") => dispatch({ type: "SET_VISIBILITY", visibility }),
      studyType: state.studyType,
      setStudyType: (studyType: "original" | "negative_result" | "replication" | "replication_failed" | "meta_analysis") => dispatch({ type: "SET_STUDY_TYPE", studyType }),
      keywords: state.keywords,
      keywordInput: state.keywordInput,
      setKeywordInput: (keywordInput: string) => dispatch({ type: "SET_KEYWORD_INPUT", keywordInput }),
      handleFileUpload,
      removeFile,
      addKeyword,
      removeKeyword,
    },
    provenance: {
      datasetHash: state.datasetHash,
      setDatasetHash: (datasetHash: string) => dispatch({ type: "SET_DATASET_HASH", datasetHash }),
      datasetUrl: state.datasetUrl,
      setDatasetUrl: (datasetUrl: string) => dispatch({ type: "SET_DATASET_URL", datasetUrl }),
      codeRepo: state.codeRepo,
      setCodeRepo: (codeRepo: string) => dispatch({ type: "SET_CODE_REPO", codeRepo }),
      codeCommit: state.codeCommit,
      setCodeCommit: (codeCommit: string) => dispatch({ type: "SET_CODE_COMMIT", codeCommit }),
      envHash: state.envHash,
      setEnvHash: (envHash: string) => dispatch({ type: "SET_ENV_HASH", envHash }),
      githubConnected: state.githubConnected,
      handleDatasetUpload,
      handleEnvUpload,
      simulateGithub,
    },
    contractLinking: {
      selectedContract: state.selectedContract,
      setSelectedContract: (selectedContract: string | null) => dispatch({ type: "SET_SELECTED_CONTRACT", selectedContract }),
      contracts,
      contract,
    },
    registration: {
      registered: state.registered,
      submitted: state.submitted,
      registering: state.registering,
      selectedJournal: state.selectedJournal,
      setSelectedJournal: (selectedJournal: string | null) => dispatch({ type: "SET_SELECTED_JOURNAL", selectedJournal }),
      journals: initialJournals,
      txHash: state.txHash,
      txTimestamp: state.txTimestamp,
      handleRegister,
      handleSubmit,
    },
    validation: {
      step1Errors: showErrors ? step1Errors : undefined,
    },
  };
}
