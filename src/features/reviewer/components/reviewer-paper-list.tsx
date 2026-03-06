interface PaperItem {
  id: number;
  title: string;
  authors?: string[];
  abstract?: string;
}

interface ReviewerPaperListProps {
  papers: PaperItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function ReviewerPaperList({ papers, selectedId, onSelect }: ReviewerPaperListProps) {
  if (papers.length === 0) {
    return (
      <div className="p-6 text-center text-sm" style={{ color: "#8a8070" }}>
        No papers found
      </div>
    );
  }

  return (
    <div>
      {papers.map((paper) => (
        <button
          key={paper.id}
          onClick={() => onSelect(paper.id)}
          className="w-full text-left p-4 transition-colors"
          style={{
            background: selectedId === paper.id ? "rgba(45,42,38,0.8)" : "transparent",
            borderLeft: selectedId === paper.id ? "3px solid #c9a44a" : "3px solid transparent",
            borderBottom: "1px solid rgba(120,110,95,0.1)",
          }}
        >
          <div className="font-serif text-sm text-[#e8e0d4] mb-1 leading-snug">
            {paper.title}
          </div>
          {paper.authors && paper.authors.length > 0 && (
            <div className="text-[11px] text-[#8a8070] mb-2">
              {paper.authors.join(", ")}
            </div>
          )}
          {paper.abstract && (
            <div className="text-[11px] text-[#6a6050] leading-relaxed line-clamp-3">
              {paper.abstract}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
