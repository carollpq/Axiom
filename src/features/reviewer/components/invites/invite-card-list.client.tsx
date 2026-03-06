"use client";

import { useState } from "react";
import { InviteCard } from "./invite-card.client";
import type { AssignedReviewExtended } from "@/src/features/reviewer/types";

interface InviteCardListProps {
  invites: AssignedReviewExtended[];
  onAccept?: (submissionId: string) => Promise<void>;
  onReject?: (submissionId: string) => Promise<void>;
}

export function InviteCardList({ invites: initialInvites, onAccept, onReject }: InviteCardListProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [invites, setInvites] = useState(initialInvites);

  const handleAccept = async (submissionId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/accept-assignment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to accept assignment");
      }

      // Remove the accepted invite from the UI
      setInvites((prev) =>
        prev.filter((inv) => inv.submissionId !== submissionId)
      );

      if (onAccept) await onAccept(submissionId);
    } catch (error) {
      console.error("Error accepting assignment:", error);
      // Optionally show error toast here
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (submissionId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/accept-assignment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline" }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to decline assignment");
      }

      // Remove the rejected invite from the UI
      setInvites((prev) =>
        prev.filter((inv) => inv.submissionId !== submissionId)
      );

      if (onReject) await onReject(submissionId);
    } catch (error) {
      console.error("Error declining assignment:", error);
      // Optionally show error toast here
    } finally {
      setIsLoading(false);
    }
  };

  if (invites.length === 0) {
    return (
      <div
        className="rounded-lg p-12 text-center"
        style={{
          backgroundColor: "rgba(120,110,95,0.15)",
          color: "#8a8070",
        }}
      >
        <p className="font-serif">No pending invitations at this time</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {invites.map((invite) => (
        <InviteCard
          key={invite.assignmentId}
          review={invite}
          paperAbstract={invite.abstract}
          authors={invite.authors}
          pdfUrl={invite.pdfUrl}
          editorName={invite.editorName}
          onAccept={handleAccept}
          onReject={handleReject}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
