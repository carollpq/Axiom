"use client";

import { useState, useCallback } from "react";
import type { Visibility, SignedContract } from "@/features/author/types/paper-registration";
import { mockSignedContracts, mockRegisteredJournals } from "@/features/author/mock-data/paper-registration";
import { useCurrentUser } from "@/src/shared/hooks/useCurrentUser";
import { fetchApi } from "@/lib/api";
import { hashFile } from "@/lib/hashing";
import { isLitConfigured, getLitClient } from "@/lib/lit/client";
import { buildWalletListConditions } from "@/lib/lit/access-control";
import { encryptFileWithLit } from "@/lib/lit/encrypt";
import { mapDbContractToSigned } from "@/features/author/mappers/contract";
import type { ApiContract, ApiPaperVersion } from "@/src/shared/types/api";

const STEP_LABELS = ["Paper Details", "Provenance", "Contract", "Register / Submit"];

export function usePaperRegistration(initialContracts: ApiContract[]) {
  const { user, isConnected, account } = useCurrentUser();

  // Navigation
  const [step, setStep] = useState(0);

  // Step 1: Paper Details
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileHash, setFileHash] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [keywords, setKeywords] = useState(["machine learning", "reproducibility"]);
  const [keywordInput, setKeywordInput] = useState("");

  // Step 2: Provenance
  const [datasetHash, setDatasetHash] = useState("");
  const [datasetUrl, setDatasetUrl] = useState("");
  const [uploadedDatasetFile, setUploadedDatasetFile] = useState<File | null>(null);
  const [codeRepo, setCodeRepo] = useState("");
  const [codeCommit, setCodeCommit] = useState("");
  const [envHash, setEnvHash] = useState("");
  const [uploadedEnvFile, setUploadedEnvFile] = useState<File | null>(null);
  const [githubConnected, setGithubConnected] = useState(false);

  // Step 3: Contract
  const [selectedContract, setSelectedContract] = useState<number | null>(null);

  // Step 4: Confirmation
  const [registered, setRegistered] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<number | null>(null);
  const [txHash, setTxHash] = useState("");
  const [txTimestamp, setTxTimestamp] = useState("");
  const [registering, setRegistering] = useState(false);

  // Contracts from server — filter to fully signed only
  const signedContracts = initialContracts
    .filter((c) => c.status === "fully_signed")
    .map(mapDbContractToSigned);
  const contracts: SignedContract[] = signedContracts.length > 0 ? signedContracts : mockSignedContracts;

  // Hashing state
  const [isHashing, setIsHashing] = useState(false);

  // Derived
  const contract = contracts.find(c => c.id === selectedContract);
  const canProceedStep1 = !!(title.trim() && abstract.trim() && fileHash);

  // Handlers
  const handleFileUpload = useCallback(async (file: File) => {
    setFileName(file.name);
    setFileHash("");
    setUploadedFile(file);
    setIsHashing(true);
    try {
      const hash = await hashFile(file);
      setFileHash(hash);
    } finally {
      setIsHashing(false);
    }
  }, []);

  const removeFile = () => {
    setFileName("");
    setFileHash("");
    setUploadedFile(null);
  };

  const handleDatasetUpload = useCallback(async (file: File) => {
    setUploadedDatasetFile(file);
    setIsHashing(true);
    try {
      const hash = await hashFile(file);
      setDatasetHash(hash);
    } finally {
      setIsHashing(false);
    }
  }, []);

  const handleEnvUpload = useCallback(async (file: File) => {
    setUploadedEnvFile(file);
    setIsHashing(true);
    try {
      const hash = await hashFile(file);
      setEnvHash(hash);
    } finally {
      setIsHashing(false);
    }
  }, []);

  const simulateGithub = () => {
    setGithubConnected(true);
    setCodeRepo("https://github.com/areeves/transformer-reproducibility");
    setCodeCommit("a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6");
  };

  const addKeyword = () => {
    if (keywordInput.trim()) {
      setKeywords(prev => [...prev, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(prev => prev.filter((_, j) => j !== index));
  };

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
      setTxHash("0x" + Math.random().toString(16).slice(2, 10) + "..." + Math.random().toString(16).slice(2, 6));
      setTxTimestamp("2026-02-08 11:42:15 UTC");
      setRegistered(true);
      return;
    }

    setRegistering(true);
    try {
      let fileToUpload = uploadedFile;
      let litDataToEncryptHash: string | null = null;
      let litAccessConditionsJson: string | null = null;

      if (uploadedFile && fileHash && isLitConfigured() && account?.address) {
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
        ? await uploadToR2(fileToUpload, fileHash, "papers")
        : null;
      if (uploadedDatasetFile && datasetHash) {
        await uploadToR2(uploadedDatasetFile, datasetHash, "datasets");
      }
      if (uploadedEnvFile && envHash) {
        await uploadToR2(uploadedEnvFile, envHash, "environments");
      }

      const paper = await fetchApi<{ id: string }>("/api/papers", {
        method: "POST",
        body: JSON.stringify({
          title,
          abstract,
          studyType: "original",
          litDataToEncryptHash,
          litAccessConditionsJson,
        }),
      });

      const version = await fetchApi<ApiPaperVersion>(
        `/api/papers/${paper.id}/versions`,
        {
          method: "POST",
          body: JSON.stringify({
            paperHash: fileHash,
            fileStorageKey,
            datasetHash: datasetHash || null,
            codeRepoUrl: codeRepo || null,
            codeCommitHash: codeCommit || null,
            envSpecHash: envHash || null,
          }),
        },
      );

      await fetchApi(`/api/papers/${paper.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "registered", visibility }),
      });

      setTxHash(
        version.hederaTxId ??
          "pending — configure HEDERA_OPERATOR_ID/KEY to anchor on-chain",
      );
      setTxTimestamp(
        version.hederaTimestamp
          ? version.hederaTimestamp.replace("T", " ").slice(0, 19) + " UTC"
          : new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
      );
      setRegistered(true);
    } catch (err) {
      console.error("Registration failed:", err);
    } finally {
      setRegistering(false);
    }
  };

  const handleSubmit = async () => {
    if (!isConnected || !user) {
      setTxHash("0x" + Math.random().toString(16).slice(2, 10) + "..." + Math.random().toString(16).slice(2, 6));
      setTxTimestamp("2026-02-08 11:43:02 UTC");
      setSubmitted(true);
      return;
    }

    setTxHash("0x" + Math.random().toString(16).slice(2, 10) + "..." + Math.random().toString(16).slice(2, 6));
    setTxTimestamp(new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC");
    setSubmitted(true);
  };

  const goBack = () => { if (step > 0) setStep(step - 1); };
  const goNext = () => { if (step < 3) setStep(step + 1); };

  return {
    // Navigation
    step,
    setStep,
    steps: STEP_LABELS,
    goBack,
    goNext,
    // Step 1
    title, setTitle,
    abstract, setAbstract,
    fileName, fileHash,
    visibility, setVisibility,
    keywords, keywordInput, setKeywordInput,
    handleFileUpload, removeFile, isHashing,
    addKeyword, removeKeyword,
    // Step 2
    datasetHash, setDatasetHash,
    datasetUrl, setDatasetUrl,
    codeRepo, setCodeRepo,
    codeCommit, setCodeCommit,
    envHash, setEnvHash,
    githubConnected,
    handleDatasetUpload, handleEnvUpload, simulateGithub,
    // Step 3
    selectedContract, setSelectedContract,
    contracts,
    contract,
    // Step 4
    registered, submitted,
    selectedJournal, setSelectedJournal,
    journals: mockRegisteredJournals,
    txHash, txTimestamp,
    handleRegister, handleSubmit,
    // Derived
    canProceedStep1,
    registering,
  };
}
