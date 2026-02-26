interface PdfViewerPlaceholderProps {
  title?: string;
}

export function PdfViewerPlaceholder({ title }: PdfViewerPlaceholderProps) {
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
