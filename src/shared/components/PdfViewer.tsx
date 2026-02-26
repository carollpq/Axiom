"use client";

import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

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
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div
          className="rounded-lg flex items-center justify-center"
          style={{
            width: "85%",
            height: "80%",
            background: "rgba(45,42,38,0.4)",
            border: "2px dashed rgba(120,110,95,0.25)",
          }}
        >
          <div className="text-center">
            <svg
              className="mx-auto mb-3"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6a6050"
              strokeWidth="1.5"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <div className="text-[#6a6050] font-serif text-sm">PDF Viewer</div>
            {title && (
              <div className="text-[#4a4238] font-serif text-xs mt-1 max-w-[280px] truncate">
                {title}
              </div>
            )}
          </div>
        </div>
      </div>
    );
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
