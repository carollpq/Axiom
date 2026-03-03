"use client";

import { useReducer, useMemo, useCallback } from "react";
import type {
  CriterionRating,
  GeneralComments,
  Recommendation,
  PaperUnderReview,
  ReviewCriterion,
} from "@/src/features/reviewer/types";
import { canonicalJson, hashString } from "@/src/shared/lib/hashing";
import { mockTxHash, formatTimestampUtc } from "@/src/shared/lib/format";
import type { DbReviewAssignment } from "@/src/features/reviews/queries";
import {
  reviewWorkspaceReducer,
  createInitialState,
  selectCompletedCount,
  selectAllCriteriaMet,
  selectCanSubmit,
} from "@/src/features/reviewer/reducers/review-workspace";

// Placeholder paper — used when no assignment is provided
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

// Placeholder criteria — used when no criteria are published yet
const PLACEHOLDER_CRITERIA: ReviewCriterion[] = [
  { id: 1, text: "Methodology is reproducible",        onChainHash: "0x3a1f8b2c9d4e5f60a7b8c9d0e1f2a3b4c5d6e7f8" },
  { id: 2, text: "Statistical analysis is appropriate", onChainHash: "0x4b2a9c3d0e5f6a71b8c9d0e1f2a3b4c5d6e7f8a9" },
  { id: 3, text: "Dataset is accessible and described", onChainHash: "0x5c3b0d4e1f6a7b82c9d0e1f2a3b4c5d6e7f8a9b0" },
  { id: 4, text: "Claims are supported by evidence",    onChainHash: "0x6d4c1e5f2a7b8c93d0e1f2a3b4c5d6e7f8a9b0c1" },
];

function mapAssignmentToPaper(assignment: NonNullable<DbReviewAssignment>): PaperUnderReview {
  const paper = assignment.submission.paper;
  const journal = assignment.submission.journal;
  const versions = paper.versions ?? [];
  const latestVersion = versions.length > 0 ? versions[versions.length - 1] : null;

  const provenance = latestVersion
    ? [
        { label: "Paper Hash", hash: latestVersion.paperHash, verified: true },
        ...(latestVersion.datasetHash
          ? [{ label: "Dataset", hash: latestVersion.datasetHash, verified: true }]
          : []),
        ...(latestVersion.codeRepoUrl
          ? [{ label: "Code Repository", hash: latestVersion.codeCommitHash ?? latestVersion.codeRepoUrl, url: latestVersion.codeRepoUrl, verified: !!latestVersion.codeCommitHash }]
          : []),
        ...(latestVersion.envSpecHash
          ? [{ label: "Environment Spec", hash: latestVersion.envSpecHash, verified: true }]
          : []),
      ]
    : PLACEHOLDER_PAPER.provenance;

  return {
    id: 0, // numeric id not used for real submissions
    title: paper.title,
    abstract: paper.abstract ?? "",
    journal: journal.name,
    version: latestVersion ? `v${latestVersion.versionNumber}` : "v1",
    anonymized: true,
    pdfUrl: "#",
    provenance,
  };
}

interface DbCriterion {
  id: string;
  label: string;
  evaluationType: string;
  description?: string;
  required: boolean;
}

function mapAssignmentToCriteria(assignment: NonNullable<DbReviewAssignment>): ReviewCriterion[] {
  const reviewCriteriaRow = assignment.submission.reviewCriteria?.[0];
  if (!reviewCriteriaRow?.criteriaJson) return PLACEHOLDER_CRITERIA;

  try {
    const parsed = JSON.parse(reviewCriteriaRow.criteriaJson) as DbCriterion[];
    return parsed.map((c, idx) => ({
      id: idx + 1,
      text: c.label,
      onChainHash: reviewCriteriaRow.criteriaHash,
    }));
  } catch {
    return PLACEHOLDER_CRITERIA;
  }
}

