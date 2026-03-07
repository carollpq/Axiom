"use client";

import { useState } from "react";
import { DynamicPdfViewer as PdfViewer } from "@/src/shared/components/DynamicPdfViewer";
import { AbstractPaginator } from "./AbstractPaginator";
import type { AssignedReview } from "@/src/features/reviewer/types";

interface InviteCardProps {
  review: AssignedReview;
  paperAbstract?: string;
  authors?: string[];
  pdfUrl?: string;
  editorName?: string;
  onAccept?: (submissionId: string) => Promise<void>;
  onReject?: (submissionId: string) => Promise<void>;
  isLoading?: boolean;
}

export function InviteCard({
  review,
  paperAbstract = "",
  authors = ["Author1", "Author2"],
  pdfUrl,
  editorName = "Editor",
  onAccept,
  onReject,
  isLoading = false,
}: InviteCardProps) {
  const [abstractPage, setAbstractPage] = useState(0);
  const [isResponding, setIsResponding] = useState(false);

  const handleAccept = async () => {
    if (!onAccept || isResponding || isLoading || !review.submissionId) return;
    setIsResponding(true);
    try {
      await onAccept(review.submissionId);
    } finally {
      setIsResponding(false);
    }
  };

  const handleReject = async () => {
    if (!onReject || isResponding || isLoading || !review.submissionId) return;
    setIsResponding(true);
    try {
      await onReject(review.submissionId);
    } finally {
      setIsResponding(false);
    }
  };

  const abstractPages = paperAbstract
    ? paperAbstract.match(/[\s\S]{0,400}/g) || []
    : [""];
  const currentAbstractPage = abstractPages[abstractPage] || "";

  return (
    <div
      className="rounded-lg p-6 grid grid-cols-12 gap-6"
      style={{ backgroundColor: "rgba(45,42,38,0.6)" }}
    >
      {/* Left Column: Paper Info (3 cols) */}
      <div className="col-span-3 border-r" style={{ borderColor: "rgba(120,110,95,0.3)" }}>
        <div className="space-y-4">
          {/* Paper Title */}
          <div>
            <h3
              className="font-serif font-bold text-sm leading-tight line-clamp-3"
              style={{ color: "#d4ccc0" }}
            >
              {review.title}
            </h3>
          </div>

          {/* Authors */}
          <div>
            <p
              className="text-xs font-serif"
              style={{ color: "#b0a898" }}
            >
              {authors.join(", ")}
            </p>
          </div>

          {/* Abstract Preview with Pagination */}
          <div
            className="rounded p-3 text-xs font-serif leading-relaxed"
            style={{
              backgroundColor: "rgba(120,110,95,0.1)",
              color: "#8a8070",
              maxHeight: "180px",
              overflowY: "auto",
            }}
          >
            {currentAbstractPage || "No abstract available"}
          </div>

          {/* Abstract Pagination */}
          <AbstractPaginator
            pages={abstractPages}
            currentPage={abstractPage}
            onPrev={() => setAbstractPage(Math.max(0, abstractPage - 1))}
            onNext={() => setAbstractPage(Math.min(abstractPages.length - 1, abstractPage + 1))}
          />
        </div>
      </div>

      {/* Center Column: PDF Viewer (6 cols) */}
      <div className="col-span-6 flex items-center justify-center rounded border" style={{ borderColor: "rgba(120,110,95,0.3)", minHeight: "400px" }}>
        {pdfUrl ? (
          <PdfViewer fileUrl={pdfUrl} title={review.title} />
        ) : (
          <div
            className="text-center p-8"
            style={{ color: "#8a8070" }}
          >
            <p className="font-serif text-sm">PDF Viewer</p>
            <p className="font-serif text-xs mt-2">No PDF available</p>
          </div>
        )}
      </div>

      {/* Right Column: Invite Info (3 cols) */}
      <div
        className="col-span-3 rounded-lg p-4 space-y-4"
        style={{ backgroundColor: "rgba(120,110,95,0.1)" }}
      >
        <div>
          <p
            className="text-xs font-serif uppercase tracking-wider"
            style={{ color: "#8a8070" }}
          >
            Invite Information
          </p>
        </div>

        {/* Journal Name */}
        <div>
          <p
            className="text-xs font-serif uppercase tracking-wide"
            style={{ color: "#8a8070" }}
          >
            Journal Name
          </p>
          <p
            className="text-sm font-serif mt-1"
            style={{ color: "#d4ccc0" }}
          >
            {review.journal}
          </p>
        </div>

        {/* Editor */}
        <div>
          <p
            className="text-xs font-serif uppercase tracking-wide"
            style={{ color: "#8a8070" }}
          >
            Editor
          </p>
          <p
            className="text-sm font-serif mt-1"
            style={{ color: "#d4ccc0" }}
          >
            {editorName}
          </p>
        </div>

        {/* Assigned Timeline */}
        <div>
          <p
            className="text-xs font-serif uppercase tracking-wide"
            style={{ color: "#8a8070" }}
          >
            Assigned Timeline for Completion
          </p>
          <p
            className="text-sm font-serif mt-1"
            style={{ color: "#d4ccc0" }}
          >
            {review.daysLeft} days
          </p>
        </div>

        {/* Separator */}
        <div style={{ height: "1px", backgroundColor: "rgba(120,110,95,0.3)" }} />

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleAccept}
            disabled={isResponding || isLoading}
            className="flex-1 px-4 py-2 rounded font-serif text-sm transition-opacity disabled:opacity-50"
            style={{
              backgroundColor: "#8fbc8f",
              color: "#1a1816",
              fontWeight: "600",
            }}
          >
            {isResponding || isLoading ? "..." : "Accept"}
          </button>
          <button
            onClick={handleReject}
            disabled={isResponding || isLoading}
            className="flex-1 px-4 py-2 rounded font-serif text-sm transition-opacity disabled:opacity-50"
            style={{
              backgroundColor: "rgba(120,110,95,0.3)",
              color: "#d4ccc0",
            }}
          >
            {isResponding || isLoading ? "..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}
