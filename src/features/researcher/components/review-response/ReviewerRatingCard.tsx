"use client";

import { ProtocolRatingRow } from "./ProtocolRatingRow";

interface ProtocolRatings {
  actionableFeedback: number;
  deepEngagement: number;
  fairObjective: number;
  justifiedRecommendation: number;
  appropriateExpertise: number;
}

const PROTOCOL_LABELS: { key: keyof ProtocolRatings; label: string }[] = [
  { key: "actionableFeedback", label: "Actionable Feedback" },
  { key: "deepEngagement", label: "Deep Engagement" },
  { key: "fairObjective", label: "Fair & Objective" },
  { key: "justifiedRecommendation", label: "Justified Recommendation" },
  { key: "appropriateExpertise", label: "Appropriate Expertise" },
];

interface ReviewerRatingCardProps {
  reviewId: string;
  ratings: ProtocolRatings;
  comment: string;
  onRatingChange: (key: keyof ProtocolRatings, value: number) => void;
  onCommentChange: (value: string) => void;
}

export function ReviewerRatingCard({
  reviewId,
  ratings,
  comment,
  onRatingChange,
  onCommentChange,
}: ReviewerRatingCardProps) {
  return (
    <div
      className="rounded-md p-4 mt-4"
      style={{ background: "rgba(30,28,25,0.5)", border: "1px solid rgba(120,110,95,0.1)" }}
    >
      <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-3">
        Rate This Reviewer
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-3">
        {PROTOCOL_LABELS.map(({ key, label }) => (
          <ProtocolRatingRow
            key={key}
            label={label}
            value={ratings[key]}
            onChange={(v) => onRatingChange(key, v)}
          />
        ))}
      </div>
      <div>
        <label className="text-[10px] text-[#8a8070] block mb-1">
          Anonymous Comment (optional)
        </label>
        <textarea
          className="w-full rounded-md px-3 py-2 text-[12px] text-[#d4ccc0] font-serif resize-none"
          style={{
            background: "rgba(45,42,38,0.5)",
            border: "1px solid rgba(120,110,95,0.15)",
          }}
          rows={2}
          placeholder="Optional feedback for this reviewer..."
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
        />
      </div>
    </div>
  );
}
