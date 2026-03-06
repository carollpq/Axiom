"use client";

import { useState } from "react";

interface Props {
  onInvokeRebuttal: (comment: string) => void;
  submitting: boolean;
}

export function AuthorFeedbackSection({ onInvokeRebuttal, submitting }: Props) {
  const [comment, setComment] = useState("");

  return (
    <div
      className="mb-6 rounded-md p-5"
      style={{
        background: "rgba(30,28,25,0.4)",
        border: "1px solid rgba(120,110,95,0.1)",
      }}
    >
      <h3 className="text-[14px] font-serif text-[#c9a44a] mb-2">
        Author Feedback
      </h3>
      <p className="text-[12px] text-[#8a8070] mb-3">
        Do you find the reviews unfair, biased or lacks depth? When you
        &lsquo;invoke rebuttal&rsquo;, this allows you to add an extra note
        countering the reviews and sends your note along with the reviews to the
        editor.
      </p>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add your comment..."
        rows={3}
        className="w-full px-3 py-2.5 rounded-md text-[12px] font-serif text-[#d4ccc0] resize-none mb-3"
        style={{
          background: "rgba(45,42,38,0.5)",
          border: "1px solid rgba(120,110,95,0.15)",
        }}
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onInvokeRebuttal(comment)}
          disabled={submitting}
          className="px-5 py-2 rounded-md text-[12px] font-medium cursor-pointer"
          style={{
            background: "rgba(201,164,74,0.15)",
            color: "#c9a44a",
            border: "1px solid rgba(201,164,74,0.3)",
            opacity: submitting ? 0.5 : 1,
          }}
        >
          {submitting ? "Submitting..." : "Invoke Rebuttal"}
        </button>
      </div>
    </div>
  );
}

export default AuthorFeedbackSection;
