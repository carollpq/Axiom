"use client";

import { useState, useEffect } from "react";
import type { Visibility, SignedContract } from "@/types/paper-registration";
import {
  mockSignedContracts,
  mockRegisteredJournals,
  STEP_LABELS,
} from "@/lib/mock-data/paper-registration";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { fetchApi } from "@/lib/api";

interface DbContractContributor {
  contributorName: string | null;
  contributionPct: number;
}

interface DbContract {
  id: string;
  paperTitle: string;
  status: string;
  contractHash: string | null;
  createdAt: string;
  contributors: DbContractContributor[];
}

function mapDbContractToSigned(c: DbContract, index: number): SignedContract {
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
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [keywords, setKeywords] = useState(["machine learning", "reproducibility"]);
  const [keywordInput, setKeywordInput] = useState("");

  // Step 2: Provenance
  const [datasetHash, setDatasetHash] = useState("");
  const [datasetUrl, setDatasetUrl] = useState("");
  const [codeRepo, setCodeRepo] = useState("");
  const [codeCommit, setCodeCommit] = useState("");
  const [envHash, setEnvHash] = useState("");
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
  const [dbContracts, setDbContracts] = useState<SignedContract[] | null>(null);

  // Fetch fully-signed contracts from API
  useEffect(() => {
    if (!isConnected || !user) {
      setDbContracts(null);
      return;
    }

    let cancelled = false;

    fetchApi<DbContract[]>(`/api/contracts?wallet=${user.walletAddress}`)
      .then((data) => {
        if (cancelled) return;
        const signed = data
          .filter((c) => c.status === "fully_signed")
          .map(mapDbContractToSigned);
        setDbContracts(signed.length > 0 ? signed : null);
      })
      .catch(() => {
        if (!cancelled) setDbContracts(null);
      });

    return () => {
      cancelled = true;
    };
  }, [isConnected, user]);

  const contracts = dbContracts ?? mockSignedContracts;

  // Derived
  const contract = contracts.find(c => c.id === selectedContract);
  const canProceedStep1 = !!(title.trim() && abstract.trim() && fileHash);

  // Handlers
  const simulateFileUpload = () => {
    setFileName("paper_draft_v1.pdf");
    setFileHash("a3f7c9e1b2d84056e9f1a7b3c2d5e8f0" + "1a2b3c4d5e6f7890");
  };

  const removeFile = () => {
    setFileName("");
    setFileHash("");
  };

  const simulateDatasetUpload = () => {
    setDatasetHash("d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9" + "0b1c2d3e4f5a6b7c");
  };

  const simulateEnvUpload = () => {
    setEnvHash("e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0" + "c1d2e3f4a5b6c7d8");
  };

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
      // 1. Create the paper
      const paper = await fetchApi<{ id: string }>("/api/papers", {
        method: "POST",
        body: JSON.stringify({
          title,
          abstract,
          wallet: user.walletAddress,
          studyType: "original",
        }),
      });

      // 2. Create the first version with hashes
      await fetchApi(`/api/papers/${paper.id}/versions`, {
        method: "POST",
        body: JSON.stringify({
          paperHash: fileHash,
          datasetHash: datasetHash || null,
          codeRepoUrl: codeRepo || null,
          codeCommitHash: codeCommit || null,
          envSpecHash: envHash || null,
        }),
      });

      // 3. Update paper status to registered + set visibility
      await fetchApi(`/api/papers/${paper.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "registered",
          visibility,
        }),
      });

      // Mock tx values until Hedera is wired
      setTxHash("0x" + Math.random().toString(16).slice(2, 10) + "..." + Math.random().toString(16).slice(2, 6));
      setTxTimestamp(new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC");
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
    simulateFileUpload, removeFile,
    addKeyword, removeKeyword,
    // Step 2
    datasetHash, setDatasetHash,
    datasetUrl, setDatasetUrl,
    codeRepo, setCodeRepo,
    codeCommit, setCodeCommit,
    envHash, setEnvHash,
    githubConnected,
    simulateDatasetUpload, simulateEnvUpload, simulateGithub,
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
