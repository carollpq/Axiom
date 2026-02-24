"use client";

import { useState, useMemo, useCallback } from "react";
import type {
  CriterionRating,
  CriterionEvaluation,
  GeneralComments,
  Recommendation,
  SubmissionResult,
  PaperUnderReview,
  ReviewCriterion,
} from "@/src/shared/types/review-workspace";

// Placeholder paper — replace with real data once review workspace routing is wired up
const PLACEHOLDER_PAPER: PaperUnderReview = {
  id: 2,
  title: "Distributed Consensus in Heterogeneous IoT Networks",
  abstract:
    "We propose a novel consensus protocol for heterogeneous IoT environments that achieves Byzantine fault tolerance with O(n log n) message complexity. Our approach leverages device capability tiers to dynamically adjust quorum requirements, reducing latency by 47% compared to PBFT while maintaining equivalent safety guarantees.",
  journal: "IEEE Transactions on Distributed Systems",
  version: "v2.1",
  anonymized: true,
  pdfUrl: "#",
  provenance: [
    { label: "Paper Hash",      hash: "b7d4a1e8f3c26095d8e2a4b7c1f3e5d9a8b2c4e6f0a1d3b5c7e9f1a3b5d7e9f1", verified: true },
    { label: "Dataset",         hash: "c8e5b2f9a4d37106e9f3b5c8d2a4f6e0b9c3d5f7a1b2e4d6c8f0a2b4d6e8f0a2", url: "https://zenodo.org/record/example", verified: true },
    { label: "Code Repository", hash: "d9f6c3a0b5e48217f0a4c6d9e3b5a7f1c0d4e6a8b2c3f5d7a9b1c3e5f7a9b1c3", url: "https://github.com/anon/iot-consensus", verified: true },
    { label: "Environment Spec",hash: "e0a7d4b1c6f59328a1b5d7e0f4c6b8a2d1e5f7b9c3d4a6e8f0b2d4c6a8e0b2d4", verified: false },
  ],
};

// Placeholder criteria — replace with DB-sourced criteria once submissions store them
const PLACEHOLDER_CRITERIA: ReviewCriterion[] = [
  { id: 1, text: "Methodology is reproducible",        onChainHash: "0x3a1f8b2c9d4e5f60a7b8c9d0e1f2a3b4c5d6e7f8" },
  { id: 2, text: "Statistical analysis is appropriate", onChainHash: "0x4b2a9c3d0e5f6a71b8c9d0e1f2a3b4c5d6e7f8a9" },
  { id: 3, text: "Dataset is accessible and described", onChainHash: "0x5c3b0d4e1f6a7b82c9d0e1f2a3b4c5d6e7f8a9b0" },
  { id: 4, text: "Claims are supported by evidence",    onChainHash: "0x6d4c1e5f2a7b8c93d0e1f2a3b4c5d6e7f8a9b0c1" },
];

export function useReviewWorkspace() {
  const [evaluations, setEvaluations] = useState<Record<number, CriterionEvaluation>>(() => {
    const init: Record<number, CriterionEvaluation> = {};
    for (const c of PLACEHOLDER_CRITERIA) {
      init[c.id] = { criterionId: c.id, rating: null, comment: "" };
    }
    return init;
  });

  const [generalComments, setGeneralComments] = useState<GeneralComments>({
    strengths: "",
    weaknesses: "",
    questionsForAuthors: "",
    confidentialEditorComments: "",
  });

  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isDraft, setIsDraft] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [criteriaCollapsed, setCriteriaCollapsed] = useState(false);

  const completedCount = useMemo(
    () => Object.values(evaluations).filter(e => e.rating !== null).length,
    [evaluations],
  );

  const allCriteriaMet = useMemo(
    () => Object.values(evaluations).every(e => e.rating === "Yes"),
    [evaluations],
  );

  const canSubmit = useMemo(
    () =>
      Object.values(evaluations).every(e => e.rating !== null) &&
      recommendation !== null &&
      generalComments.strengths.trim().length > 0,
    [evaluations, recommendation, generalComments.strengths],
  );

  const setCriterionRating = useCallback((id: number, rating: CriterionRating) => {
    setEvaluations(prev => ({ ...prev, [id]: { ...prev[id], rating } }));
  }, []);

  const setCriterionComment = useCallback((id: number, comment: string) => {
    setEvaluations(prev => ({ ...prev, [id]: { ...prev[id], comment } }));
  }, []);

  const setGeneralComment = useCallback((field: keyof GeneralComments, value: string) => {
    setGeneralComments(prev => ({ ...prev, [field]: value }));
  }, []);

  const saveDraft = useCallback(() => { setIsDraft(true); }, []);

  const submitReview = useCallback(() => {
    const met     = Object.values(evaluations).filter(e => e.rating === "Yes").length;
    const partial = Object.values(evaluations).filter(e => e.rating === "Partially").length;
    const notMet  = Object.values(evaluations).filter(e => e.rating === "No").length;

    setSubmissionResult({
      txHash:    "0x" + Math.random().toString(16).slice(2, 10) + "..." + Math.random().toString(16).slice(2, 6),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
      paperHash: PLACEHOLDER_PAPER.provenance[0].hash.slice(0, 16) + "...",
      reviewHash:"0x" + Math.random().toString(16).slice(2, 18) + "...",
      criteriaSummary: { met, partial, notMet },
    });
    setIsSubmitted(true);
    setIsDraft(false);
  }, [evaluations]);

  return {
    paper: PLACEHOLDER_PAPER,
    criteria: PLACEHOLDER_CRITERIA,
    evaluations, generalComments, recommendation,
    isDraft, isSubmitted, submissionResult,
    criteriaCollapsed, setCriteriaCollapsed,
    completedCount, allCriteriaMet, canSubmit,
    setCriterionRating, setCriterionComment, setGeneralComment,
    setRecommendation, saveDraft, submitReview,
  };
}
