"use client";

import { useState, useCallback } from "react";
import type { Visibility, SignedContract } from "@/types/paper-registration";
import {
  mockSignedContracts,
  mockRegisteredJournals,
} from "@/lib/mock-data/paper-registration";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { fetchApi } from "@/lib/api";
import { hashFile } from "@/lib/hashing";
import type { ApiContract, ApiPaperVersion } from "@/types/api";
import { useAuthFetch } from "@/hooks/useAuthFetch";

const STEP_LABELS = ["Paper Details", "Provenance", "Contract", "Register / Submit"];

function mapDbContractToSigned(c: ApiContract, index: number): SignedContract {
  const contribSummary = c.contributors
    .map((cc) => `${cc.contributorName ?? "Unknown"} (${cc.contributionPct}%)`)
    .join(", ");

  return {
    id: index + 1,
    title: c.paperTitle,
    hash: c.contractHash ?? "\u2014",
    contributors: contribSummary || "\u2014",
    date: c.createdAt.slice(0, 10),
  };
}

export function usePaperRegistration() {
  const { user, isConnected } = useCurrentUser();

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

  // DB-fetched contracts
  const { data: rawContracts } = useAuthFetch<ApiContract[]>(
    () => fetchApi<ApiContract[]>("/api/contracts"),
  );

  const dbContracts: SignedContract[] | null = rawContracts
    ? (() => {
        const signed = rawContracts
          .filter((c) => c.status === "fully_signed")
          .map(mapDbContractToSigned);
        return signed.length > 0 ? signed : null;
      })()
    : null;

  const contracts = dbContracts ?? mockSignedContracts;

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

  // Upload a file to R2 via presigned URL. Returns the object key, or null if
  // storage is not configured or the upload fails (non-fatal).
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
      // Non-fatal — gracefully skip if storage is not configured or unavailable
      console.warn("[R2] Upload skipped:", err);
      return null;
    }
  };

  const handleRegister = async () => {
    if (!isConnected || !user) {
      // Fall back to mock behavior when not connected
      setTxHash("0x" + Math.random().toString(16).slice(2, 10) + "..." + Math.random().toString(16).slice(2, 6));
      setTxTimestamp("2026-02-08 11:42:15 UTC");
      setRegistered(true);
      return;
    }

    setRegistering(true);
    try {
      // 1. Upload files to R2 (non-fatal if storage not configured).
      // Dataset and env keys are derivable as `{folder}/{hash}` so we don't
      // need to store them separately — just ensure the objects are in R2.
      const fileStorageKey = uploadedFile
        ? await uploadToR2(uploadedFile, fileHash, "papers")
        : null;
      if (uploadedDatasetFile && datasetHash) {
        await uploadToR2(uploadedDatasetFile, datasetHash, "datasets");
      }
      if (uploadedEnvFile && envHash) {
        await uploadToR2(uploadedEnvFile, envHash, "environments");
      }

      // 2. Create the paper
      const paper = await fetchApi<{ id: string }>("/api/papers", {
        method: "POST",
        body: JSON.stringify({
          title,
          abstract,
          studyType: "original",
        }),
      });

      // 3. Create the first version + anchor on HCS (server-side, non-fatal if unconfigured)
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

      // 3. Update paper status to registered + set visibility
      await fetchApi(`/api/papers/${paper.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "registered", visibility }),
      });

      // Use real HCS receipt if anchored, otherwise show a pending note
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

    // Journal submission — future work, just update status for now
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
