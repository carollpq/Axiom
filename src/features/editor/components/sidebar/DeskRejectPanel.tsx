"use client";

interface DeskRejectPanelProps {
  comment: string;
  onCommentChange: (v: string) => void;
  onSend: () => void;
}

export function DeskRejectPanel({
  comment,
  onCommentChange,
  onSend,
}: DeskRejectPanelProps) {
  return (
    <div className="p-4">
      <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-3">Desk Reject</div>

      <textarea
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
        placeholder="Add comment..."
        rows={4}
        className="w-full rounded-[6px] p-3 text-[12px] font-serif text-[#d4ccc0] outline-none resize-none"
        style={{
          background: "rgba(30,28,24,0.6)",
          border: "1px solid rgba(120,110,95,0.2)",
        }}
      />

      <div className="flex justify-end mt-2">
        <button
          onClick={onSend}
          className="px-5 py-2 rounded text-[12px] font-serif cursor-pointer"
          style={{
            background:
              "linear-gradient(135deg, rgba(200,100,90,0.25), rgba(180,80,70,0.15))",
            border: "1px solid rgba(200,100,90,0.4)",
            color: "#d4645a",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