export function useReviewWorkspace(assignment?: NonNullable<DbReviewAssignment>) {
  const paper = useMemo(
    () => (assignment ? mapAssignmentToPaper(assignment) : PLACEHOLDER_PAPER),
    [assignment],
  );

  const criteria = useMemo(
    () => (assignment ? mapAssignmentToCriteria(assignment) : PLACEHOLDER_CRITERIA),
    [assignment],
  );

  const [state, dispatch] = useReducer(
    reviewWorkspaceReducer,
    criteria,
    createInitialState,
  );

  const completedCount = selectCompletedCount(state);
  const allCriteriaMet = selectAllCriteriaMet(state);
  const canSubmit = selectCanSubmit(state);

  const setCriterionRating = useCallback((id: number, rating: CriterionRating) => {
    dispatch({ type: "SET_CRITERION_RATING", id, rating });
  }, []);

  const setCriterionComment = useCallback((id: number, comment: string) => {
    dispatch({ type: "SET_CRITERION_COMMENT", id, comment });
  }, []);

  const setGeneralComment = useCallback((field: keyof GeneralComments, value: string) => {
    dispatch({ type: "SET_GENERAL_COMMENT", field, value });
  }, []);

  const saveDraft = useCallback(() => {
    dispatch({ type: "SAVE_DRAFT" });
  }, []);

  const submitReview = useCallback(async () => {
    if (!canSubmit) return;
    dispatch({ type: "SUBMIT_START" });

    const met     = Object.values(state.evaluations).filter(e => e.rating === "Yes").length;
    const partial = Object.values(state.evaluations).filter(e => e.rating === "Partially").length;
    const notMet  = Object.values(state.evaluations).filter(e => e.rating === "No").length;

    // Compute review hash (excluding confidentialEditorComments — those never leave the server)
    const reviewPayload = {
      evaluations: state.evaluations,
      recommendation: state.recommendation,
      strengths: state.generalComments.strengths,
      weaknesses: state.generalComments.weaknesses,
      questionsForAuthors: state.generalComments.questionsForAuthors,
    };
    const reviewHash = await hashString(canonicalJson(reviewPayload));

    if (!assignment) {
      // Placeholder mode — just show mock result
      dispatch({
        type: "SUBMIT_SUCCESS",
        submissionResult: {
          txHash: mockTxHash(),
          timestamp: formatTimestampUtc(new Date().toISOString()),
          paperHash: paper.provenance[0]?.hash.slice(0, 16) + "...",
          reviewHash: reviewHash.slice(0, 16) + "...",
          criteriaSummary: { met, partial, notMet },
        },
      });
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${assignment.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          criteriaEvaluations: state.evaluations,
          strengths: state.generalComments.strengths,
          weaknesses: state.generalComments.weaknesses,
          questionsForAuthors: state.generalComments.questionsForAuthors,
          confidentialEditorComments: state.generalComments.confidentialEditorComments,
          recommendation: state.recommendation,
          reviewHash,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("[Review submit] API error:", err);
        dispatch({ type: "SUBMIT_ERROR" });
        return;
      }

      const result = await response.json() as { reviewId: string; hederaTxId?: string; hederaTimestamp?: string };

      dispatch({
        type: "SUBMIT_SUCCESS",
        submissionResult: {
          txHash: result.hederaTxId ?? "pending",
          timestamp: formatTimestampUtc(result.hederaTimestamp ?? new Date().toISOString()),
          paperHash: paper.provenance[0]?.hash.slice(0, 16) + "...",
          reviewHash: reviewHash.slice(0, 16) + "...",
          criteriaSummary: { met, partial, notMet },
        },
      });
    } catch (err) {
      console.error("[Review submit] Unexpected error:", err);
      dispatch({ type: "SUBMIT_ERROR" });
    }
  }, [assignment, canSubmit, state.evaluations, state.recommendation, state.generalComments, paper.provenance]);

  return {
    paper,
    criteria,
    evaluations: state.evaluations,
    generalComments: state.generalComments,
    recommendation: state.recommendation,
    isDraft: state.isDraft,
    isSubmitted: state.isSubmitted,
    submissionResult: state.submissionResult,
    criteriaCollapsed: state.criteriaCollapsed,
    setCriteriaCollapsed: (criteriaCollapsed: boolean) => dispatch({ type: "SET_CRITERIA_COLLAPSED", criteriaCollapsed }),
    completedCount,
    allCriteriaMet,
    canSubmit,
    setCriterionRating,
    setCriterionComment,
    setGeneralComment,
    setRecommendation: (recommendation: Recommendation | null) => dispatch({ type: "SET_RECOMMENDATION", recommendation }),
    saveDraft,
    submitReview,
    isSubmitting: state.isSubmitting,
  };
}
