"use client";

import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { PdfViewerPlaceholder } from "./PdfViewerPlaceholder";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  fileUrl?: string;
  title?: string;
}

export function PdfViewer({ fileUrl, title }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [width, setWidth] = useState<number | undefined>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!fileUrl) {
    return <PdfViewerPlaceholder title={title} />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sticky nav bar */}
      <div
        className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(26,24,22,0.95)",
          borderBottom: "1px solid rgba(120,110,95,0.15)",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Title */}
        <div
          className="font-serif text-[12px] text-[#8a8070] truncate mr-4"
          style={{ maxWidth: "60%" }}
        >
          {title ?? "Document"}
        </div>

        {/* Page controls */}
        {numPages > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
              className="font-serif text-[18px] leading-none cursor-pointer disabled:opacity-30"
              style={{ color: "#8a8070" }}
            >
              ‹
            </button>
            <span className="font-serif text-[11px] text-[#6a6050] tabular-nums">
              {pageNumber} / {numPages}
            </span>
            <button
              onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
              disabled={pageNumber >= numPages}
              className="font-serif text-[18px] leading-none cursor-pointer disabled:opacity-30"
              style={{ color: "#8a8070" }}
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* PDF content area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto flex justify-center py-4 px-3"
      >
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages }) => {
            setNumPages(numPages);
            setPageNumber(1);
          }}
          loading={<PdfLoadingState />}
          error={<PdfErrorState />}
        >
          <Page
            pageNumber={pageNumber}
            width={width ? width - 24 : undefined}
            renderAnnotationLayer
            renderTextLayer
            className="shadow-lg"
          />
        </Document>
      </div>
    </div>
  );
}

function PdfLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <div
        className="animate-pulse rounded"
        style={{
          width: 480,
          height: 640,
          background: "rgba(45,42,38,0.5)",
        }}
      />
      <div className="font-serif text-[12px] text-[#6a6050]">Loading PDF…</div>
    </div>
  );
}

function PdfErrorState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#d4645a"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div className="font-serif text-[13px] text-[#d4645a]">
        Could not load PDF
      </div>
      <div className="font-serif text-[11px] text-[#6a6050] text-center max-w-[240px]">
        The file may be unavailable or the URL may have expired.
      </div>
    </div>
  );
}
