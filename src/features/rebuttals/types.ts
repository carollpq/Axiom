export interface RebuttalResponse {
  id: string;
  reviewId: string;
  criterionId?: string;
  position: "agree" | "disagree";
  justification: string;
  evidence?: string;
}

export interface RebuttalData {
  id: string;
  submissionId: string;
  status: "open" | "submitted" | "under_review" | "resolved";
  deadline: string;
  resolution?: "upheld" | "rejected" | "partial" | null;
  editorNotes?: string | null;
  responses: RebuttalResponse[];
  createdAt: string;
}
