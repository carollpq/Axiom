"use client";

import { useState, useMemo, useCallback } from "react";
import type {
  CriterionRating,
  CriterionEvaluation,
  GeneralComments,
  Recommendation,
  SubmissionResult,
} from "@/src/shared/types/review-workspace";
import { mockPaper, mockCriteria } from "@/lib/mock-data/review-workspace";

export function useReviewWorkspace() {
  // Evaluations keyed by criterion id
  const [evaluations, setEvaluations] = useState<Record<number, CriterionEvaluation>>(() => {
    const init: Record<number, CriterionEvaluation> = {};
    for (const c of mockCriteria) {
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

  // Derived
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

  // Handlers
  const setCriterionRating = useCallback((id: number, rating: CriterionRating) => {
    setEvaluations(prev => ({
      ...prev,
      [id]: { ...prev[id], rating },
    }));
  }, []);

  const setCriterionComment = useCallback((id: number, comment: string) => {
    setEvaluations(prev => ({
      ...prev,
      [id]: { ...prev[id], comment },
    }));
  }, []);

  const setGeneralComment = useCallback((field: keyof GeneralComments, value: string) => {
    setGeneralComments(prev => ({ ...prev, [field]: value }));
  }, []);

  const saveDraft = useCallback(() => {
    setIsDraft(true);
  }, []);

  const submitReview = useCallback(() => {
    const met = Object.values(evaluations).filter(e => e.rating === "Yes").length;
    const partial = Object.values(evaluations).filter(e => e.rating === "Partially").length;
    const notMet = Object.values(evaluations).filter(e => e.rating === "No").length;

    setSubmissionResult({
      txHash: "0x" + Math.random().toString(16).slice(2, 10) + "..." + Math.random().toString(16).slice(2, 6),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
      paperHash: mockPaper.provenance[0].hash.slice(0, 16) + "...",
      reviewHash: "0x" + Math.random().toString(16).slice(2, 18) + "...",
      criteriaSummary: { met, partial, notMet },
    });
    setIsSubmitted(true);
    setIsDraft(false);
  }, [evaluations]);

  return {
    // Data
    paper: mockPaper,
    criteria: mockCriteria,
    // State
    evaluations,
    generalComments,
    recommendation,
    isDraft,
    isSubmitted,
    submissionResult,
    criteriaCollapsed,
    setCriteriaCollapsed,
    // Derived
    completedCount,
    allCriteriaMet,
    canSubmit,
    // Handlers
    setCriterionRating,
    setCriterionComment,
    setGeneralComment,
    setRecommendation,
    saveDraft,
    submitReview,
  };
}
